# Review Digest

Posts one compact digest comment on a task whenever its review is updated, so
followers can see the new review state without opening the review tool. The
digest renders whatever the event actually carries: review status, task
status, summary extras, link and timestamp. Missing fields are simply left
out, and if there is nothing to summarize the plugin stays silent.

## Hook registered

- `task.review_updated` → `reviewUpdated(event)` via the exported `hooks` map.

## Grants requested

- `comment-task` — the plugin's only operation is posting the digest comment.
  It never edits the task, so it does not need `edit-task`.

## Behaviour

- Returns at most one `comment` operation per event.
- Reads review state defensively from `reviewStatus`, `reviewState` or
  `reviewDecision`, and summary text from `summary` or `reviewSummary`.
- Any missing/undefined field is skipped; a missing or malformed event
  returns `[]` (no-op) and never throws.
- The comment is capped at the 10 000 character platform limit.

## Example

Event:

```json
{
  "hook": "task.review_updated",
  "occurredAtUtc": "2026-10-23T10:00:00Z",
  "taskTitle": "Improve onboarding",
  "taskStatus": "InReview",
  "taskUrl": "https://example.test/tasks/1",
  "reviewStatus": "approved",
  "summary": "Looks good with two nits"
}
```

Operations returned:

```json
[
  {
    "type": "comment",
    "value": "### Review digest - Improve onboarding\n- **Review status:** approved\n- **Task status:** InReview\n- **Summary:** Looks good with two nits\n- **Link:** https://example.test/tasks/1\n- **Updated at (UTC):** 2026-10-23T10:00:00Z"
  }
]
```

## Install

Install from the Camillia marketplace (or upload the files listed in
`extension.json`: `plugin.json`, `index.js`, `package.json`) and enable the plugin
for your workspace. Requires Node.js 22 or newer to run the tests with
`npm test`.
