const test = require("node:test");
const assert = require("node:assert/strict");
const adminAuth = require("../middleware/adminAuth");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test("adminAuth rejects request with missing token", () => {
  process.env.ADMIN_SECRET = "top-secret";

  const req = { headers: {} };
  const res = createRes();
  let nextCalled = false;

  adminAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: "Unauthorized" });
});

test("adminAuth allows request with valid token", () => {
  process.env.ADMIN_SECRET = "top-secret";

  const req = { headers: { "x-admin-token": "top-secret" } };
  const res = createRes();
  let nextCalled = false;

  adminAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
