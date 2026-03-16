const test = require("node:test");
const assert = require("node:assert/strict");
const { shuffle } = require("../utils/matchmaking");

function sorted(arr) {
  return [...arr].sort((a, b) => a - b);
}

test("shuffle keeps all elements and array length", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const output = shuffle([...input]);

  assert.equal(output.length, input.length);
  assert.deepEqual(sorted(output), sorted(input));
});

test("shuffle safely handles empty and single-item arrays", () => {
  assert.deepEqual(shuffle([]), []);
  assert.deepEqual(shuffle([42]), [42]);
});
