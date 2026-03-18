# Slack Bot Implementation Guide

## For Claude Code: Build Instructions

You are building a Slack bot that captures product issues, analyzes them with AI, and creates Jira tickets. Follow these instructions carefully.

---

## Step 1: Initialize Project

Create a Node.js project with these dependencies:

```json
{
  "name": "issue-intelligence-bot",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "@slack/bolt": "^3.17.0",
    "@anthropic-ai/sdk": "^0.17.0",
    "openai": "^4.26.0",
    "@supabase/supabase-js": "^2.39.0",
    "jira-client": "^8.2.2",
    "express": "^4.18.2",
    "dotenv": "^16.4.1",
    "winston": "^3.11.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}
```

---

## Step 2: Configuration Setup

### File: `src/config/config.js`

Load and validate all environment variables:

```javascript
import dotenv from 'dotenv';
dotenv.config();

// Validate that all required env vars exist
const required = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'SLACK_APP_TOKEN',
  'ANTHROPIC_API_KEY',
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

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    channels: process.env.SLACK_CHANNELS?.split(',') || []
  },
  ai: {
    anthropicKey: process.env.ANTHROPIC_API_KEY,
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
    port: process.env.PORT || 3000
  }
};
```

---

## Step 3: Database Client

### File: `src/database/client.js`

Set up Supabase client and all database operations:

```javascript
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';

export const supabase = createClient(
  config.database.url,
  config.database.key
);

// Test connection
async function testConnection() {
  const { data, error } = await supabase
    .from('issues')
    .select('count')
    .limit(1);
  
  if (error) throw error;
  console.log('✅ Database connected');
}

testConnection();
```

### File: `src/database/queries.js`

All database operations:

```javascript
import { supabase } from './client.js';

export async function createIssue(data) {
  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      slack_message_id: data.message_id,
      slack_channel_id: data.channel_id,
      slack_thread_ts: data.thread_ts,
      user_id: data.user_id,
      user_name: data.user_name,
      original_text: data.text,
      is_voice: data.is_voice || false,
      audio_url: data.audio_url || null,
      status: 'captured'
    })
    .select()
    .single();

  if (error) throw error;
  return issue;
}

export async function updateIssueAnalysis(issueId, analysis) {
  const { data, error } = await supabase
    .from('issues')
    .update({
      title: analysis.title,
      description: analysis.description,
      severity: analysis.severity,
      category: analysis.category,
      affected_area: analysis.affected_area,
      is_complete: analysis.is_complete,
      missing_info: analysis.missing_info,
      confidence_score: analysis.confidence_score,
      status: analysis.is_complete ? 'pending_approval' : 'awaiting_response',
      updated_at: new Date().toISOString()
    })
    .eq('id', issueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateIssueStatus(issueId, status, additionalData = {}) {
  const { data, error } = await supabase
    .from('issues')
    .update({
      status,
      ...additionalData,
      updated_at: new Date().toISOString()
    })
    .eq('id', issueId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingApprovalIssues() {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getIssueById(issueId) {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', issueId)
    .single();

  if (error) throw error;
  return data;
}

export async function recordFollowup(issueId, question, answer) {
  const { data, error } = await supabase
    .from('followup_messages')
    .insert({
      issue_id: issueId,
      question,
      answer
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

---

## Step 4: AI Integration

### File: `src/ai/classifier.js`

Message classification logic:

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config.js';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicKey
});

export async function classifyMessage(text, context = {}) {
  const prompt = `You are a product issue classifier. Analyze this Slack message and determine if it's reporting a product issue.

Message: "${text}"
Channel: ${context.channel_name || 'unknown'}
User: ${context.user_name || 'unknown'}

Return ONLY valid JSON with this exact structure:
{
  "is_issue": boolean,
  "confidence": number (0-100),
  "reasoning": "brief explanation"
}

Examples of ISSUES (return is_issue: true):
- "The dashboard is loading slowly"
- "Export button not working"
- "Users can't login"
- "This workflow is confusing"
- Bug reports with [BUG] prefix

Examples of NOT ISSUES (return is_issue: false):
- "Good morning team"
- "When is the meeting?"
- "Thanks for the update"
- General chitchat`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      is_issue: result.is_issue,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Classification error:', error);
    // Default to safe behavior - assume it might be an issue
    return {
      is_issue: true,
      confidence: 50,
      reasoning: 'Error in classification, defaulting to manual review'
    };
  }
}
```

### File: `src/ai/analyzer.js`

Issue analysis logic:

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/config.js';

const anthropic = new Anthropic({
  apiKey: config.ai.anthropicKey
});

export async function analyzeIssue(text, additionalContext = '') {
  const prompt = `You are a product issue analyzer. Extract structured information from this issue report.

Original Message: "${text}"
${additionalContext ? `Additional Context: "${additionalContext}"` : ''}

Extract and return ONLY valid JSON:
{
  "title": "short, actionable title (max 80 chars)",
  "description": "detailed description of the issue",
  "severity": "critical" | "high" | "medium" | "low",
  "category": "bug" | "feature_request" | "ux_issue" | "candidate_funnel" | "question",
  "affected_area": "sales" | "ops" | "tech" | "product" | "other",
  "is_complete": boolean (do we have enough info to act?),
  "missing_info": ["what else we need to know"],
  "suggested_followup_questions": ["2-3 specific questions to ask"],
  "confidence_score": number (0-100, how confident are you?)
}

Severity Guidelines:
- critical: System down, data loss, security breach
- high: Major feature broken, blocking users
- medium: Feature partially broken, workarounds exist
- low: Minor issue, cosmetic problem

Mark is_complete as false if missing:
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Browser/device info (if relevant)
- Affected users/scale`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleaned);

    return analysis;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}
```

### File: `src/ai/followup.js`

Follow-up question handler:

```javascript
export function formatFollowupQuestions(questions) {
  const numbered = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  
  return `Thanks for reporting this issue! 🙏

To help us fix this faster, could you provide a bit more info?

${numbered}

Please reply in this thread with the answers.`;
}
```

---

## Step 5: Slack Integration

### File: `src/slack/bot.js`

Initialize Slack bot:

```javascript
import { App } from '@slack/bolt';
import { config } from '../config/config.js';

export const app = new App({
  token: config.slack.botToken,
  signingSecret: config.slack.signingSecret,
  socketMode: true,
  appToken: config.slack.appToken,
  port: config.server.port
});

console.log('⚡️ Slack bot initialized');
```

### File: `src/slack/listeners.js`

Event listeners:

```javascript
import { app } from './bot.js';
import { handleMessage, handleVoiceMessage, handleThreadReply } from './handlers.js';

// Listen for messages in channels
app.message(async ({ message, say, client }) => {
  // Ignore bot messages
  if (message.subtype === 'bot_message') return;
  
  // Ignore messages in threads (handled separately)
  if (message.thread_ts && message.thread_ts !== message.ts) return;
  
  await handleMessage(message, say, client);
});

// Listen for file uploads (voice messages)
app.event('file_shared', async ({ event, client }) => {
  await handleVoiceMessage(event, client);
});

// Listen for replies in threads
app.event('message', async ({ event, client }) => {
  // Only process thread replies
  if (event.thread_ts && event.thread_ts !== event.ts) {
    await handleThreadReply(event, client);
  }
});

console.log('👂 Slack listeners registered');
```

### File: `src/slack/handlers.js`

Message handlers - THIS IS THE CORE LOGIC:

```javascript
import { classifyMessage } from '../ai/classifier.js';
import { analyzeIssue } from '../ai/analyzer.js';
import { formatFollowupQuestions } from '../ai/followup.js';
import { createIssue, updateIssueAnalysis, recordFollowup } from '../database/queries.js';
import { transcribeAudio } from '../services/transcription.js';

export async function handleMessage(message, say, client) {
  try {
    console.log('📨 New message received:', {
      user: message.user,
      channel: message.channel,
      text: message.text?.substring(0, 50)
    });

    // Get user info
    const userInfo = await client.users.info({ user: message.user });
    const userName = userInfo.user.real_name || userInfo.user.name;

    // Get channel info
    const channelInfo = await client.conversations.info({ channel: message.channel });
    const channelName = channelInfo.channel.name;

    // Step 1: Classify the message
    const classification = await classifyMessage(message.text, {
      channel_name: channelName,
      user_name: userName
    });

    console.log('🤖 Classification result:', classification);

    // If confidence is too low, ignore
    if (!classification.is_issue || classification.confidence < 60) {
      console.log('⏭️  Skipping - not an issue');
      return;
    }

    // Step 2: Add reaction to show we received it
    await client.reactions.add({
      channel: message.channel,
      timestamp: message.ts,
      name: 'eyes' // 👀
    });

    // Step 3: Store in database
    const issue = await createIssue({
      message_id: message.ts,
      channel_id: message.channel,
      thread_ts: message.ts,
      user_id: message.user,
      user_name: userName,
      text: message.text,
      is_voice: false
    });

    console.log('💾 Issue stored:', issue.id);

    // Step 4: Analyze the issue
    const analysis = await analyzeIssue(message.text);
    
    console.log('🔍 Analysis result:', {
      title: analysis.title,
      severity: analysis.severity,
      is_complete: analysis.is_complete
    });

    // Step 5: Update database with analysis
    await updateIssueAnalysis(issue.id, analysis);

    // Step 6: If incomplete, ask follow-up questions
    if (!analysis.is_complete && analysis.suggested_followup_questions?.length > 0) {
      const followupText = formatFollowupQuestions(analysis.suggested_followup_questions);
      
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text: followupText
      });

      console.log('❓ Follow-up questions sent');
    } else {
      // Complete - ready for approval
      await client.reactions.add({
        channel: message.channel,
        timestamp: message.ts,
        name: 'white_check_mark' // ✅
      });

      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text: `✅ Issue captured! I've sent this to the team for review. You'll be notified when it's tracked.`
      });

      console.log('✅ Issue ready for approval');
    }

  } catch (error) {
    console.error('❌ Error handling message:', error);
    
    // Notify user of error
    await client.chat.postMessage({
      channel: message.channel,
      thread_ts: message.ts,
      text: `⚠️ Sorry, I encountered an error processing your message. The team has been notified.`
    });
  }
}

export async function handleVoiceMessage(event, client) {
  try {
    console.log('🎤 Voice message received');

    // Get file info
    const fileInfo = await client.files.info({ file: event.file_id });
    
    // Check if it's audio
    if (!fileInfo.file.mimetype.startsWith('audio/')) {
      return;
    }

    // Transcribe audio
    const transcription = await transcribeAudio(fileInfo.file.url_private);
    
    console.log('📝 Transcription:', transcription.substring(0, 100));

    // Store as issue with transcription
    const userInfo = await client.users.info({ user: event.user_id });
    const userName = userInfo.user.real_name || userInfo.user.name;

    const issue = await createIssue({
      message_id: fileInfo.file.id,
      channel_id: event.channel_id,
      thread_ts: fileInfo.file.timestamp,
      user_id: event.user_id,
      user_name: userName,
      text: transcription,
      is_voice: true,
      audio_url: fileInfo.file.url_private
    });

    // Continue with same flow as text message
    const analysis = await analyzeIssue(transcription);
    await updateIssueAnalysis(issue.id, analysis);

    if (!analysis.is_complete && analysis.suggested_followup_questions?.length > 0) {
      const followupText = formatFollowupQuestions(analysis.suggested_followup_questions);
      
      await client.chat.postMessage({
        channel: event.channel_id,
        text: `Thanks for the voice message! ${followupText}`
      });
    }

  } catch (error) {
    console.error('❌ Error handling voice message:', error);
  }
}

export async function handleThreadReply(event, client) {
  // This handles when user replies to bot's follow-up questions
  try {
    // Find the issue associated with this thread
    const { data: issues } = await supabase
      .from('issues')
      .select('*')
      .eq('slack_thread_ts', event.thread_ts)
      .eq('status', 'awaiting_response')
      .single();

    if (!issues) return; // Not a thread we're tracking

    console.log('💬 Thread reply for issue:', issues.id);

    // Record the follow-up
    await recordFollowup(issues.id, 'Follow-up', event.text);

    // Re-analyze with new context
    const fullContext = `${issues.original_text}\n\nAdditional info: ${event.text}`;
    const analysis = await analyzeIssue(fullContext);

    // Update analysis
    await updateIssueAnalysis(issues.id, analysis);

    // If now complete, notify
    if (analysis.is_complete) {
      await client.reactions.add({
        channel: event.channel,
        timestamp: event.thread_ts,
        name: 'white_check_mark'
      });

      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.thread_ts,
        text: `✅ Perfect! I have all the info I need. This has been sent for review.`
      });
    }

  } catch (error) {
    console.error('❌ Error handling thread reply:', error);
  }
}
```

---

## Step 6: Transcription Service

### File: `src/services/transcription.js`

```javascript
import OpenAI from 'openai';
import { config } from '../config/config.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: config.ai.openaiKey
});

export async function transcribeAudio(audioUrl) {
  try {
    // Download audio file
    const response = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Authorization': `Bearer ${config.slack.botToken}`
      }
    });

    // Save temporarily
    const tempFile = path.join('/tmp', `audio-${Date.now()}.mp3`);
    fs.writeFileSync(tempFile, response.data);

    // Transcribe
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFile),
      model: 'whisper-1'
    });

    // Clean up
    fs.unlinkSync(tempFile);

    return transcription.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}
```

---

## Step 7: Jira Integration

### File: `src/jira/client.js`

```javascript
import JiraApi from 'jira-client';
import { config } from '../config/config.js';

export const jira = new JiraApi({
  protocol: 'https',
  host: config.jira.host,
  username: config.jira.email,
  password: config.jira.apiToken,
  apiVersion: '2',
  strictSSL: true
});

// Test connection
async function testConnection() {
  try {
    await jira.getCurrentUser();
    console.log('✅ Jira connected');
  } catch (error) {
    console.error('❌ Jira connection failed:', error.message);
  }
}

testConnection();
```

### File: `src/jira/tickets.js`

```javascript
import { jira } from './client.js';
import { config } from '../config/config.js';
import { updateIssueStatus } from '../database/queries.js';

export async function createJiraTicket(issue) {
  const description = `
*Reported by:* ${issue.user_name}
*Reported on:* ${new Date(issue.created_at).toLocaleString()}
*Severity:* ${issue.severity}
*Category:* ${issue.category}
*Affected Area:* ${issue.affected_area}
*Confidence Score:* ${issue.confidence_score}%

h2. Issue Description
${issue.description}

h2. Original Message
{quote}
${issue.original_text}
{quote}

${issue.is_voice ? `h2. Audio Message\nThis was reported via voice message. Transcription above.` : ''}

h2. Slack Thread
[View original conversation|https://slack.com/app_redirect?channel=${issue.slack_channel_id}&message_ts=${issue.slack_thread_ts}]
  `.trim();

  const newIssue = {
    fields: {
      project: { key: config.jira.projectKey },
      summary: issue.title,
      description: description,
      issuetype: { name: issue.category === 'bug' ? 'Bug' : 'Task' },
      priority: { name: mapSeverityToPriority(issue.severity) },
      labels: [
        issue.category,
        issue.affected_area,
        'auto-created',
        'slack-bot'
      ]
    }
  };

  try {
    const createdIssue = await jira.addNewIssue(newIssue);
    
    // Update database
    await updateIssueStatus(issue.id, 'jira_created', {
      jira_key: createdIssue.key,
      jira_url: `https://${config.jira.host}/browse/${createdIssue.key}`,
      jira_created_at: new Date().toISOString()
    });

    console.log('✅ Jira ticket created:', createdIssue.key);

    return {
      key: createdIssue.key,
      url: `https://${config.jira.host}/browse/${createdIssue.key}`
    };
  } catch (error) {
    console.error('❌ Jira ticket creation failed:', error);
    throw error;
  }
}

function mapSeverityToPriority(severity) {
  const map = {
    'critical': 'Highest',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  return map[severity] || 'Medium';
}
```

### File: `src/jira/webhooks.js`

```javascript
import express from 'express';
import { updateIssueStatus } from '../database/queries.js';
import { app as slackApp } from '../slack/bot.js';

export const router = express.Router();

// Jira webhook endpoint
router.post('/jira-webhook', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('📬 Jira webhook received:', event.webhookEvent);

    // Handle issue updates
    if (event.webhookEvent === 'jira:issue_updated') {
      const issue = event.issue;
      const jiraKey = issue.key;
      const newStatus = issue.fields.status.name;

      console.log(`🔄 ${jiraKey} status changed to: ${newStatus}`);

      // Find issue in database
      const { data: dbIssue } = await supabase
        .from('issues')
        .select('*')
        .eq('jira_key', jiraKey)
        .single();

      if (!dbIssue) {
        console.log('⚠️  Issue not found in database');
        return res.sendStatus(200);
      }

      // Update database
      await updateIssueStatus(dbIssue.id, 'jira_created', {
        jira_status: newStatus,
        ...(newStatus === 'Done' && { jira_completed_at: new Date().toISOString() })
      });

      // If moved to Done, notify in Slack
      if (newStatus === 'Done') {
        await slackApp.client.chat.postMessage({
          channel: dbIssue.slack_channel_id,
          thread_ts: dbIssue.slack_thread_ts,
          text: `✅ Great news! Your issue has been resolved.\n\n*${dbIssue.title}*\nJira ticket: <https://${config.jira.host}/browse/${jiraKey}|${jiraKey}>`
        });

        console.log('✅ Completion notification sent to Slack');
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});
```

---

## Step 8: Notifications Service

### File: `src/services/notifications.js`

```javascript
import { app } from '../slack/bot.js';
import { config } from '../config/config.js';

export async function notifyIssueCreated(issue, jiraTicket) {
  try {
    // DM the reporter
    await app.client.chat.postMessage({
      channel: issue.user_id,
      text: `✅ Your issue has been tracked!\n\n*${issue.title}*\n\nJira ticket: <${jiraTicket.url}|${jiraTicket.key}>\n\nYou'll be notified when it's resolved.`
    });

    // Post in thread
    await app.client.chat.postMessage({
      channel: issue.slack_channel_id,
      thread_ts: issue.slack_thread_ts,
      text: `✅ Issue tracked: <${jiraTicket.url}|${jiraTicket.key}>`
    });

    console.log('📨 Notifications sent');
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
}

export async function notifyIssueCompleted(issue) {
  try {
    await app.client.chat.postMessage({
      channel: issue.slack_channel_id,
      thread_ts: issue.slack_thread_ts,
      text: `✅ This issue has been resolved! <https://${config.jira.host}/browse/${issue.jira_key}|${issue.jira_key}>`
    });
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
}
```

---

## Step 9: Main Entry Point

### File: `src/index.js`

```javascript
import express from 'express';
import { app as slackApp } from './slack/bot.js';
import './slack/listeners.js';
import { router as jiraRouter } from './jira/webhooks.js';
import { config } from './config/config.js';

const expressApp = express();
expressApp.use(express.json());

// Health check
expressApp.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Jira webhooks
expressApp.use(jiraRouter);

// Start Slack bot
(async () => {
  await slackApp.start();
  console.log('⚡️ Slack bot is running!');
})();

// Start Express server
expressApp.listen(config.server.port, () => {
  console.log(`🚀 Server running on port ${config.server.port}`);
});
```

---

## Step 10: Environment Variables Template

### File: `.env.example`

```bash
# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_CHANNELS=bugs,product-issues

# AI
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Jira
JIRA_HOST=yourcompany.atlassian.net
JIRA_EMAIL=you@company.com
JIRA_API_TOKEN=your-jira-token
JIRA_PROJECT_KEY=PROD

# Server
PORT=3000
```

---

## Testing Checklist

After implementation, test:

1. [ ] Bot responds to @mentions
2. [ ] Bot classifies messages correctly
3. [ ] Bot asks follow-up questions when needed
4. [ ] Issues stored in database
5. [ ] Voice messages transcribed
6. [ ] Jira tickets created
7. [ ] Notifications sent
8. [ ] Webhook receives Jira updates
9. [ ] Completion notifications work

---

## Success Criteria

The bot should:
- Capture 100% of issues from Slack
- Classify with >80% accuracy
- Ask relevant follow-up questions
- Create properly formatted Jira tickets
- Notify users at each step
- Handle errors gracefully
- Log all operations

---

## Common Issues & Solutions

### Issue: Bot not receiving messages
- Check bot is invited to channels
- Verify event subscriptions are enabled
- Check bot token has correct scopes

### Issue: AI responses are slow
- Increase timeout settings
- Consider caching common classifications
- Use batch processing for multiple messages

### Issue: Database connection fails
- Verify Supabase URL and key
- Check network connectivity
- Ensure tables are created

### Issue: Jira tickets not creating
- Verify API token is valid
- Check project key is correct
- Ensure user has permission to create tickets
