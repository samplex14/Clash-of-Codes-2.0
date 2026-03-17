const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  phase: {
    type: Number,
    required: true,
    enum: [1, 2],
  },
  // Phase 2 round-specific question grouping: 1, 2, or 3.
  matchRound: {
    type: Number,
    enum: [1, 2, 3],
    default: null,
  },
  text: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => v.length === 4,
      message: "Questions must have exactly 4 options",
    },
  },
  correctIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

questionSchema.index({ phase: 1, matchRound: 1 });

module.exports = mongoose.model("Question", questionSchema);
