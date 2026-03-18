import dotenv from 'dotenv';
dotenv.config();

const required = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'SLACK_APP_TOKEN',
  'OPENAI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'JIRA_HOST',
  'JIRA_EMAIL',
  'JIRA_API_TOKEN',
  'JIRA_PROJECT_KEY'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Optional: only process issue workflow in these channel IDs.
// Example: SLACK_MONITORED_CHANNEL_IDS=C0AC9N343FE (testing-automations). If empty, process all channels.
const monitoredChannelIds = process.env.SLACK_MONITORED_CHANNEL_IDS
  ? process.env.SLACK_MONITORED_CHANNEL_IDS.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
    channels: process.env.SLACK_CHANNELS?.split(',') || [],
    /** If non-empty, only run issue workflow in these channel IDs. */
    monitoredChannelIds
  },
  ai: {
    openaiKey: process.env.OPENAI_API_KEY
  },
  database: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  jira: {
    host: process.env.JIRA_HOST,
    email: process.env.JIRA_EMAIL,
    apiToken: process.env.JIRA_API_TOKEN,
    projectKey: process.env.JIRA_PROJECT_KEY
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
