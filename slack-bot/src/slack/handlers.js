import { classifyMessage } from '../ai/classifier.js';
import { analyzeIssue } from '../ai/analyzer.js';
import { formatFollowupQuestions } from '../ai/followup.js';
import {
  createIssue,
  updateIssueAnalysis,
  recordFollowup,
  getIssueByThreadTs
} from '../database/queries.js';

export async function handleMessage(message, say, client) {
  try {
    if (!message.text?.trim()) return;

    await client.reactions.add({ channel: message.channel, timestamp: message.ts, name: 'eyes' });

    console.log('📨 New message:', { user: message.user, channel: message.channel, text: message.text?.substring(0, 50) });

    let userName = 'Unknown';
    let channelName = 'unknown';
    try {
      const userInfo = await client.users.info({ user: message.user });
      userName = userInfo.user?.real_name || userInfo.user?.name || 'Unknown';
    } catch (_) {}
    try {
      const channelInfo = await client.conversations.info({ channel: message.channel });
      channelName = channelInfo.channel?.name || 'unknown';
    } catch (_) {}

    const classification = await classifyMessage(message.text, { channel_name: channelName, user_name: userName });
    console.log('🤖 Classification:', classification);

    if (!classification.is_issue || classification.confidence < 60) {
      console.log('⏭️ Skipping - not an issue');
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text: `🤔 I'm not sure this is an issue I can track. If you're reporting a bug or feature request, could you provide more details like:\n• What were you trying to do?\n• What happened vs what you expected?\n• Any error messages or screenshots?`
      });
      return;
    }

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

    const analysis = await analyzeIssue(message.text);
    console.log('🔍 Analysis:', { title: analysis.title, severity: analysis.severity, is_complete: analysis.is_complete });

    await updateIssueAnalysis(issue.id, analysis);

    if (!analysis.is_complete && analysis.suggested_followup_questions?.length > 0) {
      const followupText = formatFollowupQuestions(analysis.suggested_followup_questions);
      await client.chat.postMessage({ channel: message.channel, thread_ts: message.ts, text: followupText });
      console.log('❓ Follow-up questions sent');
    } else {
      await client.reactions.add({ channel: message.channel, timestamp: message.ts, name: 'white_check_mark' });
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.ts,
        text: `✅ Issue captured! I've sent this to the team for review. You'll be notified when it's tracked.`
      });
      console.log('✅ Issue ready for approval');
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    try {
      await client.chat.postMessage({
        channel: message.channel,
        thread_ts: message.thread_ts || message.ts,
        text: `⚠️ Sorry, I encountered an error processing your message. The team has been notified.`
      });
    } catch (_) {}
  }
}

export async function handleVoiceMessage(event, client) {
  console.log('🎤 Voice message received – transcription not configured (skip or add OpenAI Whisper later).');
}

export async function handleThreadReply(event, client) {
  try {
    if (!event.thread_ts || event.thread_ts === event.ts) return;
    const issueRow = await getIssueByThreadTs(event.thread_ts);
    if (!issueRow) return;

    console.log('💬 Thread reply for issue:', issueRow.id);
    await recordFollowup(issueRow.id, 'Follow-up', event.text);

    const fullContext = `${issueRow.original_text}\n\nAdditional info: ${event.text}`;
    console.log('🔍 Full context:', fullContext);
    const analysis = await analyzeIssue(fullContext);
    console.log('🔍 Analysis:', analysis);
    await updateIssueAnalysis(issueRow.id, analysis);
    console.log('✅ Analysis updated:', analysis);

    if (analysis.is_complete) {
      await client.reactions.add({ channel: event.channel, timestamp: event.thread_ts, name: 'white_check_mark' });
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.thread_ts,
        text: `✅ Perfect! I have all the info I need. This has been sent for review.`
      });
    } else if (analysis.suggested_followup_questions?.length > 0) {
      // Still incomplete - ask more questions
      const followupText = formatFollowupQuestions(analysis.suggested_followup_questions);
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.thread_ts,
        text: followupText
      });
      console.log('❓ More follow-up questions sent');
    } else {
      // No more questions but still incomplete - mark as ready anyway
      await client.reactions.add({ channel: event.channel, timestamp: event.thread_ts, name: 'white_check_mark' });
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.thread_ts,
        text: `✅ Thanks for the info! This has been sent for review.`
      });
    }
  } catch (error) {
    console.error('❌ Error handling thread reply:', error);
  }
}
