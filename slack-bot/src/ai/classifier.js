import OpenAI from 'openai';
import { config } from '../config/config.js';

const openai = new OpenAI({ apiKey: config.ai.openaiKey });

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = completion.choices[0]?.message?.content?.trim() ?? '';
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      is_issue: result.is_issue,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Classification error:', error);
    return {
      is_issue: true,
      confidence: 50,
      reasoning: 'Error in classification, defaulting to manual review'
    };
  }
}
