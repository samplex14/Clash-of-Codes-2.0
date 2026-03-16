const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth");
const {
  matchmake,
  getMatches,
  getMatch,
  advanceWinners,
  getFinalists,
} = require("../controllers/phase2Controller");

// Admin routes
router.post("/admin/phase2/matchmake", adminAuth, matchmake);
router.get("/admin/phase2/matches", adminAuth, getMatches);
router.post("/admin/phase2/advance", adminAuth, advanceWinners);
router.get("/admin/phase3/finalists", adminAuth, getFinalists);

// Public
router.get("/matches/:matchId", getMatch);

module.exports = router;
