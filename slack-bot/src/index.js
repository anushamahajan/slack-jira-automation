import express from 'express';
import cors from 'cors';
import { app as slackApp } from './slack/bot.js';
import './slack/listeners.js';
import { router as jiraRouter } from './jira/webhooks.js';
import { config } from './config/config.js';
import { testConnection } from './database/client.js';
import { testJiraConnection } from './jira/client.js';
import {
  getPendingApprovalIssues,
  getCompletedIssues,
  getIssueById,
  updateIssueStatus,
  updateIssueAnalysis
} from './database/queries.js';
import { createJiraTicket } from './jira/tickets.js';
import { notifyIssueCreated } from './services/notifications.js';

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

expressApp.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

expressApp.get('/api/issues/pending', async (req, res) => {
  try {
    const issues = await getPendingApprovalIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

expressApp.get('/api/issues/completed', async (req, res) => {
  try {
    const issues = await getCompletedIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

expressApp.post('/api/issues/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { modifications } = req.body || {};
    let issue = await getIssueById(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });

    if (modifications && (modifications.title || modifications.description || modifications.severity)) {
      await updateIssueAnalysis(id, { ...issue, ...modifications });
      issue = await getIssueById(id);
    }

    const jiraTicket = await createJiraTicket(issue);
    await notifyIssueCreated(issue, jiraTicket);

    res.json({ success: true, jira_key: jiraTicket.key, jira_url: jiraTicket.url });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: error.message });
  }
});

expressApp.post('/api/issues/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    await updateIssueStatus(id, 'rejected', { rejection_reason: reason || '' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

expressApp.put('/api/issues/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const issue = await getIssueById(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    await updateIssueAnalysis(id, { ...issue, ...updates });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

expressApp.use(jiraRouter);

async function start() {
  await testConnection();
  testJiraConnection();

  await slackApp.start();
  console.log('⚡️ Slack bot is running! (Use only this process for this app token—no test-channel.js at the same time.)');

  expressApp.listen(config.server.port, () => {
    console.log(`🚀 Server running on port ${config.server.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
