import type { Server, Socket } from "socket.io";
import { db } from "./db";
import { env } from "./env";
import { computePhase1Qualification } from "./phase1Qualification";
import {
  assignMatchForParticipant,
  buildGhostOpponent,
  findOpponentForQueuedParticipant,
  type MatchmakingResult
} from "./matchmaking";
import { parseQuestionOptions } from "../types/question";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "../types/socket";

type PhaseSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type PhaseSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

let isPhase1Active = false;
let questionCache: Array<{ id: number; questionText: string; options: unknown; correctOptionId: string }> | null = null;
let phase1RoundSalt = "";
const participantShuffleMap = new Map<string, string[]>();
const confirmedAnswers = new Map<string, Map<string, string>>();
const participantSubmittedMap = new Map<string, boolean>();
const participantScoreMap = new Map<string, number>();
const socketToUSN = new Map<string, string>();
const usnToSocket = new Map<string, string>();
const matchmakingQueueIntervals = new Map<string, ReturnType<typeof setInterval>>();
const matchmakingQueueTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
let qualificationComputed = false;

const normalizeUsn = (usn: string | undefined): string => String(usn ?? "").trim().toUpperCase();

const createSeededRng = (seedInput: string): (() => number) => {
  let hash = 2166136261;

  for (let index = 0; index < seedInput.length; index += 1) {
    hash ^= seedInput.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let state = hash >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const buildDeterministicShuffle = (input: string[], usn: string, roundSalt: string): string[] => {
  const copy = [...input];
  const seededRandom = createSeededRng(`${usn}:${roundSalt}`);

  // Fisher-Yates shuffle using a deterministic RNG so reconnects preserve the same per-user order.
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(seededRandom() * (index + 1));
    const temp = copy[index];
    copy[index] = copy[randomIndex];
    copy[randomIndex] = temp;
  }

  return copy;
};

const safeAck = <T>(ack: ((data: T) => void) | undefined, payload: T): void => {
  if (typeof ack === "function") {
    ack(payload);
  }
};

const emitToUSN = (
  namespace: ReturnType<PhaseSocketServer["of"]>,
  usn: string,
  eventName: keyof ServerToClientEvents,
  payload?: unknown
): void => {
  const socketId = usnToSocket.get(usn);
  if (!socketId) {
    return;
  }

  const emitter = namespace.to(socketId) as unknown as {
    emit: (event: string, value?: unknown) => void;
  };

  emitter.emit(String(eventName), payload);
};

const clearMatchmakingTimerForUSN = (usn: string): void => {
  const queueInterval = matchmakingQueueIntervals.get(usn);
  if (queueInterval) {
    clearInterval(queueInterval);
    matchmakingQueueIntervals.delete(usn);
  }

  const queueTimeout = matchmakingQueueTimeouts.get(usn);
  if (queueTimeout) {
    clearTimeout(queueTimeout);
    matchmakingQueueTimeouts.delete(usn);
  }
};

const emitMatchmakingResult = (
  namespace: ReturnType<PhaseSocketServer["of"]>,
  usn: string,
  result: MatchmakingResult
): void => {
  if (result.status === "matched") {
    const matchedAt = result.matchedAt.toISOString();

    clearMatchmakingTimerForUSN(result.participant.usn);
    clearMatchmakingTimerForUSN(result.opponent.usn);

    emitToUSN(namespace, usn, "matchmaking:opponent_found", {
      opponentName: result.opponent.name,
      opponentUSN: result.opponent.usn,
      matchedAt
    });

    emitToUSN(namespace, result.opponent.usn, "matchmaking:opponent_found", {
      opponentName: result.participant.name,
      opponentUSN: result.participant.usn,
      matchedAt
    });

    return;
  }

  if (result.status === "waiting") {
    emitToUSN(namespace, usn, "matchmaking:waiting_in_queue", {
      message: result.queueMessage
    });
    return;
  }

  emitToUSN(namespace, usn, "matchmaking:waiting_in_queue", {
    message: result.message
  });
};

const setSocketIdentity = (socket: PhaseSocket, usn: string | undefined): string | null => {
  const normalizedUsn = normalizeUsn(usn);
  if (!normalizedUsn) {
    return null;
  }

  const previousSocketId = usnToSocket.get(normalizedUsn);
  if (previousSocketId) {
    socketToUSN.delete(previousSocketId);
  }

  socketToUSN.set(socket.id, normalizedUsn);
  usnToSocket.set(normalizedUsn, socket.id);
  socket.data.usn = normalizedUsn;
  return normalizedUsn;
};

const buildClientQuestionsFromOrder = (shuffleOrder: string[]) => {
  if (!questionCache) {
    return [];
  }

  const byId = new Map<string, { id: number; questionText: string; options: unknown }>();
  questionCache.forEach((question) => {
    byId.set(String(question.id), question);
  });

  return shuffleOrder
    .map((questionId) => {
      const question = byId.get(questionId);
      if (!question) {
        return null;
      }

      const options = parseQuestionOptions(question.options as never).map((option) => ({
        id: option.optionId,
        text: option.optionText
      }));

      return {
        questionId: String(question.id),
        text: question.questionText,
        options
      };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);
};

const routeParticipantsAfterPhase1End = async (
  namespace: ReturnType<PhaseSocketServer["of"]>
): Promise<void> => {
  const { ranked } = await computePhase1Qualification();

  ranked.forEach((participant) => {
    const payload = {
      usn: participant.usn,
      name: participant.name,
      rank: participant.rank,
      score: participant.phase1Score
    };

    if (participant.qualified) {
      emitToUSN(namespace, normalizeUsn(participant.usn), "phase1:qualified", payload);
      return;
    }

    emitToUSN(namespace, normalizeUsn(participant.usn), "phase1:eliminated", payload);
  });
};

const maybeCloseRoundIfAllSubmitted = async (
  namespace: ReturnType<PhaseSocketServer["of"]>
): Promise<void> => {
  if (!isPhase1Active || participantShuffleMap.size === 0) {
    return;
  }

  for (const usn of participantShuffleMap.keys()) {
    if (!participantSubmittedMap.get(usn)) {
      return;
    }
  }

  await db.phase1Session.updateMany({
    where: {
      status: "active"
    },
    data: {
      status: "ended",
      endedAt: new Date()
    }
  });

  isPhase1Active = false;

  if (!qualificationComputed) {
    qualificationComputed = true;
    await routeParticipantsAfterPhase1End(namespace);
  }
};

const isAdminAuthorized = (token: string | undefined): boolean => token === env.ADMIN_SECRET;

export const initSocketHandlers = (io: PhaseSocketServer): void => {
  const namespace = io.of("/phase1");

  namespace.on("connection", (socket: PhaseSocket) => {
    const handleRejoin: ClientToServerEvents["phase1:rejoin"] = async ({ usn }, ack) => {
      try {
        const normalizedUsn = setSocketIdentity(socket, usn);
        if (!normalizedUsn) {
          safeAck(ack, { ok: false, error: "USN is required" });
          return;
        }

        if (!isPhase1Active) {
          const participant = await db.participant.findUnique({ where: { usn: normalizedUsn } });
          if (participant?.submittedAt) {
            if (participant.qualified) {
              emitToUSN(namespace, normalizedUsn, "phase1:qualified", {
                usn: participant.usn,
                name: participant.name,
                rank: 0,
                score: participant.phase1Score
              });
            } else {
              emitToUSN(namespace, normalizedUsn, "phase1:eliminated", {
                usn: participant.usn,
                name: participant.name,
                rank: 0,
                score: participant.phase1Score
              });
            }

            safeAck(ack, { ok: true, status: "phase1_ended" });
            return;
          }

          socket.emit("phase1:not_started");
          safeAck(ack, { ok: false, status: "not_started" });
          return;
        }

        const shuffleOrder = participantShuffleMap.get(normalizedUsn);
        if (!shuffleOrder) {
          socket.emit("phase1:unauthorized", { message: "Participant not part of this round" });
          safeAck(ack, { ok: false, status: "unauthorized" });
          return;
        }

        socket.emit("phase1:questions", buildClientQuestionsFromOrder(shuffleOrder));
        safeAck(ack, { ok: true, submitted: Boolean(participantSubmittedMap.get(normalizedUsn)) });
      } catch (error: unknown) {
        safeAck(ack, {
          ok: false,
          error: error instanceof Error ? error.message : "Unexpected rejoin error"
        });
      }
    };

    socket.on("phase1:join", handleRejoin);
    socket.on("phase1:rejoin", handleRejoin);
    socket.on("reconnect:check", handleRejoin);

    socket.on("phase1:start", async ({ adminToken }, ack) => {
      try {
        if (!isAdminAuthorized(adminToken)) {
          safeAck(ack, { ok: false, error: "Unauthorized" });
          return;
        }

        const questions = await db.question.findMany({
          orderBy: {
            id: "asc"
          }
        });

        if (questions.length === 0) {
          safeAck(ack, { ok: false, error: "No Phase 1 questions found in database" });
          return;
        }

        const participants = await db.participant.findMany({ select: { usn: true } });
        if (participants.length === 0) {
          safeAck(ack, { ok: false, error: "No registered participants found" });
          return;
        }

        isPhase1Active = true;
        questionCache = questions;
        phase1RoundSalt = `${Date.now()}:${questions.length}`;
        participantShuffleMap.clear();
        confirmedAnswers.clear();
        participantSubmittedMap.clear();
        participantScoreMap.clear();
        qualificationComputed = false;

        const questionIds = questions.map((question) => String(question.id));

        participants.forEach((participant) => {
          const usn = normalizeUsn(participant.usn);
          participantShuffleMap.set(usn, buildDeterministicShuffle(questionIds, usn, phase1RoundSalt));
          confirmedAnswers.set(usn, new Map<string, string>());
          participantSubmittedMap.set(usn, false);
          participantScoreMap.set(usn, 0);
        });

        await db.phase1Session.updateMany({
          where: {
            status: "active"
          },
          data: {
            status: "ended",
            endedAt: new Date()
          }
        });

        await db.phase1Session.create({
          data: {
            status: "active",
            startedAt: new Date()
          }
        });

        namespace.emit("phase1:started");

        participantShuffleMap.forEach((shuffleOrder, usn) => {
          emitToUSN(namespace, usn, "phase1:questions", buildClientQuestionsFromOrder(shuffleOrder));
        });

        safeAck(ack, {
          ok: true,
          questionCount: questions.length,
          participantCount: participantShuffleMap.size
        });
      } catch (error: unknown) {
        safeAck(ack, {
          ok: false,
          error: error instanceof Error ? error.message : "Unexpected phase1:start error"
        });
      }
    });

    socket.on("phase1:end", async ({ adminToken }, ack) => {
      try {
        if (!isAdminAuthorized(adminToken)) {
          safeAck(ack, { ok: false, error: "Unauthorized" });
          return;
        }

        await db.phase1Session.updateMany({
          where: {
            status: "active"
          },
          data: {
            status: "ended",
            endedAt: new Date()
          }
        });

        isPhase1Active = false;
        if (!qualificationComputed) {
          qualificationComputed = true;
          await routeParticipantsAfterPhase1End(namespace);
        }

        namespace.emit("phase1:ended");
        safeAck(ack, { ok: true });
      } catch (error: unknown) {
        safeAck(ack, {
          ok: false,
          error: error instanceof Error ? error.message : "Unexpected phase1:end error"
        });
      }
    });

    socket.on("phase1:confirm_answer", ({ questionId, selectedOptionId }, ack) => {
      const usn = socketToUSN.get(socket.id);

      if (!usn) {
        safeAck(ack, { ok: false, error: "Not joined. Emit phase1:rejoin first." });
        return;
      }

      if (!isPhase1Active) {
        safeAck(ack, { ok: false, error: "Phase 1 is not active" });
        return;
      }

      const userOrder = participantShuffleMap.get(usn) ?? [];
      const qId = String(questionId);

      if (!userOrder.includes(qId)) {
        safeAck(ack, { ok: false, error: "Invalid question ID for this participant" });
        return;
      }

      const userAnswers = confirmedAnswers.get(usn) ?? new Map<string, string>();
      if (userAnswers.has(qId)) {
        safeAck(ack, { ok: false, error: "Answer already confirmed for this question" });
        return;
      }

      userAnswers.set(qId, String(selectedOptionId));
      confirmedAnswers.set(usn, userAnswers);
      emitToUSN(namespace, usn, "phase1:answer_confirmed", { questionId: qId });
      safeAck(ack, { ok: true, questionId: qId });
    });

    socket.on("phase1:submit", async ({ questionId, selectedOptionId }, ack) => {
      try {
        const usn = socketToUSN.get(socket.id);

        if (!usn) {
          safeAck(ack, { ok: false, error: "Not joined. Emit phase1:rejoin first." });
          return;
        }

        if (!isPhase1Active) {
          safeAck(ack, { ok: false, error: "Phase 1 is not active" });
          return;
        }

        const userOrder = participantShuffleMap.get(usn) ?? [];
        if (userOrder.length === 0 || !questionCache) {
          safeAck(ack, { ok: false, error: "Phase 1 has not started yet" });
          return;
        }

        const lastQuestionId = userOrder[userOrder.length - 1];
        const submittedQuestionId = String(questionId);

        if (submittedQuestionId !== lastQuestionId) {
          safeAck(ack, {
            ok: false,
            error: "Submit is only for the last question. Use phase1:confirm_answer for others."
          });
          return;
        }

        const userAnswers = confirmedAnswers.get(usn) ?? new Map<string, string>();
        const alreadyHadLastAnswer = userAnswers.has(submittedQuestionId);

        if (!alreadyHadLastAnswer) {
          userAnswers.set(submittedQuestionId, String(selectedOptionId));
        }

        const missingQuestions = userOrder.filter((id) => !userAnswers.has(id));
        if (missingQuestions.length > 0) {
          if (!alreadyHadLastAnswer) {
            userAnswers.delete(submittedQuestionId);
          }

          confirmedAnswers.set(usn, userAnswers);
          emitToUSN(namespace, usn, "phase1:submit_error", {
            message: `${missingQuestions.length} question(s) not yet confirmed`,
            missingQuestions
          });
          safeAck(ack, { ok: false, error: "Some questions are not confirmed" });
          return;
        }

        const questionMap = new Map<string, { correctOptionId: string }>();
        questionCache.forEach((question) => {
          questionMap.set(String(question.id), {
            correctOptionId: question.correctOptionId
          });
        });

        let score = 0;
        const breakdown = userOrder.map((id) => {
          const question = questionMap.get(id);
          const selected = userAnswers.get(id);
          const correct = question ? selected === question.correctOptionId : false;
          if (correct) {
            score += 1;
          }
          return {
            questionId: id,
            correct
          };
        });

        await db.participant.update({
          where: {
            usn
          },
          data: {
            phase1Score: score,
            submittedAt: new Date()
          }
        });

        participantSubmittedMap.set(usn, true);
        participantScoreMap.set(usn, score);
        confirmedAnswers.set(usn, userAnswers);

        emitToUSN(namespace, usn, "phase1:result", {
          score,
          total: userOrder.length,
          qualified: false,
          rank: 0,
          breakdown
        });

        safeAck(ack, { ok: true, score, total: userOrder.length });
        await maybeCloseRoundIfAllSubmitted(namespace);
      } catch (error: unknown) {
        safeAck(ack, {
          ok: false,
          error: error instanceof Error ? error.message : "Unexpected phase1:submit error"
        });
      }
    });

    socket.on("matchmaking:enter_arena", async ({ usn }) => {
      const normalizedUsn = setSocketIdentity(socket, usn);
      if (!normalizedUsn) {
        socket.emit("matchmaking:waiting_in_queue", { message: "War tag missing. Re-enter the village gate." });
        return;
      }

      socket.emit("matchmaking:searching", { message: "Scouting the battlefield for a rival..." });

      try {
        const result = await assignMatchForParticipant(normalizedUsn);
        emitMatchmakingResult(namespace, normalizedUsn, result);
      } catch (error: unknown) {
        emitToUSN(namespace, normalizedUsn, "matchmaking:waiting_in_queue", {
          message: error instanceof Error ? error.message : "Battle search failed. Keep scouting."
        });
      }
    });

    socket.on("matchmaking:find_opponent", ({ usn }) => {
      const normalizedUsn = setSocketIdentity(socket, usn);
      if (!normalizedUsn) {
        socket.emit("matchmaking:waiting_in_queue", { message: "War tag missing. Re-enter the village gate." });
        return;
      }

      if (matchmakingQueueIntervals.has(normalizedUsn)) {
        return;
      }

      let tickInFlight = false;
      const queueInterval = setInterval(() => {
        if (tickInFlight) {
          return;
        }

        tickInFlight = true;
        void findOpponentForQueuedParticipant(normalizedUsn)
          .then((result) => {
            if (result.status === "matched") {
              emitMatchmakingResult(namespace, normalizedUsn, result);
              return;
            }

            if (result.status === "retry") {
              emitToUSN(namespace, normalizedUsn, "matchmaking:waiting_in_queue", {
                message: result.message
              });
            }
          })
          .finally(() => {
            tickInFlight = false;
          });
      }, 3000);

      const queueTimeout = setTimeout(() => {
        clearMatchmakingTimerForUSN(normalizedUsn);
        const ghostOpponent = buildGhostOpponent();

        void db.$executeRaw`
          UPDATE "Participant"
          SET "mappedTo" = ${ghostOpponent.usn},
              "mappedAt" = NOW(),
              "updatedAt" = NOW()
          WHERE "usn" = ${normalizedUsn}
        `;

        emitToUSN(namespace, normalizedUsn, "matchmaking:timeout", {
          ghostOpponent
        });
      }, 60000);

      matchmakingQueueIntervals.set(normalizedUsn, queueInterval);
      matchmakingQueueTimeouts.set(normalizedUsn, queueTimeout);
    });

    socket.on("disconnect", () => {
      const usn = socketToUSN.get(socket.id);
      socketToUSN.delete(socket.id);

      if (usn && usnToSocket.get(usn) === socket.id) {
        usnToSocket.delete(usn);
        clearMatchmakingTimerForUSN(usn);
      }
    });
  });
};
