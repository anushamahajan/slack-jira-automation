# Approval Dashboard Architecture

## User Flow

```
1. Open dashboard (localhost:3001)
    ↓
2. Enter password
    ↓
3. See list of pending issues
    ↓
4. Click on issue to review
    ↓
5. See:
   - Original Slack message
   - AI analysis
   - Jira ticket preview
    ↓
6. Choose action:
   - ✅ Approve → Creates Jira ticket
   - ✏️ Edit → Modify before creating
   - ❌ Reject → Mark as not valid issue
    ↓
7. Confirmation message
    ↓
8. Issue removed from list
```

## API Endpoints Needed

The dashboard calls these endpoints on the Slack Bot backend:

### GET /api/issues/pending
Returns all issues with status = 'pending_approval'

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Dashboard slow loading reports",
    "description": "...",
    "original_text": "...",
    "user_name": "John Doe",
    "severity": "high",
    "category": "bug",
    "confidence_score": 85,
    "created_at": "2024-01-31T10:00:00Z"
  }
]
```

### POST /api/issues/:id/approve
Approves issue and creates Jira ticket

**Request:**
```json
{
  "modifications": {
    "title": "Updated title if edited",
    "description": "Updated description if edited"
  }
}
```

**Response:**
```json
{
  "success": true,
  "jira_key": "PROD-123",
  "jira_url": "https://..."
}
```

### POST /api/issues/:id/reject
Rejects issue (won't create Jira ticket)

**Request:**
```json
{
  "reason": "Not a real issue / duplicate / etc"
}
```

### POST /api/issues/:id/edit
Updates issue before approval

**Request:**
```json
{
  "title": "New title",
  "description": "New description",
  "severity": "medium"
}
```

## Components Breakdown

### Login.jsx
- Simple password input
- Validates against env variable
- Stores auth in localStorage
- Redirects to dashboard

### IssueList.jsx
- Fetches pending issues
- Auto-refreshes every 30 seconds
- Shows count of pending issues
- Groups by severity

### IssueCard.jsx
- Displays single issue
- Shows severity badge
- Original message in quote
- AI analysis
- Jira preview
- Action buttons

### ApprovalModal.jsx
- Confirmation dialog
- Shows what will be created
- Final chance to edit
- Submits to API

## Styling Guidelines
- Use Tailwind utility classes
- Purple/blue gradient theme (match Slack bot)
- Cards with shadows
- Smooth transitions
- Responsive design
