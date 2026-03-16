const mongoose = require("mongoose");

const phase1SessionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["idle", "active", "ended"],
    default: "idle",
  },
  startedAt: Date,
  endedAt: Date,
  durationSeconds: Number,
});

module.exports = mongoose.model("Phase1Session", phase1SessionSchema);
