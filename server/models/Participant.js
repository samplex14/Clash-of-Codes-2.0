const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema({
  usn: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    enum: [1, 2],
  },
  track: {
    type: String,
    enum: ["1st_year", "2nd_year"],
  },

  // Phase 1
  phase1Score: { type: Number, default: 0 },
  phase1Time: { type: Number, default: 0 },
  phase1Submitted: { type: Boolean, default: false },
  submittedAt: { type: Date, default: null },
  phase1Qualified: { type: Boolean, default: false },

  // Phase 2
  phase2Active: { type: Boolean, default: false },
  phase2Eliminated: { type: Boolean, default: false },
  phase2Wins: { type: Number, default: 0 },
  phase2TotalScore: { type: Number, default: 0 },

  // Phase 3
  phase3Qualified: { type: Boolean, default: false },

  registeredAt: { type: Date, default: Date.now },
});

// Track-scoped operations are common in qualification and matchmaking phases.
participantSchema.index({ track: 1 });

// Supports top-N leaderboard queries by track and tie-break time.
participantSchema.index({ track: 1, phase1Score: -1, submittedAt: 1 });

// Supports global ranking with score and submission-time tie-break.
participantSchema.index({
  phase1Submitted: 1,
  phase1Score: -1,
  submittedAt: 1,
});

// Supports admin qualified list sorted by score/time within each track.
participantSchema.index({
  phase1Qualified: 1,
  track: 1,
  phase1Score: -1,
  phase1Time: 1,
});

participantSchema.index({ phase2Wins: -1, phase2TotalScore: -1, phase1Score: -1 });

// Auto-assign track from year
participantSchema.pre("save", function (next) {
  if (this.isModified("year")) {
    this.track = this.year === 1 ? "1st_year" : "2nd_year";
  }
  next();
});

module.exports = mongoose.model("Participant", participantSchema);
