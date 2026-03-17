const Question = require("../models/Question");
const Participant = require("../models/Participant");
const Phase1Session = require("../models/Phase1Session");
const Match = require("../models/Match");
const { computePhase1Qualification } = require("../utils/phase1Qualification");

const PHASE2_RECONNECT_GRACE_MS = 3 * 60 * 1000;

// ------------------------------
// Phase 1 state
// ------------------------------
let isPhase1Active = false;
let questionCache = null;
const participantShuffleMap = new Map();
const confirmedAnswers = new Map();
const participantSubmittedMap = new Map();
const participantScoreMap = new Map();
const socketToUSN = new Map();
const usnToSocket = new Map();
let qualificationComputed = false;

// ------------------------------
// Phase 2 state
// ------------------------------
const phase2Pairs = new Map();
const qualifiedUSNs = new Set();
let isPhase2Locked = false;
let phase2Active = false;
let currentMatchRound = 0;
let matchQuestionCache = [];
const matchSessions = new Map();
let roundWinners = [];
let matchesResolvedInRound = 0;
const disconnectTimers = new Map();
const adminSocketIds = new Set();
let finalEightCache = [];

function safeAck(ack, data) {
  if (typeof ack === "function") ack(data);
}

function normalizeUsn(usn) {
  return String(usn || "")
    .trim()
    .toUpperCase();
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function emitToUSN(nsp, usn, eventName, payload) {
  const socketId = usnToSocket.get(usn);
  if (!socketId) return;
  nsp.to(socketId).emit(eventName, payload);
}

function emitToAdmins(nsp, eventName, payload) {
  for (const socketId of adminSocketIds) {
    nsp.to(socketId).emit(eventName, payload);
  }
}

function setSocketIdentity(socket, usn) {
  const normalizedUsn = normalizeUsn(usn);
  if (!normalizedUsn) return null;

  const previousSocketId = usnToSocket.get(normalizedUsn);
  if (previousSocketId) {
    socketToUSN.delete(previousSocketId);
  }

  socketToUSN.set(socket.id, normalizedUsn);
  usnToSocket.set(normalizedUsn, socket.id);
  socket.usn = normalizedUsn;
  return normalizedUsn;
}

function clearDisconnectTimer(usn) {
  const timer = disconnectTimers.get(usn);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(usn);
  }
}

function clearParticipantInMemoryState(usn) {
  participantShuffleMap.delete(usn);
  confirmedAnswers.delete(usn);
  participantSubmittedMap.delete(usn);
  participantScoreMap.delete(usn);
  qualifiedUSNs.delete(usn);

  clearDisconnectTimer(usn);

  const socketId = usnToSocket.get(usn);
  if (socketId) {
    socketToUSN.delete(socketId);
  }
  usnToSocket.delete(usn);
}

function buildClientQuestionsFromOrder(shuffleOrder) {
  if (!questionCache) return [];

  const qMap = new Map();
  for (const q of questionCache) {
    qMap.set(q._id.toString(), q);
  }

  return shuffleOrder
    .map((qId) => {
      const q = qMap.get(String(qId));
      if (!q) return null;
      return {
        questionId: q._id.toString(),
        text: q.text,
        options: q.options.map((text, idx) => ({ id: idx, text })),
      };
    })
    .filter(Boolean);
}

function buildOutcomePayload(participant, rank) {
  return {
    usn: participant.usn,
    name: participant.name,
    rank,
    score: participant.phase1Score,
  };
}

async function emitPhase1OutcomeForUsn(nsp, usn, participantOverride = null) {
  const participant =
    participantOverride ||
    (await Participant.findOne({ usn }).select(
      "_id usn name phase1Qualified phase1Score phase1Submitted submittedAt",
    ));

  if (!participant || !participant.phase1Submitted) {
    return;
  }

  const betterCount = await Participant.countDocuments({
    phase1Submitted: true,
    $or: [
      { phase1Score: { $gt: participant.phase1Score } },
      {
        phase1Score: participant.phase1Score,
        submittedAt: { $lt: participant.submittedAt },
      },
      {
        phase1Score: participant.phase1Score,
        submittedAt: participant.submittedAt,
        _id: { $lt: participant._id },
      },
    ],
  });

  const rank = betterCount + 1;
  const payload = buildOutcomePayload(participant, rank);

  if (participant.phase1Qualified) {
    emitToUSN(nsp, usn, "phase1:qualified", payload);
  } else {
    emitToUSN(nsp, usn, "phase1:eliminated", payload);
    clearParticipantInMemoryState(usn);
  }
}

async function routeParticipantsAfterPhase1End(nsp, logPrefix) {
  const { qualifiedCount, submittedCount, ranked } =
    await computePhase1Qualification(logPrefix);

  if (submittedCount < 64) {
    console.warn(
      `${logPrefix}: fewer than 64 submissions (${submittedCount}), qualifying all submitted participants`,
    );
  }

  qualifiedUSNs.clear();
  for (const participant of ranked) {
    const usn = normalizeUsn(participant.usn);
    const payload = buildOutcomePayload(participant, participant.rank);

    if (participant.qualified) {
      qualifiedUSNs.add(usn);
      emitToUSN(nsp, usn, "phase1:qualified", payload);
      continue;
    }

    emitToUSN(nsp, usn, "phase1:eliminated", payload);
    clearParticipantInMemoryState(usn);
  }

  return { qualifiedCount, submittedCount };
}

function currentRoundQuestionMap() {
  const qMap = new Map();
  for (const q of matchQuestionCache) {
    qMap.set(q._id.toString(), q);
  }
  return qMap;
}

async function loadRoundQuestions(round) {
  matchQuestionCache = [];

  const questions = await Question.find({ phase: 2, matchRound: round })
    .select("_id text options correctIndex")
    .lean();

  if (!questions.length) {
    throw new Error(`No Phase 2 questions found for matchRound=${round}`);
  }

  matchQuestionCache = questions;
}

function createMatchSession(matchDoc, player1USN, player2USN) {
  const baseOrder = matchQuestionCache.map((q) => q._id.toString());
  const session = {
    matchId: String(matchDoc._id),
    matchRound: currentMatchRound,
    player1USN,
    player2USN,
    player1QuestionOrder: shuffle(baseOrder),
    player2QuestionOrder: shuffle(baseOrder),
    player1Answers: new Map(),
    player2Answers: new Map(),
    player1Score: null,
    player2Score: null,
    player1SubmittedAt: null,
    player2SubmittedAt: null,
    winner: null,
    resolved: false,
  };

  matchSessions.set(session.matchId, session);
  return session;
}

function toClientQuestionPayload(order) {
  const qMap = currentRoundQuestionMap();
  return order
    .map((qId) => {
      const q = qMap.get(String(qId));
      if (!q) return null;
      return {
        questionId: String(q._id),
        text: q.text,
        options: q.options.map((text, idx) => ({ id: idx, text })),
      };
    })
    .filter(Boolean);
}

function opponentFor(session, usn) {
  if (session.player1USN === usn) return session.player2USN;
  if (session.player2USN === usn) return session.player1USN;
  return null;
}

function playerSlot(session, usn) {
  if (session.player1USN === usn) return "player1";
  if (session.player2USN === usn) return "player2";
  return null;
}

function getSessionByUsn(usn) {
  for (const session of matchSessions.values()) {
    if (session.resolved) continue;
    if (session.player1USN === usn || session.player2USN === usn) {
      return session;
    }
  }
  return null;
}

async function persistMatchResolution(session) {
  const matchDoc = await Match.findById(session.matchId);
  if (!matchDoc) return;

  const p1 = await Participant.findOne({ usn: session.player1USN }).select(
    "_id",
  );
  const p2 = await Participant.findOne({ usn: session.player2USN }).select(
    "_id",
  );
  if (!p1 || !p2) return;

  const answerFromMap = (answersMap) => {
    const qMap = currentRoundQuestionMap();
    const result = [];
    for (const [questionId, answerIndex] of answersMap.entries()) {
      const q = qMap.get(questionId);
      result.push({
        questionId,
        answerIndex,
        correct: q ? q.correctIndex === answerIndex : false,
        answeredAt: new Date(),
      });
    }
    return result;
  };

  matchDoc.player1Answers = answerFromMap(session.player1Answers);
  matchDoc.player2Answers = answerFromMap(session.player2Answers);
  matchDoc.player1Score = Number(session.player1Score || 0);
  matchDoc.player2Score = Number(session.player2Score || 0);
  matchDoc.winner = session.winner === session.player1USN ? p1._id : p2._id;
  matchDoc.status = "completed";
  matchDoc.endedAt = new Date();
  await matchDoc.save();
}

async function updateParticipantsAfterMatch(session, winnerUSN, loserUSN) {
  const winnerScore =
    winnerUSN === session.player1USN
      ? session.player1Score
      : session.player2Score;
  const loserScore =
    loserUSN === session.player1USN
      ? session.player1Score
      : session.player2Score;

  await Participant.updateOne(
    { usn: winnerUSN },
    {
      $inc: {
        phase2Wins: 1,
        phase2TotalScore: Number(winnerScore || 0),
      },
      $set: {
        phase2Active: true,
        phase2Eliminated: false,
      },
    },
  );

  await Participant.updateOne(
    { usn: loserUSN },
    {
      $inc: {
        phase2TotalScore: Number(loserScore || 0),
      },
      $set: {
        phase2Active: false,
        phase2Eliminated: true,
      },
    },
  );

  qualifiedUSNs.delete(loserUSN);
}

async function emitFinalEight(nsp, finalUsns) {
  const finalists = await Participant.find({ usn: { $in: finalUsns } })
    .select("usn name phase1Score phase2Wins phase2TotalScore")
    .lean();

  const byUsn = new Map(finalists.map((p) => [normalizeUsn(p.usn), p]));
  finalEightCache = finalUsns
    .map((usn) => byUsn.get(normalizeUsn(usn)))
    .filter(Boolean)
    .map((p) => ({
      usn: p.usn,
      name: p.name,
      phase1Score: p.phase1Score,
      phase2Wins: p.phase2Wins || 0,
      phase2TotalScore: p.phase2TotalScore || 0,
    }));

  // Deterministic admin view sorted by wins, then total score.
  const sortedForAdmin = [...finalEightCache].sort((a, b) => {
    if (b.phase2Wins !== a.phase2Wins) return b.phase2Wins - a.phase2Wins;
    if (b.phase2TotalScore !== a.phase2TotalScore) {
      return b.phase2TotalScore - a.phase2TotalScore;
    }
    return b.phase1Score - a.phase1Score;
  });

  emitToAdmins(nsp, "phase2:complete", {
    players: sortedForAdmin,
  });

  for (const p of finalEightCache) {
    emitToUSN(nsp, normalizeUsn(p.usn), "phase2:advanced_finals", {
      message:
        "You have advanced to the Grand Finals, please wait for further instructions.",
      usn: p.usn,
      name: p.name,
      phase2Wins: p.phase2Wins,
    });
  }
}

async function checkRoundCompletion(nsp) {
  if (!phase2Active) return;
  if (matchesResolvedInRound < phase2Pairs.size) return;

  if (currentMatchRound >= 3) {
    phase2Active = false;

    const finalUsns = [...roundWinners];
    await Participant.updateMany(
      { usn: { $in: finalUsns } },
      { phase3Qualified: true, phase2Active: false, phase2Eliminated: false },
    );

    await emitFinalEight(nsp, finalUsns);
    return;
  }

  const advancingUsns = [...roundWinners];
  roundWinners = [];
  matchesResolvedInRound = 0;
  currentMatchRound += 1;

  await loadRoundQuestions(currentMatchRound);

  phase2Pairs.clear();
  matchSessions.clear();

  const shuffled = shuffle(advancingUsns);

  // If odd count occurs (for example from a timeout path), grant a bye.
  if (shuffled.length % 2 !== 0) {
    const byeUsn = shuffled.pop();
    roundWinners.push(byeUsn);
    emitToUSN(nsp, byeUsn, "phase2:bye", {
      round: currentMatchRound,
      message: "You received a bye and automatically advanced.",
    });
  }

  const participants = await Participant.find({ usn: { $in: shuffled } })
    .select("_id usn name track")
    .lean();
  const pMap = new Map(participants.map((p) => [normalizeUsn(p.usn), p]));

  const matchDocs = [];
  const pairRows = [];

  for (let i = 0; i + 1 < shuffled.length; i += 2) {
    const player1USN = shuffled[i];
    const player2USN = shuffled[i + 1];
    const p1 = pMap.get(player1USN);
    const p2 = pMap.get(player2USN);
    if (!p1 || !p2) continue;

    const pairNumber = i / 2 + 1;
    phase2Pairs.set(pairNumber, {
      player1Usn: player1USN,
      player2Usn: player2USN,
    });

    pairRows.push({ pairNumber, player1USN, player2USN });

    matchDocs.push({
      round: currentMatchRound,
      track: p1.track,
      player1: p1._id,
      player2: p2._id,
      questions: matchQuestionCache.map((q) => q._id),
      status: "active",
      startedAt: new Date(),
    });
  }

  const created = matchDocs.length ? await Match.insertMany(matchDocs) : [];
  for (let i = 0; i < created.length; i++) {
    const row = pairRows[i];
    const matchDoc = created[i];
    const session = createMatchSession(
      matchDoc,
      row.player1USN,
      row.player2USN,
    );

    const p1 = pMap.get(row.player1USN);
    const p2 = pMap.get(row.player2USN);

    emitToUSN(nsp, row.player1USN, "phase2:match_start", {
      matchId: session.matchId,
      matchRound: currentMatchRound,
      opponent: { usn: p2.usn, name: p2.name },
      questions: toClientQuestionPayload(session.player1QuestionOrder),
    });

    emitToUSN(nsp, row.player2USN, "phase2:match_start", {
      matchId: session.matchId,
      matchRound: currentMatchRound,
      opponent: { usn: p1.usn, name: p1.name },
      questions: toClientQuestionPayload(session.player2QuestionOrder),
    });
  }

  // If no actual pairs exist after byes, resolve this round immediately.
  if (phase2Pairs.size === 0) {
    await checkRoundCompletion(nsp);
  }
}

async function resolveMatch(nsp, session, forcedWinnerUSN = null) {
  if (!session || session.resolved) return;

  const winnerUSN = forcedWinnerUSN
    ? normalizeUsn(forcedWinnerUSN)
    : (() => {
        if (session.player1Score > session.player2Score)
          return session.player1USN;
        if (session.player2Score > session.player1Score)
          return session.player2USN;
        return session.player1SubmittedAt <= session.player2SubmittedAt
          ? session.player1USN
          : session.player2USN;
      })();

  const loserUSN =
    winnerUSN === session.player1USN ? session.player2USN : session.player1USN;

  session.winner = winnerUSN;
  session.resolved = true;

  clearDisconnectTimer(winnerUSN);
  clearDisconnectTimer(loserUSN);

  await updateParticipantsAfterMatch(session, winnerUSN, loserUSN);
  await persistMatchResolution(session);

  const winnerScore =
    winnerUSN === session.player1USN
      ? session.player1Score
      : session.player2Score;
  const loserScore =
    loserUSN === session.player1USN
      ? session.player1Score
      : session.player2Score;

  emitToUSN(nsp, winnerUSN, "phase2:result", {
    matchId: session.matchId,
    matchRound: session.matchRound,
    result: "win",
    score: winnerScore,
    opponentScore: loserScore,
    winnerUSN,
  });

  emitToUSN(nsp, loserUSN, "phase2:result", {
    matchId: session.matchId,
    matchRound: session.matchRound,
    result: "eliminated",
    score: loserScore,
    opponentScore: winnerScore,
    winnerUSN,
  });

  clearParticipantInMemoryState(loserUSN);

  roundWinners.push(winnerUSN);
  matchesResolvedInRound += 1;

  matchSessions.delete(session.matchId);

  await checkRoundCompletion(nsp);
}

async function forfeitDisconnectedPlayer(nsp, disconnectedUsn) {
  const session = getSessionByUsn(disconnectedUsn);
  if (!session || session.resolved) return;

  const winnerUsn = opponentFor(session, disconnectedUsn);
  if (!winnerUsn) return;

  // Ensure non-submitted players have deterministic score values before resolution.
  if (session.player1Score === null) session.player1Score = 0;
  if (session.player2Score === null) session.player2Score = 0;
  if (!session.player1SubmittedAt) session.player1SubmittedAt = new Date();
  if (!session.player2SubmittedAt) session.player2SubmittedAt = new Date();

  await resolveMatch(nsp, session, winnerUsn);
}

function scheduleDisconnectForfeit(nsp, usn) {
  clearDisconnectTimer(usn);
  const timer = setTimeout(() => {
    forfeitDisconnectedPlayer(nsp, usn).catch((err) => {
      console.error("phase2 disconnect forfeit error:", err.message);
    });
  }, PHASE2_RECONNECT_GRACE_MS);

  disconnectTimers.set(usn, timer);
}

function registerAdminSocket(socket, adminToken) {
  if (adminToken && adminToken === process.env.ADMIN_SECRET) {
    adminSocketIds.add(socket.id);
    return true;
  }
  return false;
}

async function maybeCloseRoundIfAllSubmitted(nsp) {
  if (!isPhase1Active || participantShuffleMap.size === 0) return;

  for (const usn of participantShuffleMap.keys()) {
    if (!participantSubmittedMap.get(usn)) {
      return;
    }
  }

  await Phase1Session.updateMany(
    { status: "active" },
    { status: "ended", endedAt: new Date() },
  );

  isPhase1Active = false;
  if (!qualificationComputed) {
    qualificationComputed = true;
    await routeParticipantsAfterPhase1End(nsp, "Phase 1 auto-end (Socket)");
  }

  console.log("Phase 1 auto-closed: all participants submitted");
}

module.exports = function phase1Handler(nsp, socket) {
  const handlePhase1Rejoin = async ({ usn }, ack) => {
    try {
      const normalizedUsn = setSocketIdentity(socket, usn);
      if (!normalizedUsn) {
        return safeAck(ack, { ok: false, error: "USN is required" });
      }

      if (!isPhase1Active) {
        const endedParticipant = await Participant.findOne({
          usn: normalizedUsn,
        }).select(
          "_id usn name phase1Qualified phase1Score phase1Submitted submittedAt",
        );

        if (endedParticipant?.phase1Submitted) {
          await emitPhase1OutcomeForUsn(nsp, normalizedUsn, endedParticipant);
          return safeAck(ack, { ok: true, status: "phase1_ended" });
        }

        socket.emit("phase1:not_started");
        return safeAck(ack, { ok: false, status: "not_started" });
      }

      const shuffleOrder = participantShuffleMap.get(normalizedUsn);
      if (!shuffleOrder) {
        socket.emit("phase1:unauthorized", {
          message: "Participant not part of this round",
        });
        return safeAck(ack, { ok: false, status: "unauthorized" });
      }

      socket.emit(
        "phase1:questions",
        buildClientQuestionsFromOrder(shuffleOrder),
      );

      const alreadySubmitted = Boolean(
        participantSubmittedMap.get(normalizedUsn),
      );
      if (alreadySubmitted) {
        socket.emit("phase1:result", {
          score: participantScoreMap.get(normalizedUsn) || 0,
          total: shuffleOrder.length,
          breakdown: [],
        });
      }

      return safeAck(ack, { ok: true, submitted: alreadySubmitted });
    } catch (err) {
      console.error("phase1:rejoin error:", err.message);
      safeAck(ack, { ok: false, error: err.message });
    }
  };

  socket.on("reconnect:check", handlePhase1Rejoin);
  socket.on("phase1:rejoin", handlePhase1Rejoin);
  socket.on("phase1:join", handlePhase1Rejoin);

  socket.on("phase1:start", async ({ adminToken }, ack) => {
    try {
      if (!registerAdminSocket(socket, adminToken)) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      const questions = await Question.find({ phase: 1 });
      if (!questions.length) {
        return safeAck(ack, {
          ok: false,
          error: "No Phase 1 questions found in database",
        });
      }

      const participants = await Participant.find().select("usn");
      if (!participants.length) {
        return safeAck(ack, {
          ok: false,
          error: "No registered participants found",
        });
      }

      isPhase1Active = true;
      questionCache = questions;

      participantShuffleMap.clear();
      confirmedAnswers.clear();
      participantSubmittedMap.clear();
      participantScoreMap.clear();
      qualificationComputed = false;

      // Reset Phase 2 runtime state for a fresh tournament run.
      phase2Pairs.clear();
      qualifiedUSNs.clear();
      isPhase2Locked = false;
      phase2Active = false;
      currentMatchRound = 0;
      matchQuestionCache = [];
      matchSessions.clear();
      roundWinners = [];
      matchesResolvedInRound = 0;
      finalEightCache = [];
      for (const usn of disconnectTimers.keys()) clearDisconnectTimer(usn);

      const questionIds = questions.map((q) => q._id.toString());
      for (const p of participants) {
        const usn = normalizeUsn(p.usn);
        participantShuffleMap.set(usn, shuffle(questionIds));
        confirmedAnswers.set(usn, new Map());
        participantSubmittedMap.set(usn, false);
        participantScoreMap.set(usn, 0);
      }

      await Phase1Session.updateMany(
        { status: "active" },
        { status: "ended", endedAt: new Date() },
      );
      await Phase1Session.create({ status: "active", startedAt: new Date() });

      nsp.emit("phase1:started");

      safeAck(ack, {
        ok: true,
        questionCount: questions.length,
        participantCount: participantShuffleMap.size,
      });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on("phase1:end", async ({ adminToken }, ack) => {
    try {
      if (!registerAdminSocket(socket, adminToken)) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      await Phase1Session.updateMany(
        { status: "active" },
        { status: "ended", endedAt: new Date() },
      );

      isPhase1Active = false;
      if (!qualificationComputed) {
        qualificationComputed = true;
        await routeParticipantsAfterPhase1End(nsp, "Phase 1 end (Socket)");
      }

      nsp.emit("phase1:ended");
      safeAck(ack, { ok: true });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on(
    "phase1:confirm_answer",
    ({ questionId, selectedOptionId }, ack) => {
      try {
        const usn = socketToUSN.get(socket.id);
        if (!usn) {
          return safeAck(ack, {
            ok: false,
            error: "Not joined. Emit phase1:rejoin first.",
          });
        }
        if (!isPhase1Active) {
          return safeAck(ack, { ok: false, error: "Phase 1 is not active" });
        }

        const userOrder = participantShuffleMap.get(usn) || [];
        const qIdStr = String(questionId);

        if (!userOrder.includes(qIdStr)) {
          return safeAck(ack, {
            ok: false,
            error: "Invalid question ID for this participant",
          });
        }

        if (
          selectedOptionId === undefined ||
          selectedOptionId === null ||
          selectedOptionId < 0 ||
          selectedOptionId > 3
        ) {
          return safeAck(ack, {
            ok: false,
            error: "Invalid option ID (must be 0-3)",
          });
        }

        const userAnswers = confirmedAnswers.get(usn) || new Map();
        if (userAnswers.has(qIdStr)) {
          return safeAck(ack, {
            ok: false,
            error: "Answer already confirmed for this question",
          });
        }

        userAnswers.set(qIdStr, selectedOptionId);
        confirmedAnswers.set(usn, userAnswers);

        emitToUSN(nsp, usn, "phase1:answer_confirmed", { questionId: qIdStr });
        safeAck(ack, { ok: true, questionId: qIdStr });
      } catch (err) {
        safeAck(ack, { ok: false, error: err.message });
      }
    },
  );

  socket.on("phase1:submit", async ({ questionId, selectedOptionId }, ack) => {
    try {
      const usn = socketToUSN.get(socket.id);
      if (!usn) {
        return safeAck(ack, {
          ok: false,
          error: "Not joined. Emit phase1:rejoin first.",
        });
      }
      if (!isPhase1Active) {
        return safeAck(ack, { ok: false, error: "Phase 1 is not active" });
      }

      const userOrder = participantShuffleMap.get(usn) || [];
      if (!userOrder.length || !questionCache) {
        return safeAck(ack, {
          ok: false,
          error: "Phase 1 has not started yet",
        });
      }

      const qIdStr = String(questionId);
      const lastQuestionId = userOrder[userOrder.length - 1];
      if (qIdStr !== lastQuestionId) {
        return safeAck(ack, {
          ok: false,
          error:
            "Submit is only for the last question. Use phase1:confirm_answer for others.",
        });
      }

      if (
        selectedOptionId === undefined ||
        selectedOptionId === null ||
        selectedOptionId < 0 ||
        selectedOptionId > 3
      ) {
        return safeAck(ack, {
          ok: false,
          error: "Invalid option ID (must be 0-3)",
        });
      }

      const userAnswers = confirmedAnswers.get(usn) || new Map();
      const alreadyHadLastAnswer = userAnswers.has(qIdStr);
      if (!alreadyHadLastAnswer) {
        userAnswers.set(qIdStr, selectedOptionId);
      }

      const missingQuestions = userOrder.filter((id) => !userAnswers.has(id));
      if (missingQuestions.length > 0) {
        if (!alreadyHadLastAnswer) {
          userAnswers.delete(qIdStr);
        }
        confirmedAnswers.set(usn, userAnswers);

        emitToUSN(nsp, usn, "phase1:submit_error", {
          message: `${missingQuestions.length} question(s) not yet confirmed`,
          missingQuestions,
        });

        return safeAck(ack, {
          ok: false,
          error: "Some questions are not confirmed",
        });
      }

      const qMap = new Map();
      for (const q of questionCache) {
        qMap.set(q._id.toString(), q);
      }

      let score = 0;
      const breakdown = [];

      for (const qId of userOrder) {
        const question = qMap.get(qId);
        if (!question) continue;

        const selected = userAnswers.get(qId);
        const correct = selected === question.correctIndex;
        if (correct) score++;

        breakdown.push({ questionId: qId, correct });
      }

      const participant = await Participant.findOne({ usn });
      if (!participant) {
        return safeAck(ack, {
          ok: false,
          error: "Participant not found in database",
        });
      }

      participant.phase1Score = score;
      participant.phase1Submitted = true;
      participant.phase1Time = 0;
      participant.submittedAt = new Date();
      await participant.save();

      participantSubmittedMap.set(usn, true);
      participantScoreMap.set(usn, score);
      confirmedAnswers.set(usn, userAnswers);

      emitToUSN(nsp, usn, "phase1:result", {
        score,
        total: userOrder.length,
        breakdown,
      });

      safeAck(ack, { ok: true, score, total: userOrder.length });

      await maybeCloseRoundIfAllSubmitted(nsp);
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on("phase2:generate_matchmaking", async ({ adminToken }, ack) => {
    try {
      if (!registerAdminSocket(socket, adminToken)) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      if (!qualificationComputed) {
        return safeAck(ack, {
          ok: false,
          error: "Phase 1 must be ended before matchmaking generation",
        });
      }

      if (isPhase2Locked || phase2Active) {
        return safeAck(ack, {
          ok: false,
          error: "Phase 2 is already started and pairings are locked",
        });
      }

      const qualified = await Participant.find({ phase1Qualified: true })
        .sort({ phase1Score: -1, submittedAt: 1, _id: 1 })
        .select("_id usn name track phase1Score")
        .lean();

      if (!qualified.length) {
        return safeAck(ack, {
          ok: false,
          error: "No qualified participants found for matchmaking",
        });
      }

      phase2Pairs.clear();
      qualifiedUSNs.clear();

      for (const p of qualified) {
        qualifiedUSNs.add(normalizeUsn(p.usn));
      }

      const shuffled = shuffle(qualified);
      const leaderboard = [];

      await Match.deleteMany({ round: 1, status: "pending" });

      const pendingMatches = [];

      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        const pairNumber = i / 2 + 1;
        const p1 = shuffled[i];
        const p2 = shuffled[i + 1];

        phase2Pairs.set(pairNumber, {
          player1Usn: normalizeUsn(p1.usn),
          player2Usn: normalizeUsn(p2.usn),
        });

        pendingMatches.push({
          round: 1,
          track: p1.track,
          player1: p1._id,
          player2: p2._id,
          status: "pending",
        });

        leaderboard.push({
          pairNumber,
          players: [
            { usn: p1.usn, name: p1.name, phase1Score: p1.phase1Score },
            { usn: p2.usn, name: p2.name, phase1Score: p2.phase1Score },
          ],
        });
      }

      if (pendingMatches.length) {
        await Match.insertMany(pendingMatches);
      }

      if (shuffled.length % 2 !== 0) {
        console.warn(
          "Phase 2 matchmaking produced an odd count; one participant is currently unpaired",
        );
      }

      const payload = {
        pairs: leaderboard,
        pairCount: leaderboard.length,
      };

      socket.emit("phase2:matchmaking_ready", payload);
      safeAck(ack, { ok: true, ...payload });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on("phase2:start", async ({ adminToken }, ack) => {
    try {
      if (!registerAdminSocket(socket, adminToken)) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      if (isPhase2Locked || phase2Active) {
        return safeAck(ack, {
          ok: false,
          error: "Phase 2 already started",
        });
      }

      if (phase2Pairs.size === 0) {
        return safeAck(ack, {
          ok: false,
          error: "Generate Phase 2 matchmaking first",
        });
      }

      isPhase2Locked = true;
      phase2Active = true;
      currentMatchRound = 1;
      roundWinners = [];
      matchesResolvedInRound = 0;
      finalEightCache = [];

      await loadRoundQuestions(currentMatchRound);

      matchSessions.clear();
      await Match.deleteMany({ round: 1, status: "pending" });

      const pairRows = [...phase2Pairs.values()];
      const allUsns = pairRows.flatMap((p) => [p.player1Usn, p.player2Usn]);
      const participants = await Participant.find({ usn: { $in: allUsns } })
        .select("_id usn name track")
        .lean();
      const pMap = new Map(participants.map((p) => [normalizeUsn(p.usn), p]));

      const matchDocs = [];
      const orderedPairs = [];

      for (const pair of pairRows) {
        const p1 = pMap.get(pair.player1Usn);
        const p2 = pMap.get(pair.player2Usn);
        if (!p1 || !p2) continue;

        orderedPairs.push({
          player1Usn: pair.player1Usn,
          player2Usn: pair.player2Usn,
        });

        matchDocs.push({
          round: 1,
          track: p1.track,
          player1: p1._id,
          player2: p2._id,
          questions: matchQuestionCache.map((q) => q._id),
          status: "active",
          winner: null,
          startedAt: new Date(),
        });
      }

      const createdMatches = matchDocs.length
        ? await Match.insertMany(matchDocs)
        : [];
      for (let i = 0; i < createdMatches.length; i++) {
        const matchDoc = createdMatches[i];
        const pair = orderedPairs[i];
        const p1 = pMap.get(pair.player1Usn);
        const p2 = pMap.get(pair.player2Usn);

        const session = createMatchSession(
          matchDoc,
          pair.player1Usn,
          pair.player2Usn,
        );

        emitToUSN(nsp, pair.player1Usn, "phase2:match_start", {
          matchId: session.matchId,
          matchRound: 1,
          opponent: { usn: p2.usn, name: p2.name },
          questions: toClientQuestionPayload(session.player1QuestionOrder),
        });

        emitToUSN(nsp, pair.player2Usn, "phase2:match_start", {
          matchId: session.matchId,
          matchRound: 1,
          opponent: { usn: p1.usn, name: p1.name },
          questions: toClientQuestionPayload(session.player2QuestionOrder),
        });
      }

      nsp.emit("phase2:started", {
        currentMatchRound,
        pairCount: phase2Pairs.size,
      });

      safeAck(ack, {
        ok: true,
        currentMatchRound,
        pairCount: phase2Pairs.size,
      });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on("phase2:check_access", ({ usn }, ack) => {
    const normalizedUsn = setSocketIdentity(socket, usn);
    if (!normalizedUsn) {
      return safeAck(ack, { ok: false, error: "USN is required" });
    }

    safeAck(ack, {
      ok: true,
      qualified: qualifiedUSNs.has(normalizedUsn),
      phase2Locked: isPhase2Locked,
      phase2Active,
      currentMatchRound,
      phase2Complete: !phase2Active && finalEightCache.length > 0,
    });
  });

  socket.on("phase2:rejoin", async ({ usn }, ack) => {
    try {
      const normalizedUsn = setSocketIdentity(socket, usn);
      if (!normalizedUsn) {
        return safeAck(ack, { ok: false, error: "USN is required" });
      }

      clearDisconnectTimer(normalizedUsn);

      const session = getSessionByUsn(normalizedUsn);
      if (!session) {
        const participant = await Participant.findOne({
          usn: normalizedUsn,
        }).select("phase2Eliminated phase3Qualified");

        if (participant?.phase2Eliminated) {
          emitToUSN(nsp, normalizedUsn, "phase2:result", {
            result: "eliminated",
            message: "You have been eliminated from Phase 2.",
          });
          return safeAck(ack, { ok: true, status: "eliminated" });
        }

        if (participant?.phase3Qualified) {
          emitToUSN(nsp, normalizedUsn, "phase2:advanced_finals", {
            message:
              "You have advanced to the Grand Finals, please wait for further instructions.",
          });
          return safeAck(ack, { ok: true, status: "advanced_finals" });
        }

        return safeAck(ack, { ok: true, status: "waiting" });
      }

      const slot = playerSlot(session, normalizedUsn);
      const opponentUsn = opponentFor(session, normalizedUsn);
      const opponent = await Participant.findOne({ usn: opponentUsn })
        .select("usn name")
        .lean();

      const order =
        slot === "player1"
          ? session.player1QuestionOrder
          : session.player2QuestionOrder;
      const answers =
        slot === "player1" ? session.player1Answers : session.player2Answers;
      const submittedAt =
        slot === "player1"
          ? session.player1SubmittedAt
          : session.player2SubmittedAt;

      const confirmedAnswersObj = {};
      for (const [qId, optionId] of answers.entries()) {
        confirmedAnswersObj[qId] = optionId;
      }

      emitToUSN(nsp, normalizedUsn, "phase2:match_resume", {
        matchId: session.matchId,
        matchRound: session.matchRound,
        opponent: {
          usn: opponent?.usn || opponentUsn,
          name: opponent?.name || "Opponent",
        },
        questions: toClientQuestionPayload(order),
        confirmedAnswers: confirmedAnswersObj,
        submitted: Boolean(submittedAt),
      });

      safeAck(ack, { ok: true, status: "resumed", matchId: session.matchId });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on(
    "phase2:confirm_answer",
    ({ matchId, questionId, selectedOptionId }, ack) => {
      try {
        if (!phase2Active) {
          return safeAck(ack, { ok: false, error: "Phase 2 is not active" });
        }

        const usn = socketToUSN.get(socket.id);
        if (!usn) {
          return safeAck(ack, { ok: false, error: "USN not linked to socket" });
        }

        const session = matchSessions.get(String(matchId));
        if (!session || session.resolved) {
          return safeAck(ack, { ok: false, error: "Match session not active" });
        }

        const slot = playerSlot(session, usn);
        if (!slot) {
          return safeAck(ack, {
            ok: false,
            error: "You are not part of this match",
          });
        }

        const order =
          slot === "player1"
            ? session.player1QuestionOrder
            : session.player2QuestionOrder;
        const answers =
          slot === "player1" ? session.player1Answers : session.player2Answers;
        const submittedAt =
          slot === "player1"
            ? session.player1SubmittedAt
            : session.player2SubmittedAt;

        if (submittedAt) {
          return safeAck(ack, { ok: false, error: "Already submitted" });
        }

        const qId = String(questionId);
        if (!order.includes(qId)) {
          return safeAck(ack, {
            ok: false,
            error: "Invalid question for this match",
          });
        }

        if (
          selectedOptionId === undefined ||
          selectedOptionId === null ||
          selectedOptionId < 0 ||
          selectedOptionId > 3
        ) {
          return safeAck(ack, {
            ok: false,
            error: "Invalid option ID (must be 0-3)",
          });
        }

        if (answers.has(qId)) {
          return safeAck(ack, { ok: false, error: "Answer already confirmed" });
        }

        answers.set(qId, selectedOptionId);
        emitToUSN(nsp, usn, "phase2:answer_confirmed", {
          matchId: session.matchId,
          questionId: qId,
        });
        safeAck(ack, { ok: true, questionId: qId });
      } catch (err) {
        safeAck(ack, { ok: false, error: err.message });
      }
    },
  );

  socket.on(
    "phase2:submit",
    async ({ matchId, questionId, selectedOptionId }, ack) => {
      try {
        if (!phase2Active) {
          return safeAck(ack, { ok: false, error: "Phase 2 is not active" });
        }

        const usn = socketToUSN.get(socket.id);
        if (!usn) {
          return safeAck(ack, { ok: false, error: "USN not linked to socket" });
        }

        const session = matchSessions.get(String(matchId));
        if (!session || session.resolved) {
          return safeAck(ack, { ok: false, error: "Match session not active" });
        }

        const slot = playerSlot(session, usn);
        if (!slot) {
          return safeAck(ack, {
            ok: false,
            error: "You are not part of this match",
          });
        }

        const order =
          slot === "player1"
            ? session.player1QuestionOrder
            : session.player2QuestionOrder;
        const answers =
          slot === "player1" ? session.player1Answers : session.player2Answers;
        const submittedAtField =
          slot === "player1" ? "player1SubmittedAt" : "player2SubmittedAt";
        const scoreField = slot === "player1" ? "player1Score" : "player2Score";
        const opponentSubmittedAt =
          slot === "player1"
            ? session.player2SubmittedAt
            : session.player1SubmittedAt;

        if (session[submittedAtField]) {
          return safeAck(ack, { ok: false, error: "Already submitted" });
        }

        const lastQuestionId = order[order.length - 1];
        const qId = String(questionId);
        if (qId !== lastQuestionId) {
          return safeAck(ack, {
            ok: false,
            error:
              "Submit is only allowed on the last question. Use phase2:confirm_answer for earlier questions.",
          });
        }

        if (
          selectedOptionId === undefined ||
          selectedOptionId === null ||
          selectedOptionId < 0 ||
          selectedOptionId > 3
        ) {
          return safeAck(ack, {
            ok: false,
            error: "Invalid option ID (must be 0-3)",
          });
        }

        if (!answers.has(qId)) {
          answers.set(qId, selectedOptionId);
        }

        const missing = order.filter((id) => !answers.has(id));
        if (missing.length > 0) {
          return safeAck(ack, {
            ok: false,
            error: "All previous questions must be confirmed before submit",
            missingQuestions: missing,
          });
        }

        const qMap = currentRoundQuestionMap();
        let score = 0;
        for (const orderedQuestionId of order) {
          const q = qMap.get(orderedQuestionId);
          if (!q) continue;
          if (answers.get(orderedQuestionId) === q.correctIndex) score += 1;
        }

        session[scoreField] = score;
        session[submittedAtField] = new Date();

        safeAck(ack, { ok: true, score });

        if (!opponentSubmittedAt) {
          emitToUSN(nsp, usn, "phase2:waiting_for_opponent", {
            matchId: session.matchId,
            message: "Your opponent is still answering, please wait.",
          });
          return;
        }

        await resolveMatch(nsp, session);
      } catch (err) {
        safeAck(ack, { ok: false, error: err.message });
      }
    },
  );

  socket.on("phase2:refresh_leaderboard", async ({ adminToken }, ack) => {
    try {
      if (!registerAdminSocket(socket, adminToken)) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      const finalists = finalEightCache.length
        ? [...finalEightCache]
        : await Participant.find({ phase3Qualified: true })
            .select("usn name phase1Score phase2Wins phase2TotalScore")
            .lean();

      const sorted = [...finalists].sort((a, b) => {
        if ((b.phase2Wins || 0) !== (a.phase2Wins || 0)) {
          return (b.phase2Wins || 0) - (a.phase2Wins || 0);
        }
        if ((b.phase2TotalScore || 0) !== (a.phase2TotalScore || 0)) {
          return (b.phase2TotalScore || 0) - (a.phase2TotalScore || 0);
        }
        return (b.phase1Score || 0) - (a.phase1Score || 0);
      });

      const payload = { players: sorted };
      socket.emit("phase2:final_leaderboard", payload);
      safeAck(ack, { ok: true, ...payload });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on("phase2:end", async ({ adminToken }, ack) => {
    try {
      if (!registerAdminSocket(socket, adminToken)) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      phase2Active = false;

      const survivors = await Participant.find({
        phase1Qualified: true,
        phase2Eliminated: false,
      })
        .select("usn")
        .lean();

      const usns = survivors.map((p) => normalizeUsn(p.usn));
      await Participant.updateMany(
        { usn: { $in: usns } },
        { phase3Qualified: true, phase2Active: false, phase2Eliminated: false },
      );

      await emitFinalEight(nsp, usns);

      safeAck(ack, { ok: true, finalists: usns.length });
    } catch (err) {
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  socket.on("disconnect", () => {
    adminSocketIds.delete(socket.id);

    const usn = socketToUSN.get(socket.id);
    socketToUSN.delete(socket.id);

    if (usn && usnToSocket.get(usn) === socket.id) {
      usnToSocket.delete(usn);
    }

    if (!usn || !phase2Active) return;

    const session = getSessionByUsn(usn);
    if (!session || session.resolved) return;

    const slot = playerSlot(session, usn);
    if (!slot) return;

    const alreadySubmitted =
      slot === "player1"
        ? session.player1SubmittedAt
        : session.player2SubmittedAt;

    // Give players a reconnect grace period before forfeit.
    if (!alreadySubmitted) {
      scheduleDisconnectForfeit(nsp, usn);
    }
  });
};

module.exports.clearPhase1State = function clearPhase1State() {
  isPhase1Active = false;
  questionCache = null;
  participantShuffleMap.clear();
  confirmedAnswers.clear();
  participantSubmittedMap.clear();
  participantScoreMap.clear();
  socketToUSN.clear();
  usnToSocket.clear();
  qualificationComputed = false;

  phase2Pairs.clear();
  qualifiedUSNs.clear();
  isPhase2Locked = false;
  phase2Active = false;
  currentMatchRound = 0;
  matchQuestionCache = [];
  matchSessions.clear();
  roundWinners = [];
  matchesResolvedInRound = 0;
  finalEightCache = [];
  adminSocketIds.clear();

  for (const usn of disconnectTimers.keys()) {
    clearDisconnectTimer(usn);
  }

  console.log("Phase 1/Phase 2 in-memory state cleared");
};
