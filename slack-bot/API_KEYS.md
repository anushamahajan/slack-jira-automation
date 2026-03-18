# API Keys Setup Guide

## 1. Slack App Setup

### Step 1: Create Slack App
1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name: "Issue Intelligence Bot"
5. Select your workspace

### Step 2: Bot Token Scopes
Go to "OAuth & Permissions" → "Scopes" → Add these:

**Bot Token Scopes:**
- `channels:history` - Read messages in channels
- `channels:read` - View basic channel info
- `chat:write` - Send messages
- `files:read` - Access uploaded files
- `reactions:write` - Add emoji reactions
- `users:read` - Get user names
- `im:history` - Read DMs
- `im:write` - Send DMs

### Step 3: Event Subscriptions
Go to "Event Subscriptions" → Enable → Subscribe to:
- `message.channels`
- `message.im`
- `file_shared`
- `app_mention`

### Step 4: Install App
1. Go to "Install App"
2. Click "Install to Workspace"
3. Authorize
4. Copy **Bot User OAuth Token** (starts with `xoxb-`)
5. Copy **Signing Secret** from "Basic Information"

### Step 5: Socket Mode (for local development)
1. Go to "Socket Mode"
2. Enable Socket Mode
3. Generate **App-Level Token** with `connections:write` scope
4. Copy token (starts with `xapp-`)

---

## 2. Anthropic Claude API

### Step 1: Create Account
1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Go to "API Keys"

### Step 2: Generate API Key
1. Click "Create Key"
2. Name it "Issue Bot"
3. Copy key (starts with `sk-ant-`)
4. **Save immediately** - won't be shown again!

**Cost:** ~$0.003 per issue (very cheap)
**Free tier:** $5 credit

---

## 3. OpenAI API (for Whisper)

### Step 1: Create Account
1. Go to https://platform.openai.com
2. Sign up / Log in
3. Add payment method (required for API)

### Step 2: Generate API Key
1. Go to "API Keys"
2. Click "Create new secret key"
3. Name it "Issue Bot Whisper"
4. Copy key (starts with `sk-`)

**Cost:** $0.006 per minute of audio

---

## 4. Supabase Database

### Step 1: Create Project
1. Go to https://supabase.com
2. Sign up (free)
3. Click "New Project"
4. Choose organization
5. Name: "Issue Intelligence"
6. Set database password (save it!)
7. Choose region (closest to you)
8. Click "Create"

### Step 2: Get Credentials
1. Go to Project Settings → API
2. Copy **Project URL** (like `https://xxx.supabase.co`)
3. Copy **anon public** key
4. Save both

### Step 3: Create Database Tables
1. Go to "SQL Editor"
2. Paste the SQL from `DATABASE_SCHEMA.md`
3. Click "Run"

---

## 5. Jira API

### Step 1: Generate API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Label: "Issue Bot"
4. Copy token (starts with `ATATT`)

### Step 2: Get Project Details
1. Go to your Jira
2. Open any project
3. Note the **Project Key** (like "PROD" in "PROD-123")
4. Note your **Jira domain** (like "company.atlassian.net")
5. Note your **email** (used to login to Jira)

### Step 3: Set Up Webhook (for notifications)
1. Jira Settings (⚙️) → System → Webhooks
2. Click "Create a Webhook"
3. Name: "Issue Bot Webhook"
4. URL: `https://your-server.com/jira-webhook` (you'll get this after deployment)
5. Events: Select "updated"
6. Save

---

## 6. Complete .env File

Create `.env` file with all your keys:

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-123456789-abcdefghij
SLACK_SIGNING_SECRET=abc123def456
SLACK_APP_TOKEN=xapp-1-ABC-123-xyz
SLACK_CHANNELS=bugs,product-issues

# AI
ANTHROPIC_API_KEY=sk-ant-api03-abc123
OPENAI_API_KEY=sk-xyz789

# Database
SUPABASE_URL=https://abcxyz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1...

# Jira
JIRA_HOST=yourcompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=ATATT3xFfG...
JIRA_PROJECT_KEY=PROD

# Server
PORT=3000
```

---

## Security Checklist

- [ ] Never commit `.env` to git
- [ ] Add `.env` to `.gitignore`
- [ ] Keep API keys private
- [ ] Rotate keys if exposed
- [ ] Use environment variables in production

---

## Cost Estimation

**Monthly costs (assuming 100 issues/month):**

- Slack: **Free**
- Anthropic Claude: **~$0.30** ($0.003 × 100)
- OpenAI Whisper: **~$0.60** (10 voice msgs × 1 min × $0.006)
- Supabase: **Free** (under 500MB)
- Jira: **Existing subscription**

**Total: < $1/month** 🎉
