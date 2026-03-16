const Match = require("../models/Match");
const Participant = require("../models/Participant");
const Question = require("../models/Question");

// Track ready states per room: { matchId: { usn1: true, usn2: true } }
const readyStates = {};
const duelTimers = {};
const disconnectTimers = {};

const DUEL_DURATION_SECONDS = Number(process.env.DUEL_DURATION_SECONDS || 90);
const DISCONNECT_GRACE_SECONDS = Number(
  process.env.DUEL_DISCONNECT_GRACE_SECONDS || 15,
);

function clearDuelTimer(matchId) {
  if (duelTimers[matchId]) {
    clearTimeout(duelTimers[matchId]);
    delete duelTimers[matchId];
  }
}

function clearDisconnectTimer(matchId, usn) {
  if (disconnectTimers[matchId]?.[usn]) {
    clearTimeout(disconnectTimers[matchId][usn]);
    delete disconnectTimers[matchId][usn];
  }
}

function clearAllDisconnectTimers(matchId) {
  if (!disconnectTimers[matchId]) return;
  for (const usn of Object.keys(disconnectTimers[matchId])) {
    clearTimeout(disconnectTimers[matchId][usn]);
  }
  delete disconnectTimers[matchId];
}

function scheduleDuelTimeout(nsp, matchId) {
  clearDuelTimer(matchId);
  duelTimers[matchId] = setTimeout(async () => {
    try {
      const match = await Match.findById(matchId);
      if (!match || match.status !== "active") return;

      await autoSubmitUnanswered(match);
      await finishDuel(nsp, match);
    } catch (err) {
      nsp.to(matchId).emit("error", { message: err.message });
    }
  }, DUEL_DURATION_SECONDS * 1000);
}

async function scheduleDisconnectForfeit(nsp, matchId, usn) {
  if (!disconnectTimers[matchId]) disconnectTimers[matchId] = {};
  clearDisconnectTimer(matchId, usn);

  disconnectTimers[matchId][usn] = setTimeout(async () => {
    try {
      const match = await Match.findById(matchId)
        .populate("player1", "usn")
        .populate("player2", "usn");

      if (!match || match.status !== "active") return;

      const disconnectedIsP1 = match.player1.usn === usn;
      const disconnectedIsP2 = match.player2.usn === usn;
      if (!disconnectedIsP1 && !disconnectedIsP2) return;

      match.winner = disconnectedIsP1 ? match.player2._id : match.player1._id;
      match.status = "completed";
      match.endedAt = new Date();
      await match.save();

      clearDuelTimer(matchId);
      clearAllDisconnectTimers(matchId);

      nsp.to(matchId).emit("duel_end", {
        winner: match.winner,
        player1Score: match.player1Score,
        player2Score: match.player2Score,
        reason: "disconnect_forfeit",
      });
    } catch (err) {
      nsp.to(matchId).emit("error", { message: err.message });
    }
  }, DISCONNECT_GRACE_SECONDS * 1000);
}

module.exports = function duelHandler(nsp, socket) {
  // Player joins their duel room
  socket.on("join_room", async ({ matchId, usn }) => {
    try {
      const match = await Match.findById(matchId)
        .populate("player1", "usn name")
        .populate("player2", "usn name");

      if (!match) {
        return socket.emit("error", { message: "Match not found" });
      }

      const isPlayer1 = match.player1.usn === usn.toUpperCase();
      const isPlayer2 = match.player2.usn === usn.toUpperCase();
      if (!isPlayer1 && !isPlayer2) {
        return socket.emit("error", { message: "You are not in this match" });
      }

      clearDisconnectTimer(matchId, usn.toUpperCase());

      socket.join(matchId);
      socket.matchId = matchId;
      socket.usn = usn.toUpperCase();
      socket.isPlayer1 = isPlayer1;

      const opponent = isPlayer1 ? match.player2 : match.player1;
      socket.emit("room_joined", {
        matchId,
        opponent: { usn: opponent.usn, name: opponent.name },
      });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  // Player signals ready
  socket.on("ready", async ({ matchId, usn }) => {
    try {
      if (!readyStates[matchId]) readyStates[matchId] = {};
      readyStates[matchId][usn.toUpperCase()] = true;

      const match = await Match.findById(matchId)
        .populate("player1", "usn")
        .populate("player2", "usn");

      if (!match) return;

      const p1Ready = readyStates[matchId][match.player1.usn];
      const p2Ready = readyStates[matchId][match.player2.usn];

      // Both ready — start the duel
      if (p1Ready && p2Ready) {
        const questions = await Question.find({
          _id: { $in: match.questions },
        }).select("text options");

        match.status = "active";
        match.startedAt = new Date();
        await match.save();

        scheduleDuelTimeout(nsp, matchId);

        delete readyStates[matchId];

        nsp.to(matchId).emit("duel_start", {
          questions,
          startTime: match.startedAt,
          durationSeconds: DUEL_DURATION_SECONDS,
          endsAt: new Date(
            match.startedAt.getTime() + DUEL_DURATION_SECONDS * 1000,
          ),
        });
      }
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  // Player submits an answer
  socket.on(
    "submit_answer",
    async ({ matchId, usn, questionIndex, answerIndex, timestamp }) => {
      try {
        const match = await Match.findById(matchId);
        if (!match || match.status !== "active") return;

        if (
          questionIndex === undefined ||
          questionIndex < 0 ||
          questionIndex >= match.questions.length
        ) {
          return socket.emit("error", { message: "Invalid question index" });
        }

        const questionId = match.questions[questionIndex];
        const question = await Question.findById(questionId);
        if (!question) return;

        const correct = answerIndex === question.correctIndex;
        const answer = {
          questionId,
          answerIndex,
          correct,
          answeredAt: new Date(timestamp),
        };

        const participant = await Participant.findOne({
          usn: usn.toUpperCase(),
        });
        if (!participant) {
          return socket.emit("error", { message: "Participant not found" });
        }

        const isPlayer1 =
          match.player1.toString() === participant._id.toString();

        const existingAnswers = isPlayer1
          ? match.player1Answers
          : match.player2Answers;

        const alreadyAnswered = existingAnswers.some(
          (a) => a.questionId.toString() === questionId.toString(),
        );
        if (alreadyAnswered) {
          return socket.emit("error", {
            message: "Question already answered",
          });
        }

        if (isPlayer1) {
          match.player1Answers.push(answer);
          if (correct) match.player1Score += 1;
        } else {
          match.player2Answers.push(answer);
          if (correct) match.player2Score += 1;
        }

        await match.save();

        // Broadcast opponent progress (how many answered, not which)
        const answeredCount = isPlayer1
          ? match.player1Answers.length
          : match.player2Answers.length;

        socket.to(matchId).emit("opponent_progress", {
          answered: answeredCount,
        });

        // Check if both players have answered all questions
        const totalQuestions = match.questions.length;
        if (
          match.player1Answers.length >= totalQuestions &&
          match.player2Answers.length >= totalQuestions
        ) {
          await finishDuel(nsp, match);
        }
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    },
  );

  socket.on("disconnect", () => {
    (async () => {
      try {
        if (socket.matchId && readyStates[socket.matchId]) {
          delete readyStates[socket.matchId][socket.usn];
        }

        if (!socket.matchId || !socket.usn) return;

        const match = await Match.findById(socket.matchId)
          .populate("player1", "usn")
          .populate("player2", "usn");
        if (!match || match.status !== "active") return;

        await scheduleDisconnectForfeit(nsp, socket.matchId, socket.usn);
      } catch {
        // Ignore disconnect cleanup errors
      }
    })();
  });
};

async function autoSubmitUnanswered(match) {
  const timeoutAt = new Date();

  const player1Answered = new Set(
    match.player1Answers.map((a) => a.questionId.toString()),
  );
  const player2Answered = new Set(
    match.player2Answers.map((a) => a.questionId.toString()),
  );

  for (const questionId of match.questions) {
    const questionIdStr = questionId.toString();

    if (!player1Answered.has(questionIdStr)) {
      match.player1Answers.push({
        questionId,
        answerIndex: null,
        correct: false,
        answeredAt: timeoutAt,
      });
    }

    if (!player2Answered.has(questionIdStr)) {
      match.player2Answers.push({
        questionId,
        answerIndex: null,
        correct: false,
        answeredAt: timeoutAt,
      });
    }
  }
}

async function finishDuel(nsp, match) {
  const matchId = match._id.toString();

  // Calculate total time for each player
  const startTime = match.startedAt.getTime();

  const p1LastAnswer = match.player1Answers[match.player1Answers.length - 1];
  const p2LastAnswer = match.player2Answers[match.player2Answers.length - 1];

  match.player1TotalTime = p1LastAnswer
    ? p1LastAnswer.answeredAt.getTime() - startTime
    : Infinity;
  match.player2TotalTime = p2LastAnswer
    ? p2LastAnswer.answeredAt.getTime() - startTime
    : Infinity;

  // Determine winner: score first, then time
  if (match.player1Score > match.player2Score) {
    match.winner = match.player1;
  } else if (match.player2Score > match.player1Score) {
    match.winner = match.player2;
  } else {
    // Tiebreaker: faster player wins
    match.winner =
      match.player1TotalTime <= match.player2TotalTime
        ? match.player1
        : match.player2;
  }

  match.status = "completed";
  match.endedAt = new Date();
  await match.save();

  clearDuelTimer(matchId);
  clearAllDisconnectTimers(matchId);

  nsp.to(matchId).emit("duel_end", {
    winner: match.winner,
    player1Score: match.player1Score,
    player2Score: match.player2Score,
  });
}
