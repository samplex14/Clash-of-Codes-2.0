const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    answerIndex: Number,
    correct: Boolean,
    answeredAt: Date,
  },
  { _id: false },
);

const matchSchema = new mongoose.Schema({
  round: {
    type: Number,
    required: true,
  },
  track: {
    type: String,
    required: true,
    enum: ["1st_year", "2nd_year"],
  },

  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant",
    required: true,
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Participant",
    required: true,
  },

  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],

  player1Answers: [answerSchema],
  player2Answers: [answerSchema],

  player1Score: { type: Number, default: 0 },
  player2Score: { type: Number, default: 0 },
  player1TotalTime: { type: Number, default: 0 },
  player2TotalTime: { type: Number, default: 0 },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
  status: {
    type: String,
    enum: ["pending", "active", "completed"],
    default: "pending",
  },

  startedAt: Date,
  endedAt: Date,
});

// Covers "all matches for round" and sorted admin list views.
matchSchema.index({ round: 1, track: 1, _id: 1 });

// Covers phase progression checks (e.g. incomplete matches in a round).
matchSchema.index({ round: 1, status: 1 });

// Useful for operational dashboards filtered by state.
matchSchema.index({ status: 1 });

module.exports = mongoose.model("Match", matchSchema);
