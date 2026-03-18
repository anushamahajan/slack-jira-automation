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
    .in('status', ['pending_approval', 'awaiting_response'])
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

export async function getIssueByThreadTs(threadTs) {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('slack_thread_ts', threadTs)
    .eq('status', 'awaiting_response')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCompletedIssues() {
  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .in('status', ['jira_created', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function recordFollowup(issueId, question, answer) {
  console.log('🔍 Recording follow-up:', { issueId, question, answer });
  const { data, error } = await supabase
    .from('followup_messages')
    .insert({ issue_id: issueId, question, answer })
    .select()
    .single();
  console.log('🔍 Follow-up data:', data);
  if (error) {
    console.error('❌ Error recording follow-up:', error);
    throw error;
  }
  console.log('✅ Follow-up recorded:', data);
  return data;
}
