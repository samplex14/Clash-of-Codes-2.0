const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth");
const {
  addQuestion,
  getQuestions,
  deleteQuestion,
} = require("../controllers/questionController");

// Phase 1 questions (admin)
router.post("/admin/phase1/questions", adminAuth, addQuestion(1));
router.get("/admin/phase1/questions", adminAuth, getQuestions(1));
router.delete("/admin/phase1/questions/:id", adminAuth, deleteQuestion);

// Phase 2 questions (admin)
router.post("/admin/phase2/questions", adminAuth, addQuestion(2));
router.get("/admin/phase2/questions", adminAuth, getQuestions(2));
router.delete("/admin/phase2/questions/:id", adminAuth, deleteQuestion);

module.exports = router;
