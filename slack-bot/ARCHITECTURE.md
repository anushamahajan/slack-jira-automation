# Slack Bot Architecture

## System Flow

### Phase 1: Message Capture
```
User sends message in Slack
    ↓
Bot receives event via Slack Events API
    ↓
Store raw message in database (status: 'captured')
    ↓
Add 👀 reaction to show message received
```

### Phase 2: Intelligence Layer

#### Step 1: Classification
```
AI Classifier analyzes message:
- Is this an issue report? (confidence score)
- Or general conversation?

If confidence < 60%:
    → Ignore, mark as 'not_issue'
If confidence >= 60%:
    → Proceed to analysis
```

#### Step 2: Analysis
```
AI Analyzer extracts:
- title: string
- description: string
- severity: 'critical' | 'high' | 'medium' | 'low'
- category: 'bug' | 'feature_request' | 'ux_issue' | 'candidate_funnel' | 'question'
- affected_area: 'sales' | 'ops' | 'tech' | 'product' | 'other'
- is_complete: boolean
- missing_info: string[]
- confidence_score: 0-100
```

#### Step 3: Context Completion
```
If is_complete === false:
    ↓
Generate follow-up questions
    ↓
Post in Slack thread asking for clarification
    ↓
Update status to 'awaiting_response'
    ↓
Wait for user reply
    ↓
Re-analyze with new context
    ↓
Update confidence_score

If is_complete === true:
    ↓
Proceed to approval
```

### Phase 3: Approval Layer
```
Generate action points from analysis
    ↓
Create Jira ticket preview
    ↓
Send to approval dashboard (Application 2)
    ↓
Update status to 'pending_approval'
    ↓
Wait for human approval
```

### Phase 4: Execution Layer
```
When approved:
    ↓
Create Jira ticket via API
    ↓
Store jira_key in database
    ↓
Send notifications:
    - DM to original reporter
    - Post in original Slack thread
    - Notify assigned team
    ↓
Update status to 'jira_created'
```

### Phase 5: Monitoring Layer
```
Jira webhook receives status updates
    ↓
When ticket moves to "Done":
    ↓
Update database (jira_status = 'done', completed_at = now)
    ↓
Post in original Slack thread:
    "✅ Your issue [PROD-123] has been resolved!"
    ↓
Add to weekly report queue
```

## AI Prompts

### Classification Prompt Template
```
You are a product issue classifier. Analyze this Slack message and determine if it's reporting a product issue.

Message: "{message_text}"
Channel: {channel_name}
User: {user_name}

Return JSON:
{
  "is_issue": boolean,
  "confidence": 0-100,
  "reasoning": "Why you think this is/isn't an issue"
}

Examples of ISSUES:
- "The dashboard is loading slowly"
- "Export button not working"
- "Users can't login"
- "This workflow is confusing"

Examples of NOT ISSUES:
- "Good morning team"
- "When is the meeting?"
- "Thanks for the update"
```

### Analysis Prompt Template
```
You are a product issue analyzer. Extract structured information from this issue report.

Original Message: "{message_text}"
Additional Context: "{followup_context}"
Classification Confidence: {confidence}

Extract:
1. Title (short, actionable)
2. Description (detailed)
3. Severity (critical/high/medium/low)
4. Category (bug/feature_request/ux_issue/candidate_funnel/question)
5. Affected Area (sales/ops/tech/product/other)
6. Missing Information (what else do we need to know?)

Return JSON:
{
  "title": "string",
  "description": "string",
  "severity": "string",
  "category": "string",
  "affected_area": "string",
  "is_complete": boolean,
  "missing_info": ["string"],
  "suggested_followup_questions": ["string"],
  "confidence_score": 0-100
}
```

### Follow-up Question Generator Prompt
```
Generate 2-3 clarifying questions to gather missing information about this issue.

Issue: "{title}"
What we know: "{description}"
Missing: {missing_info}

Questions should be:
- Specific and actionable
- Easy to answer
- Help us fix the issue faster

Return JSON:
{
  "questions": ["string"]
}
```

## Error Handling

### Slack API Errors
- Rate limiting: Implement exponential backoff
- Token expiration: Refresh and retry
- Network errors: Queue messages and retry

### AI API Errors
- Rate limiting: Queue requests
- Invalid responses: Log and use fallback
- Timeout: Retry with longer timeout

### Database Errors
- Connection lost: Reconnect automatically
- Query failed: Log and alert admin
- Transaction failed: Rollback and retry

## Logging Strategy
Log everything to help debug:
- All incoming Slack events
- All AI requests and responses
- All database operations
- All Jira API calls
- All errors with full stack traces

Use structured logging:
```javascript
logger.info('Message captured', {
  message_id: event.ts,
  user: event.user,
  channel: event.channel,
  classification: result.is_issue
});
```
