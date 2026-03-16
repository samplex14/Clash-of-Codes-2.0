const router = require("express").Router();
const adminAuth = require("../middleware/adminAuth");
const {
  register,
  getByUSN,
  getAll,
  getQualified,
} = require("../controllers/participantController");

router.post("/participants/register", register);
router.get("/participants/:usn", getByUSN);

// Admin routes
router.get("/admin/participants/qualified", adminAuth, getQualified);
router.get("/admin/participants", adminAuth, getAll);

module.exports = router;
