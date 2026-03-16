const Match = require("../models/Match");
const Participant = require("../models/Participant");
const { generateMatches } = require("../utils/matchmaking");

// POST /api/admin/phase2/matchmake
exports.matchmake = async (req, res) => {
  try {
    const { round } = req.body;
    if (!round) {
      return res.status(400).json({ error: "round is required" });
    }

    const results = {};
    for (const track of ["1st_year", "2nd_year"]) {
      const matches = await generateMatches(track, round);
      results[track] = matches;
    }

    res.json({ success: true, matches: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/phase2/matches
exports.getMatches = async (req, res) => {
  try {
    const { round } = req.query;
    const filter = {};
    if (round) filter.round = Number(round);

    const matches = await Match.find(filter)
      .populate("player1", "usn name track")
      .populate("player2", "usn name track")
      .populate("winner", "usn name")
      .sort({ track: 1, _id: 1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/matches/:matchId
exports.getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("player1", "usn name track")
      .populate("player2", "usn name track")
      .populate("winner", "usn name");
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/phase2/advance
exports.advanceWinners = async (req, res) => {
  try {
    const { round } = req.body;
    if (!round) {
      return res.status(400).json({ error: "round is required" });
    }

    // Check all matches in this round are completed
    const pendingMatches = await Match.find({
      round,
      status: { $ne: "completed" },
    });
    if (pendingMatches.length > 0) {
      return res.status(400).json({
        error: `${pendingMatches.length} match(es) still incomplete in round ${round}`,
      });
    }

    // Mark losers as eliminated
    const matches = await Match.find({ round });
    for (const match of matches) {
      const loserId = match.winner.equals(match.player1)
        ? match.player2
        : match.player1;

      await Participant.findByIdAndUpdate(loserId, {
        phase2Eliminated: true,
        phase2Active: false,
      });
    }

    // Check if we're down to 8 per track — qualify for Phase 3
    for (const track of ["1st_year", "2nd_year"]) {
      const remaining = await Participant.find({
        track,
        phase2Active: true,
        phase2Eliminated: false,
      });
      if (remaining.length <= 8) {
        await Participant.updateMany(
          { _id: { $in: remaining.map((p) => p._id) } },
          { phase3Qualified: true },
        );
      }
    }

    res.json({ success: true, message: `Round ${round} winners advanced.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/phase3/finalists
exports.getFinalists = async (req, res) => {
  try {
    const finalists = await Participant.find({ phase3Qualified: true })
      .select("usn name track phase1Score phase1Time")
      .sort({ track: 1, phase1Score: -1, phase1Time: 1 });

    res.json(finalists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
