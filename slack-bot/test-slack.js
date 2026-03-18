import pkg from '@slack/bolt';
const { App } = pkg;
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Starting Slack connection test...');
console.log('Bot Token:', process.env.SLACK_BOT_TOKEN?.substring(0, 20) + '...');
console.log('App Token:', process.env.SLACK_APP_TOKEN?.substring(0, 20) + '...');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

// Listen to ALL messages
app.message(async ({ message, say }) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📨 MESSAGE RECEIVED!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('User:', message.user);
  console.log('Channel:', message.channel);
  console.log('Text:', message.text);
  console.log('Timestamp:', message.ts);
  console.log('Full message object:', JSON.stringify(message, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Send a simple reply to confirm it's working
  await say(`✅ Got your message: "${message.text}"`);
});

// Listen to app mentions
app.event('app_mention', async ({ event, say }) => {
  console.log('👋 BOT WAS MENTIONED!');
  console.log('Event:', JSON.stringify(event, null, 2));
  await say(`Hello! I heard you mention me!`);
});

// Start the app
(async () => {
  await app.start();
  console.log('⚡️ Slack test bot is running!');
  console.log('✅ Connected to Slack via Socket Mode');
  console.log('📢 Send any message in a channel where the bot is added...\n');
})();
