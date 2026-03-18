export function formatFollowupQuestions(questions) {
  const numbered = (Array.isArray(questions) ? questions : []).map((q, i) => `${i + 1}. ${q}`).join('\n');
  return `Thanks for reporting this issue! 🙏

To help us fix this faster, could you provide a bit more info?

${numbered}

Please reply in this thread with the answers.`;
}
