import OpenAI from 'openai';
import { config } from '../config/config.js';

const openai = new OpenAI({ apiKey: config.ai.openaiKey });

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

Severity: critical=system down, high=major feature broken, medium=workarounds exist, low=minor.

Mark is_complete FALSE and populate suggested_followup_questions if ANY of these are missing:
- What exactly went wrong (specific error, behavior, or symptom)?
- What were they trying to do when it happened?
- What is the impact (who is affected, how many users)?
- Steps to reproduce the issue.
- Any error messages or screenshots mentioned?

Mark is_complete TRUE only if ALL of the above are clearly answered in the message.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = completion.choices[0]?.message?.content?.trim() ?? '';
    const cleaned = responseText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}
