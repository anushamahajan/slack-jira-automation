# slack-jira-automation

A Slack bot that listens to messages, figures out if something's a bug, asks follow-up questions if it needs more context, and creates a Jira ticket — all with one human approval click.

Built because my team was losing 100+ issues a month to Slack threads nobody followed up on.

---

## The problem

Issues were being reported everywhere — Slack DMs, verbal standups, emails — and going nowhere. No ticket, no owner, no fix. Engineers were spending hours chasing context. Reports were dying where they were born.

| | Before | After |
|---|---|---|
| Issues captured | ~15% | 100% |
| Time to Jira ticket | 2–3 days | < 5 min |
| Weekly tracking effort | 10+ hrs | ~15 min |
| Pattern visibility | none | weekly trends |

---

## How it works

```
Slack message → Classify → Follow-up (if needed) → Analyze → Approve → Jira
```

**Layer 1 — Classifier**
Reads the message and decides: is this actually a product issue, or just noise?
Returns `is_issue`, `confidence`, `context_completeness`.

**Layer 2 — Follow-up**
If context is thin, the bot replies in-thread with 1–3 targeted questions (what's the bug, where does it happen, who's affected). Waits for answers before moving on.
Returns `needs_followup`, `followup_questions[]`.

**Layer 3 — Analyzer**
Once there's enough context, extracts a full Jira-ready ticket: title, description, severity, category, priority, tags, and a confidence score.
Returns a complete JSON object.

**Approval UI**
A PM sees the generated ticket preview and approves with one click. Nothing hits Jira without a human reviewing it first.

---

## Stack

- **Slack Events API** — listens to messages and DMs
- **OpenAI API (GPT-4)** — powers all three prompt layers
- **Jira Cloud REST API** — creates tickets on approval
- **Node.js** — bot runtime

---

## Confidence scoring

Every layer returns a confidence score. Low confidence on classification triggers the follow-up flow instead of blocking the pipeline. The system asks clarifying questions rather than guessing — or worse, creating a half-baked ticket.

---

## What's next

- Jira → Slack status sync (Assigned → In Progress → Done, posted back to the original thread)
- Auto @mention assignee in Slack when ticket status changes
- Structured intake forms via Slack Workflows
- Pattern analytics dashboard (top issue categories, resolution times, which teams report most)

---

## Screenshots

**Bot capturing and asking follow-up in Slack**

<img width="1025" height="740" alt="Screenshot 2026-03-21 at 5 54 03 PM" src="https://github.com/user-attachments/assets/4933b33d-eb31-4bb8-be20-a085a1cbf598" />

**Auto-generated Jira ticket**

<img width="808" height="648" alt="Screenshot 2026-03-21 at 6 02 17 PM" src="https://github.com/user-attachments/assets/70335e53-c53d-47d3-99cd-dddb9c01574f" />
