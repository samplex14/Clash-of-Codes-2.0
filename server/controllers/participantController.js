const Participant = require("../models/Participant");

// POST /api/participants/register
exports.register = async (req, res) => {
  try {
    const { usn, name, year } = req.body;
    if (!usn || !name || !year) {
      return res
        .status(400)
        .json({ error: "usn, name, and year are required" });
    }
    if (![1, 2].includes(year)) {
      return res.status(400).json({ error: "year must be 1 or 2" });
    }

    const existing = await Participant.findOne({ usn: usn.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: "USN already registered" });
    }

    const participant = await Participant.create({ usn, name, year });
    res.status(201).json({ success: true, participant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/participants/:usn
exports.getByUSN = async (req, res) => {
  try {
    const participant = await Participant.findOne({
      usn: req.params.usn.toUpperCase(),
    });
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }
    res.json(participant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/participants
exports.getAll = async (req, res) => {
  try {
    const participants = await Participant.find().sort({ registeredAt: -1 });
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/participants/qualified
exports.getQualified = async (req, res) => {
  try {
    const qualified = await Participant.find({ phase1Qualified: true }).sort({
      track: 1,
      phase1Score: -1,
      phase1Time: 1,
    });
    res.json(qualified);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
