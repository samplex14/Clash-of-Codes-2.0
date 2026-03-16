const Phase1Session = require("../models/Phase1Session");
const Participant = require("../models/Participant");
const Question = require("../models/Question");

// POST /api/admin/phase1/start
exports.startPhase1 = async (req, res) => {
  try {
    // End any existing active session
    await Phase1Session.updateMany(
      { status: "active" },
      { status: "ended", endedAt: new Date() },
    );

    const session = await Phase1Session.create({
      status: "active",
      startedAt: new Date(),
    });
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/phase1/end
exports.endPhase1 = async (req, res) => {
  try {
    const session = await Phase1Session.findOne({ status: "active" });
    if (!session) {
      return res.status(400).json({ error: "No active Phase 1 session" });
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    // Compute top 64 per track
    for (const track of ["1st_year", "2nd_year"]) {
      // Reset all qualifications for this track
      await Participant.updateMany(
        { track },
        { phase1Qualified: false, phase2Active: false },
      );

      // Get top 64 by score desc, then time asc
      const top64 = await Participant.find({ track, phase1Submitted: true })
        .sort({ phase1Score: -1, phase1Time: 1 })
        .limit(64);

      const top64Ids = top64.map((p) => p._id);
      await Participant.updateMany(
        { _id: { $in: top64Ids } },
        { phase1Qualified: true, phase2Active: true },
      );
    }

    res.json({
      success: true,
      message: "Phase 1 ended. Top 64 per track qualified.",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/phase1/status
exports.getPhase1Status = async (req, res) => {
  try {
    const session = await Phase1Session.findOne().sort({ _id: -1 });
    res.json(session || { status: "idle" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/phase1/submit
exports.submitPhase1 = async (req, res) => {
  try {
    const { usn, answers, timeTaken } = req.body;
    if (!usn || !answers || timeTaken === undefined) {
      return res
        .status(400)
        .json({ error: "usn, answers, and timeTaken are required" });
    }

    // Check Phase 1 is active
    const session = await Phase1Session.findOne({ status: "active" });
    if (!session) {
      return res.status(403).json({ error: "Phase 1 not active" });
    }

    const participant = await Participant.findOne({ usn: usn.toUpperCase() });
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }
    if (participant.phase1Submitted) {
      return res.status(409).json({ error: "Already submitted" });
    }

    // Score the answers
    const questions = await Question.find({ phase: 1 }).sort({ _id: 1 });
    let score = 0;
    for (let i = 0; i < questions.length && i < answers.length; i++) {
      if (answers[i] === questions[i].correctIndex) {
        score++;
      }
    }

    participant.phase1Score = score;
    participant.phase1Time = timeTaken;
    participant.phase1Submitted = true;
    await participant.save();

    res.json({
      success: true,
      score,
      total: questions.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/phase1/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Participant.find({ phase1Submitted: true })
      .select("usn name track phase1Score phase1Time phase1Qualified")
      .sort({ phase1Score: -1, phase1Time: 1 });
    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/phase1/questions (public — only when active)
exports.getPhase1Questions = async (req, res) => {
  try {
    const session = await Phase1Session.findOne({ status: "active" });
    if (!session) {
      return res.status(403).json({ error: "Phase 1 not active" });
    }

    // Return questions WITHOUT correctIndex
    const questions = await Question.find({ phase: 1 })
      .select("text options")
      .sort({ _id: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
