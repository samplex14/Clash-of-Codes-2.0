const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth");
const {
  register,
  getByUSN,
  getAll,
  getQualified,
} = require("../controllers/participantController");
const {
  participantRegisterLimiter,
  adminActionLimiter,
} = require("../middleware/rateLimiters");

router.post("/participants/register", participantRegisterLimiter, register);
router.get("/participants/:usn", getByUSN);

// Admin routes
router.get(
  "/admin/participants/qualified",
  adminActionLimiter,
  adminAuth,
  getQualified,
);
router.get("/admin/participants", adminActionLimiter, adminAuth, getAll);

module.exports = router;
