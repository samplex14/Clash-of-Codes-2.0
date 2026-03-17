/**
 * Phase 1 — Rapid Fire Socket.IO Handler
 *
 * Manages the real-time Phase 1 quiz flow:
 *   - Admin triggers phase1:start → questions pushed to all participants
 *   - Each participant receives questions in a unique shuffled order
 *   - Participants confirm answers one at a time (locked permanently)
 *   - Final submit grades all answers server-side and persists score
 *   - Sessions keyed by USN survive reconnects (socket ID changes)
 */

const Question = require("../models/Question");
const Participant = require("../models/Participant");
const Phase1Session = require("../models/Phase1Session");

// ──────────────────────────────────────────────
// In-memory state (lives for the duration of the round)
// ──────────────────────────────────────────────

/**
 * Cached questions with correct answers.
 * Populated on phase1:start, cleared when no longer needed.
 * Shape: [{ _id, text, options: [String], correctIndex }]
 */
let questionCache = null;

/**
 * Per-participant session state, keyed by USN (uppercase).
 * Survives reconnects because USN doesn't change, only socket ID does.
 *
 * Shape: {
 *   [usn]: {
 *     socketId: String,           // current socket ID (updated on reconnect)
 *     shuffleOrder: [ObjectId],   // question IDs in this participant's shuffled order
 *     confirmedAnswers: Map<questionIdStr, optionIndex>,
 *     submitted: Boolean,
 *     score: Number | null
 *   }
 * }
 */
const sessions = {};

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 */
function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Build the client-safe question payload for a given shuffle order.
 * Never includes correctIndex.
 */
function buildClientQuestions(shuffleOrder) {
  if (!questionCache) return [];

  // Create a lookup map: questionId → question doc
  const qMap = new Map();
  for (const q of questionCache) {
    qMap.set(q._id.toString(), q);
  }

  return shuffleOrder.map((qId) => {
    const q = qMap.get(qId.toString());
    if (!q) return null;
    return {
      questionId: q._id.toString(),
      text: q.text,
      options: q.options.map((text, idx) => ({ id: idx, text })),
    };
  }).filter(Boolean);
}

// ──────────────────────────────────────────────
// Socket handler — attached to the /phase1 namespace
// ──────────────────────────────────────────────

module.exports = function phase1Handler(nsp, socket) {

  // ─── phase1:join ────────────────────────────
  // Participant announces their USN on page load.
  // If they're reconnecting, restore their confirmed answers.
  socket.on("phase1:join", async ({ usn }, ack) => {
    try {
      if (!usn) {
        return safeAck(ack, { ok: false, error: "USN is required" });
      }

      const normalizedUsn = usn.toUpperCase().trim();

      // Verify participant exists in DB
      const participant = await Participant.findOne({ usn: normalizedUsn });
      if (!participant) {
        return safeAck(ack, { ok: false, error: "Participant not found" });
      }

      // Attach USN to socket for disconnect handling
      socket.usn = normalizedUsn;

      // Check if already submitted in DB (page refresh after submit)
      if (participant.phase1Submitted) {
        return safeAck(ack, {
          ok: true,
          alreadySubmitted: true,
          score: participant.phase1Score,
        });
      }

      // Existing session? Update socket ID (reconnect scenario)
      if (sessions[normalizedUsn]) {
        sessions[normalizedUsn].socketId = socket.id;

        // Convert confirmed answers Map to plain object for ack
        const confirmed = {};
        for (const [qId, optId] of sessions[normalizedUsn].confirmedAnswers) {
          confirmed[qId] = optId;
        }

        // If questions have already been pushed, resend them in this user's order
        let questions = null;
        if (questionCache && sessions[normalizedUsn].shuffleOrder) {
          questions = buildClientQuestions(sessions[normalizedUsn].shuffleOrder);
        }

        return safeAck(ack, {
          ok: true,
          reconnected: true,
          confirmedAnswers: confirmed,
          submitted: sessions[normalizedUsn].submitted,
          score: sessions[normalizedUsn].score,
          questions,
        });
      }

      // New session — create it
      sessions[normalizedUsn] = {
        socketId: socket.id,
        shuffleOrder: null,
        confirmedAnswers: new Map(),
        submitted: false,
        score: null,
      };

      safeAck(ack, { ok: true, reconnected: false });

    } catch (err) {
      console.error("phase1:join error:", err.message);
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  // ─── phase1:start ──────────────────────────
  // Admin triggers this to push questions to all connected participants.
  socket.on("phase1:start", async (data, ack) => {
    try {
      // Verify admin token
      const adminToken = data?.adminToken;
      if (!adminToken || adminToken !== process.env.ADMIN_SECRET) {
        return safeAck(ack, { ok: false, error: "Unauthorized" });
      }

      // Fetch all Phase 1 questions from DB and cache them (with correct answers)
      const questions = await Question.find({ phase: 1 });
      if (!questions || questions.length === 0) {
        return safeAck(ack, { ok: false, error: "No Phase 1 questions found in database" });
      }

      questionCache = questions;

      // Mark Phase 1 session as active in DB (same as REST endpoint)
      await Phase1Session.updateMany(
        { status: "active" },
        { status: "ended", endedAt: new Date() }
      );
      await Phase1Session.create({ status: "active", startedAt: new Date() });

      // For each connected participant session, generate a unique shuffle
      // and emit questions to their socket
      const questionIds = questions.map((q) => q._id);

      for (const [usn, session] of Object.entries(sessions)) {
        // Generate unique shuffle for this participant
        session.shuffleOrder = shuffle(questionIds);
        session.confirmedAnswers = new Map(); // reset on new start
        session.submitted = false;
        session.score = null;

        // Build client-safe question payload (no correctIndex)
        const clientQuestions = buildClientQuestions(session.shuffleOrder);

        // Emit to this participant's current socket
        nsp.to(session.socketId).emit("phase1:questions", clientQuestions);
      }

      console.log(`Phase 1 started — ${questions.length} questions pushed to ${Object.keys(sessions).length} participants`);
      safeAck(ack, { ok: true, questionCount: questions.length, participantCount: Object.keys(sessions).length });

    } catch (err) {
      console.error("phase1:start error:", err.message);
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  // ─── phase1:confirm_answer ──────────────────
  // Participant locks their answer for a specific question.
  // Once confirmed, it cannot be changed.
  socket.on("phase1:confirm_answer", async ({ questionId, selectedOptionId }, ack) => {
    try {
      const usn = socket.usn;
      if (!usn || !sessions[usn]) {
        return safeAck(ack, { ok: false, error: "Not joined. Emit phase1:join first." });
      }

      const session = sessions[usn];

      if (session.submitted) {
        return safeAck(ack, { ok: false, error: "Already submitted" });
      }

      if (!questionCache) {
        return safeAck(ack, { ok: false, error: "Phase 1 has not started yet" });
      }

      // Validate questionId exists in the cache
      const questionIdStr = String(questionId);
      const questionExists = questionCache.some((q) => q._id.toString() === questionIdStr);
      if (!questionExists) {
        return safeAck(ack, { ok: false, error: "Invalid question ID" });
      }

      // Check if already confirmed
      if (session.confirmedAnswers.has(questionIdStr)) {
        return safeAck(ack, { ok: false, error: "Answer already confirmed for this question" });
      }

      // Validate option index
      if (selectedOptionId === undefined || selectedOptionId === null || selectedOptionId < 0 || selectedOptionId > 3) {
        return safeAck(ack, { ok: false, error: "Invalid option ID (must be 0-3)" });
      }

      // Store the confirmed answer
      session.confirmedAnswers.set(questionIdStr, selectedOptionId);

      // Acknowledge back to client so it can lock the UI
      socket.emit("phase1:answer_confirmed", { questionId: questionIdStr });
      safeAck(ack, { ok: true, questionId: questionIdStr });

    } catch (err) {
      console.error("phase1:confirm_answer error:", err.message);
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  // ─── phase1:submit ──────────────────────────
  // Participant submits the last question answer and triggers grading.
  // Server validates that all prior questions are confirmed first.
  socket.on("phase1:submit", async ({ questionId, selectedOptionId }, ack) => {
    try {
      const usn = socket.usn;
      if (!usn || !sessions[usn]) {
        return safeAck(ack, { ok: false, error: "Not joined. Emit phase1:join first." });
      }

      const session = sessions[usn];

      if (session.submitted) {
        return safeAck(ack, { ok: false, error: "Already submitted" });
      }

      if (!questionCache || !session.shuffleOrder) {
        return safeAck(ack, { ok: false, error: "Phase 1 has not started yet" });
      }

      const totalQuestions = session.shuffleOrder.length;
      const questionIdStr = String(questionId);

      // Validate this is the last question in this participant's shuffle order
      const lastQuestionId = session.shuffleOrder[totalQuestions - 1].toString();
      if (questionIdStr !== lastQuestionId) {
        return safeAck(ack, {
          ok: false,
          error: "Submit is only for the last question. Use phase1:confirm_answer for others.",
        });
      }

      // Validate option index
      if (selectedOptionId === undefined || selectedOptionId === null || selectedOptionId < 0 || selectedOptionId > 3) {
        return safeAck(ack, { ok: false, error: "Invalid option ID (must be 0-3)" });
      }

      // Store the last answer
      session.confirmedAnswers.set(questionIdStr, selectedOptionId);

      // ── Validation: all questions must have confirmed answers ──
      const missingQuestions = [];
      for (const qId of session.shuffleOrder) {
        if (!session.confirmedAnswers.has(qId.toString())) {
          missingQuestions.push(qId.toString());
        }
      }

      if (missingQuestions.length > 0) {
        // Remove the last answer we just added, since submission failed
        session.confirmedAnswers.delete(questionIdStr);
        socket.emit("phase1:submit_error", {
          message: `${missingQuestions.length} question(s) not yet confirmed`,
          missingQuestions,
        });
        return safeAck(ack, { ok: false, error: "Some questions are not confirmed" });
      }

      // ── Grading ──
      // Compare each confirmed answer against the cached correct answer
      const qMap = new Map();
      for (const q of questionCache) {
        qMap.set(q._id.toString(), q);
      }

      let score = 0;
      const breakdown = [];

      for (const [qIdStr, selectedOpt] of session.confirmedAnswers) {
        const question = qMap.get(qIdStr);
        if (!question) continue;

        const correct = selectedOpt === question.correctIndex;
        if (correct) score++;

        breakdown.push({
          questionId: qIdStr,
          correct,
        });
      }

      // ── Persist to DB ──
      const participant = await Participant.findOne({ usn });
      if (!participant) {
        return safeAck(ack, { ok: false, error: "Participant not found in database" });
      }

      participant.phase1Score = score;
      participant.phase1Submitted = true;
      // timeTaken is not tracked in Socket.IO flow — can be added later if needed
      participant.phase1Time = 0;
      await participant.save();

      // Mark session as submitted
      session.submitted = true;
      session.score = score;

      // Emit result to this participant only
      socket.emit("phase1:result", {
        score,
        total: totalQuestions,
        breakdown,
      });

      console.log(`Phase 1 submitted: ${usn} scored ${score}/${totalQuestions}`);
      safeAck(ack, { ok: true, score, total: totalQuestions });

    } catch (err) {
      console.error("phase1:submit error:", err.message);
      safeAck(ack, { ok: false, error: err.message });
    }
  });

  // ─── disconnect ─────────────────────────────
  // Session survives in memory keyed by USN.
  // On reconnect, phase1:join restores state.
  socket.on("disconnect", () => {
    if (socket.usn) {
      console.log(`Phase 1: ${socket.usn} disconnected (session preserved)`);
    }
  });
};

/**
 * Helper: safe ack — only call callback if it's a function.
 */
function safeAck(ack, data) {
  if (typeof ack === "function") ack(data);
}

/**
 * Cleanup function — call when Phase 1 round is fully over.
 * Clears the in-memory cache and all sessions.
 */
module.exports.clearPhase1State = function clearPhase1State() {
  questionCache = null;
  for (const key of Object.keys(sessions)) {
    delete sessions[key];
  }
  console.log("Phase 1 in-memory state cleared");
};
