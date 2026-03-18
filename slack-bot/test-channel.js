import pkg from '@slack/bolt';
const { App } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const CHANNEL_ID = 'C0AC9N343FE';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN
});

(async () => {
  try {
    await app.start();
    console.log('✅ Bot connected to Slack\n');

    // Check if bot is in the channel
    console.log(`🔍 Checking channel: ${CHANNEL_ID}`);

    try {
      const channelInfo = await app.client.conversations.info({
        token: process.env.SLACK_BOT_TOKEN,
        channel: CHANNEL_ID
      });

      console.log('📢 Channel Info:');
      console.log('  Name:', channelInfo.channel.name);
      console.log('  Is Member:', channelInfo.channel.is_member);
      console.log('  Is Private:', channelInfo.channel.is_private);
      console.log();

      if (!channelInfo.channel.is_member) {
        console.log('⚠️ BOT IS NOT A MEMBER OF THIS CHANNEL!');
        console.log('➡️ You need to add the bot to the channel first.');
        console.log('   Go to Slack → Channel → Integrations → Add apps → Add your bot\n');
      } else {
        console.log('✅ Bot is a member of this channel!');

        // Try to read recent messages
        console.log('\n📨 Fetching recent messages...');
        const history = await app.client.conversations.history({
          token: process.env.SLACK_BOT_TOKEN,
          channel: CHANNEL_ID,
          limit: 100
        });

        console.log(`Found ${history.messages.length} recent messages:\n`);
        history.messages.forEach((msg, i) => {
          console.log(`Message ${i + 1}:`);
          console.log('  User:', msg.user || 'bot');
          console.log('  Text:', msg.text?.substring(0, 100));
          console.log('  Timestamp:', new Date(parseFloat(msg.ts) * 1000).toLocaleString());
          console.log();
        });
      }

      // Now listen for new messages
      console.log('👂 Listening for new messages in this channel...\n');

      // DEBUG: Log ALL incoming events to see what's arriving
      app.event('message', async ({ event }) => {
        console.log('🔔 RAW EVENT RECEIVED:', JSON.stringify(event, null, 2));
      });

      app.message(async ({ message }) => {
        console.log('📬 app.message triggered! Channel:', message.channel);
        if (message.channel === CHANNEL_ID) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📨 NEW MESSAGE IN CHANNEL!');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('Text:', message.text);
          console.log('User:', message.user);
          console.log('Channel:', message.channel);
          console.log('Timestamp:', message.ts);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
      });

    } catch (error) {
      console.error('❌ Error accessing channel:', error.message);

      if (error.data?.error === 'channel_not_found') {
        console.log('⚠️ Channel not found. Bot may not have access to this channel.');
      } else if (error.data?.error === 'not_in_channel') {
        console.log('⚠️ Bot is not in this channel. Please add it first.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
