const Question = require("../models/Question");

// POST /api/admin/phase1/questions or /api/admin/phase2/questions
exports.addQuestion = (phase) => async (req, res) => {
  try {
    const { text, options, correctIndex, difficulty, tags } = req.body;
    if (!text || !options || correctIndex === undefined) {
      return res
        .status(400)
        .json({ error: "text, options, and correctIndex are required" });
    }

    const question = await Question.create({
      phase,
      text,
      options,
      correctIndex,
      difficulty,
      tags,
    });
    res.status(201).json({ success: true, question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/phase1/questions or /api/admin/phase2/questions
exports.getQuestions = (phase) => async (req, res) => {
  try {
    const questions = await Question.find({ phase }).sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/phase1/questions/:id or /api/admin/phase2/questions/:id
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
