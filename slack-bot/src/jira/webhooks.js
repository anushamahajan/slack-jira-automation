import express from 'express';
import { supabase } from '../database/client.js';
import { config } from '../config/config.js';
import { updateIssueStatus } from '../database/queries.js';
import { app as slackApp } from '../slack/bot.js';

export const router = express.Router();

router.post('/jira-webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.webhookEvent !== 'jira:issue_updated') {
      return res.sendStatus(200);
    }

    const issue = event.issue;
    const jiraKey = issue.key;
    const newStatus = issue.fields?.status?.name;

    const { data: dbIssue, error } = await supabase
      .from('issues')
      .select('*')
      .eq('jira_key', jiraKey)
      .maybeSingle();

    if (error || !dbIssue) {
      return res.sendStatus(200);
    }

    await updateIssueStatus(dbIssue.id, 'jira_created', {
      jira_status: newStatus,
      ...(newStatus === 'Done' && { jira_completed_at: new Date().toISOString() })
    });

    if (newStatus === 'Done') {
      try {
        await slackApp.client.chat.postMessage({
          channel: dbIssue.slack_channel_id,
          thread_ts: dbIssue.slack_thread_ts,
          text: `✅ Great news! Your issue has been resolved.\n\n*${dbIssue.title}*\nJira ticket: <https://${config.jira.host}/browse/${jiraKey}|${jiraKey}>`
        });
      } catch (e) {
        console.warn('Slack completion notification failed:', e.message);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});
