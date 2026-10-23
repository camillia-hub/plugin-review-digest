// plugin-review-digest
// Posts one compact digest comment whenever a task review is updated.
// Grant requested: comment-task (the plugin only ever returns comment operations).

const MAX_COMMENT_LENGTH = 10000;

const REVIEW_STATUS_KEYS = ["reviewStatus", "reviewState", "reviewDecision"];
const SUMMARY_KEYS = ["summary", "reviewSummary"];

function asString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
}

export function firstString(event, keys) {
  if (!event || typeof event !== "object") return "";
  for (const key of keys) {
    const value = asString(event[key]);
    if (value) return value;
  }
  return "";
}

function pushLine(lines, label, value) {
  if (value) lines.push("- **" + label + ":** " + value);
}

export function buildDigest(event) {
  if (!event || typeof event !== "object") return "";
  const title = asString(event.taskTitle);
  const lines = ["### Review digest" + (title ? " - " + title : "")];
  pushLine(lines, "Review status", firstString(event, REVIEW_STATUS_KEYS));
  pushLine(lines, "Task status", asString(event.taskStatus));
  pushLine(lines, "Summary", firstString(event, SUMMARY_KEYS));
  pushLine(lines, "Link", asString(event.taskUrl));
  pushLine(lines, "Updated at (UTC)", asString(event.occurredAtUtc));
  if (lines.length === 1) return "";
  let digest = lines.join("\n");
  if (digest.length > MAX_COMMENT_LENGTH) {
    digest = digest.slice(0, MAX_COMMENT_LENGTH - 3) + "...";
  }
  return digest;
}

export async function reviewUpdated(event) {
  const digest = buildDigest(event);
  if (!digest) return [];
  return [{ type: "comment", value: digest }];
}

export const hooks = {
  "task.review_updated": reviewUpdated,
};
