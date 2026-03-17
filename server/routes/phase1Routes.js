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
const {
  phase1SubmitLimiter,
  adminActionLimiter,
} = require("../middleware/rateLimiters");

// Admin routes
router.post("/admin/phase1/start", adminActionLimiter, adminAuth, startPhase1);
router.post("/admin/phase1/end", adminActionLimiter, adminAuth, endPhase1);
router.get(
  "/admin/phase1/status",
  adminActionLimiter,
  adminAuth,
  getPhase1Status,
);
router.get(
  "/phase1/leaderboard",
  adminActionLimiter,
  adminAuth,
  getLeaderboard,
);

// Public routes
router.get("/phase1/status", getPhase1Status);
router.post("/phase1/submit", phase1SubmitLimiter, submitPhase1);
router.get("/phase1/questions", getPhase1Questions);

module.exports = router;
