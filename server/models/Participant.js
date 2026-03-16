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
  phase1Qualified: { type: Boolean, default: false },

  // Phase 2
  phase2Active: { type: Boolean, default: false },
  phase2Eliminated: { type: Boolean, default: false },

  // Phase 3
  phase3Qualified: { type: Boolean, default: false },

  registeredAt: { type: Date, default: Date.now },
});

// Auto-assign track from year
participantSchema.pre("save", function (next) {
  if (this.isModified("year")) {
    this.track = this.year === 1 ? "1st_year" : "2nd_year";
  }
  next();
});

module.exports = mongoose.model("Participant", participantSchema);
