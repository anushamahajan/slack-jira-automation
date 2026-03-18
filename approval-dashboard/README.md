# Issue Intelligence Dashboard

Web UI to review and approve issues before they become Jira tickets.

## Run

```bash
cd issue-intelligence-system/approval-dashboard
npm install
npm run dev
```

Open http://localhost:5173

**Login:** Use the password from `.env` → `VITE_DASHBOARD_PASSWORD` (default in code: `admin123` if not set). Change it in `.env` for real use.

The dashboard calls the Slack bot backend. Start the **slack-bot** first and set `VITE_API_URL` in `.env` to its URL (e.g. `http://localhost:3000`).
