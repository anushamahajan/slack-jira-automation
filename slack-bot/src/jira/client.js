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

export async function testJiraConnection() {
  try {
    await jira.getCurrentUser();
    console.log('✅ Jira connected');
  } catch (error) {
    console.error('❌ Jira connection failed:', error.message);
  }
}
