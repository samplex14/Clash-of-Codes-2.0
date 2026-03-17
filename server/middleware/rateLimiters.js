const rateLimit = require("express-rate-limit");

function toRateKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function createLimiter({ windowMs, max, keyGenerator, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      const retryAfterSec = resetTime
        ? Math.max(
            1,
            Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000),
          )
        : Math.ceil(windowMs / 1000);

      res.status(429).json({
        error: message,
        retryAfterSec,
      });
    },
  });
}

const phase1SubmitLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 4,
  message: "Too many submit attempts. Please wait before trying again.",
  keyGenerator: (req) => {
    const usn = toRateKey(req.body?.usn);
    return usn ? `usn:${usn}` : `ip:${req.ip}`;
  },
});

const participantRegisterLimiter = createLimiter({
  windowMs: 5 * 60 * 1000,
  max: 8,
  message: "Too many registration attempts. Please try again later.",
  keyGenerator: (req) => {
    const usn = toRateKey(req.body?.usn);
    return usn ? `usn:${usn}` : `ip:${req.ip}`;
  },
});

const adminActionLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many admin requests. Slow down and try again.",
  keyGenerator: (req) => {
    const token = toRateKey(req.headers["x-admin-token"]);
    return token ? `token:${token}` : `ip:${req.ip}`;
  },
});

module.exports = {
  phase1SubmitLimiter,
  participantRegisterLimiter,
  adminActionLimiter,
};
