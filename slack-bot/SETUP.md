# Slack Bot Setup Instructions

## Overview
This is the core application that listens to Slack messages, analyzes them with AI, and manages the entire issue capture workflow.

## Prerequisites
Before Claude Code starts building, ensure you have:
- [ ] Slack workspace access
- [ ] Node.js installed (v18 or higher)
- [ ] npm or yarn installed
- [ ] Access to create Slack apps

## Technology Stack
- **Runtime:** Node.js v18+
- **Framework:** Express.js
- **Slack SDK:** @slack/bolt
- **AI:** Anthropic Claude API
- **Audio:** OpenAI Whisper API
- **Database:** Supabase (PostgreSQL)
- **Jira:** Jira REST API client

## Project Structure
```
slack-bot/
├── src/
│   ├── index.js                 # Main entry point
│   ├── config/
│   │   └── config.js           # Environment variables
│   ├── slack/
│   │   ├── bot.js              # Slack bot initialization
│   │   ├── listeners.js        # Event listeners
│   │   └── handlers.js         # Message handlers
│   ├── ai/
│   │   ├── classifier.js       # Message classification
│   │   ├── analyzer.js         # Issue analysis
│   │   └── followup.js         # Follow-up question generator
│   ├── database/
│   │   ├── client.js           # Supabase client
│   │   └── queries.js          # Database operations
│   ├── jira/
│   │   ├── client.js           # Jira API client
│   │   ├── tickets.js          # Ticket creation
│   │   └── webhooks.js         # Jira webhook handler
│   ├── services/
│   │   ├── transcription.js   # Whisper API integration
│   │   └── notifications.js   # Slack notifications
│   └── utils/
│       ├── logger.js           # Logging utility
│       └── helpers.js          # Helper functions
├── package.json
├── .env.example
└── README.md
```

## Installation Steps
1. Clone repository
2. Run `npm install`
3. Copy `.env.example` to `.env`
4. Fill in all API keys (see API_KEYS.md)
5. Run `npm run dev` to start

## Success Criteria
When setup is complete, you should be able to:
- [ ] Bot appears online in Slack
- [ ] Bot responds to @mentions
- [ ] Bot captures messages in configured channels
- [ ] Database connection works
- [ ] AI classification works on test message
