const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth");
const {
  startPhase1,
  endPhase1,
  getPhase1Status,
  submitPhase1,
  getLeaderboard,
  getPhase1Questions,
} = require("../controllers/phase1Controller");

// Admin routes
router.post("/admin/phase1/start", adminAuth, startPhase1);
router.post("/admin/phase1/end", adminAuth, endPhase1);
router.get("/admin/phase1/status", adminAuth, getPhase1Status);
router.get("/phase1/leaderboard", adminAuth, getLeaderboard);

// Public routes
router.post("/phase1/submit", submitPhase1);
router.get("/phase1/questions", getPhase1Questions);

module.exports = router;
