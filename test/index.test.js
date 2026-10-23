import test from "node:test";
import assert from "node:assert/strict";
import { buildDigest, firstString, hooks, reviewUpdated } from "../index.js";

test("hooks map registers task.review_updated", () => {
  assert.deepEqual(Object.keys(hooks), ["task.review_updated"]);
  assert.equal(typeof hooks["task.review_updated"], "function");
});

test("posts one digest comment with every present field rendered", async () => {
  const event = {
    hook: "task.review_updated",
    occurredAtUtc: "2026-10-23T10:00:00Z",
    taskId: "task-1",
    taskTitle: "Improve onboarding",
    taskStatus: "InReview",
    taskUrl: "https://example.test/tasks/1",
    reviewStatus: "approved",
    summary: "Looks good with two nits",
  };
  const ops = await reviewUpdated(event);
  assert.equal(ops.length, 1);
  assert.equal(ops[0].type, "comment");
  assert.ok(ops[0].value.includes("approved"));
  assert.ok(ops[0].value.includes("InReview"));
  assert.ok(ops[0].value.includes("Looks good with two nits"));
  assert.ok(ops[0].value.includes("https://example.test/tasks/1"));
  assert.ok(ops[0].value.includes("2026-10-23T10:00:00Z"));
});

test("renders only the fields that are present", async () => {
  const ops = await reviewUpdated({ taskStatus: "InReview" });
  assert.equal(ops.length, 1);
  assert.ok(ops[0].value.includes("InReview"));
  assert.ok(!ops[0].value.includes("Link"));
});

test("falls back to alternate review field names", () => {
  const fromState = firstString({ reviewState: "changes_requested" }, ["reviewStatus", "reviewState"]);
  assert.equal(fromState, "changes_requested");
  const digest = buildDigest({ reviewSummary: "needs work", taskTitle: "T" });
  assert.ok(digest.includes("needs work"));
});

test("no-ops when there is nothing to summarize", async () => {
  assert.deepEqual(await reviewUpdated({}), []);
  assert.deepEqual(await reviewUpdated({ taskTitle: "Only a title" }), []);
});

test("never throws on missing or malformed events", async () => {
  assert.deepEqual(await reviewUpdated(undefined), []);
  assert.deepEqual(await reviewUpdated(null), []);
  assert.deepEqual(await reviewUpdated("not an object"), []);
  assert.equal(buildDigest(undefined), "");
});

test("digest never exceeds the comment length limit", async () => {
  const big = { taskTitle: "T", summary: "x".repeat(50000), taskStatus: "InReview" };
  const ops = await reviewUpdated(big);
  assert.equal(ops.length, 1);
  assert.ok(ops[0].value.length <= 10000);
});
