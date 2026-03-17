const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth");
const {
  matchmake,
  getMatches,
  getMatch,
  advanceWinners,
  getFinalists,
} = require("../controllers/phase2Controller");
const { adminActionLimiter } = require("../middleware/rateLimiters");

// Admin routes
router.post(
  "/admin/phase2/matchmake",
  adminActionLimiter,
  adminAuth,
  matchmake,
);
router.get("/admin/phase2/matches", adminActionLimiter, adminAuth, getMatches);
router.post(
  "/admin/phase2/advance",
  adminActionLimiter,
  adminAuth,
  advanceWinners,
);
router.get(
  "/admin/phase3/finalists",
  adminActionLimiter,
  adminAuth,
  getFinalists,
);

// Public
router.get("/matches/:matchId", getMatch);

module.exports = router;
