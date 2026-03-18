# Testing Guide

## Manual Testing Checklist

### Test 1: Basic Message Capture
1. Send message in Slack: "The dashboard is very slow"
2. **Expected:**
   - Bot adds 👀 reaction
   - Bot asks follow-up questions
   - Issue appears in database

### Test 2: Complete Issue
1. Send: "[BUG] Login button not working. Click login, nothing happens. Chrome browser."
2. **Expected:**
   - Bot adds ✅ reaction
   - No follow-up questions (already complete)
   - Status = 'pending_approval'

### Test 3: Voice Message
1. Record voice note: "Hey, the export feature is broken"
2. Upload to Slack
3. **Expected:**
   - Bot transcribes
   - Asks follow-up questions
   - Stores with is_voice = true

### Test 4: Thread Replies
1. Bot asks questions
2. Reply with answers
3. **Expected:**
   - Bot re-analyzes
   - Updates confidence score
   - Eventually marks complete

### Test 5: Not an Issue
1. Send: "Good morning everyone!"
2. **Expected:**
   - No reaction
   - Not stored in database
   - Bot ignores it

## Database Verification

Check issues table:
```sql
SELECT 
  id,
  title,
  status,
  severity,
  confidence_score,
  created_at
FROM issues
ORDER BY created_at DESC
LIMIT 10;
```

## API Testing

### Test Anthropic API
```bash
curl -X POST "https://api.anthropic.com/v1/messages" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Test"}]}'
```

### Test Jira API
```bash
curl -X GET "https://YOUR_DOMAIN.atlassian.net/rest/api/2/myself" \
  -u "YOUR_EMAIL:YOUR_API_TOKEN"
```

## Troubleshooting

### Bot not responding
- Check bot is online in Slack
- Verify event subscriptions are enabled
- Check server logs for errors

### AI errors
- Verify API keys are correct
- Check API rate limits
- Look for malformed JSON responses

### Database errors
- Verify connection string
- Check table permissions
- Ensure RLS policies are set
