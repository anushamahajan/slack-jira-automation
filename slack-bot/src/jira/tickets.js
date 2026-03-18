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

${issue.is_voice ? 'h2. Audio Message\nThis was reported via voice message. Transcription above.' : ''}

h2. Slack Thread
[View original conversation|https://slack.com/app_redirect?channel=${issue.slack_channel_id}&message_ts=${issue.slack_thread_ts}]
  `.trim();

  const newIssue = {
    fields: {
      project: { key: config.jira.projectKey },
      summary: issue.title,
      description,
      issuetype: { name: 'Story' }
    }
  };

  const createdIssue = await jira.addNewIssue(newIssue);

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
}
