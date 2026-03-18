# Issue Intelligence Slack Bot

## Before first run

1. **Supabase:** In [Supabase](https://supabase.com) → your project → SQL Editor, run the full SQL from `DATABASE_SCHEMA.md` to create tables.

2. **Slack:** In [api.slack.com/apps](https://api.slack.com/apps) → your app:
   - **Basic Information** → copy **Signing Secret** → put in `.env` as `SLACK_SIGNING_SECRET`
   - **Socket Mode** → Enable → create **App-Level Token** (scope `connections:write`) → copy → put in `.env` as `SLACK_APP_TOKEN`
   - Use **Bot User OAuth Token** (starts with `xoxb-`) as `SLACK_BOT_TOKEN` if your current token doesn’t connect.

## Run

```bash
cd issue-intelligence-system/slack-bot
npm install
npm run dev
```

Server runs on port 3000. Health check: http://localhost:3000/health

## Approval dashboard API

The bot exposes:

- `GET /api/issues/pending` – list issues waiting for approval  
- `POST /api/issues/:id/approve` – approve and create Jira ticket  
- `POST /api/issues/:id/reject` – reject issue  
- `PUT /api/issues/:id/edit` – edit issue before approval  

Voice messages are not transcribed (no OpenAI/Whisper). Add `OPENAI_API_KEY` and transcription code later if needed.
