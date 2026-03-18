import pkg from '@slack/bolt';
const { App, LogLevel } = pkg;
import { config } from '../config/config.js';

// SLACK_DEBUG=1 in .env shows socket connect/disconnect logs so you can see when the connection drops
const logLevel = process.env.SLACK_DEBUG === '1' ? LogLevel.DEBUG : LogLevel.INFO;

export const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
  logLevel
});

console.log('⚡️ Slack bot initialized');
