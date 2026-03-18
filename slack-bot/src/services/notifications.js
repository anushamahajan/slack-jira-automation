import { app } from '../slack/bot.js';
import { config } from '../config/config.js';

export async function notifyIssueCreated(issue, jiraTicket) {
  try {
    await app.client.chat.postMessage({
      channel: issue.user_id,
      text: `✅ Your issue has been tracked!\n\n*${issue.title}*\n\nJira ticket: <${jiraTicket.url}|${jiraTicket.key}>\n\nYou'll be notified when it's resolved.`
    });
  } catch (e) {
    console.warn('DM failed:', e.message);
  }
  try {
    await app.client.chat.postMessage({
      channel: issue.slack_channel_id,
      thread_ts: issue.slack_thread_ts,
      text: `✅ Issue tracked: <${jiraTicket.url}|${jiraTicket.key}>`
    });
  } catch (e) {
    console.warn('Thread post failed:', e.message);
  }
  console.log('📨 Notifications sent');
}

export async function notifyIssueCompleted(issue) {
  try {
    await app.client.chat.postMessage({
      channel: issue.slack_channel_id,
      thread_ts: issue.slack_thread_ts,
      text: `✅ This issue has been resolved! <https://${config.jira.host}/browse/${issue.jira_key}|${issue.jira_key}>`
    });
  } catch (e) {
    console.error('Notification error:', e);
  }
}
