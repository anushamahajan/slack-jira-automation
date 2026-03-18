import { app } from './bot.js';
import { config } from '../config/config.js';
import { handleMessage, handleVoiceMessage, handleThreadReply } from './handlers.js';

const { monitoredChannelIds } = config.slack;

// ─── Why "sometimes it listens, sometimes it doesn't" ─────────────────────
// • Only one process should use this app token at a time (e.g. don’t run test-channel.js and the main app together).
// • During nodemon restarts or WebSocket reconnects, events in that window can be lost.
// • Set SLACK_DEBUG=1 in .env to see socket connection logs and correlate "not listening" with disconnects.

if (monitoredChannelIds.length > 0) {
  console.log('👂 Listening only in channels:', monitoredChannelIds);
} else {
console.log('👂 Listening in all channels the bot is in');
}
// Private channels (groups) only work if your Slack App has Event Subscriptions → Subscribe to bot events → message.groups
console.log('   (Private channel? Add message.groups at api.slack.com/apps → your app → Event Subscriptions → Subscribe to bot events)');

app.message(async ({ message, say, client }) => {
  console.log('📩 Message event received:', { channel: message.channel, subtype: message.subtype, hasThread: !!(message.thread_ts && message.thread_ts !== message.ts) });

  if (message.subtype === 'bot_message') return;
  if (message.thread_ts && message.thread_ts !== message.ts) return;
  if (monitoredChannelIds.length > 0 && !monitoredChannelIds.includes(message.channel)) {
    console.log('⏭️ Skipping: channel not in monitoredChannelIds');
    return;
  }
  await handleMessage(message, say, client);
});

app.event('file_shared', async ({ event, client }) => {
  await handleVoiceMessage(event, client);
});

app.event('message', async ({ event, client }) => {
  if (event.thread_ts && event.thread_ts !== event.ts) {
    await handleThreadReply(event, client);
  }
});

console.log('👂 Slack listeners registered');
