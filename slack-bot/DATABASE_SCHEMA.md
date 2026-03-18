# Database Schema

Copy-paste this SQL into Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Issues
CREATE TABLE issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Slack metadata
  slack_message_id TEXT NOT NULL,
  slack_channel_id TEXT NOT NULL,
  slack_thread_ts TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  
  -- Original content
  original_text TEXT NOT NULL,
  is_voice BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  
  -- AI classification
  is_issue BOOLEAN,
  classification_confidence INTEGER,
  classification_reasoning TEXT,
  
  -- AI analysis
  title TEXT,
  description TEXT,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  category TEXT CHECK (category IN ('bug', 'feature_request', 'ux_issue', 'candidate_funnel', 'question', 'other')),
  affected_area TEXT CHECK (affected_area IN ('sales', 'ops', 'tech', 'product', 'other')),
  is_complete BOOLEAN DEFAULT FALSE,
  missing_info JSONB,
  confidence_score INTEGER,
  
  -- Status tracking
  status TEXT DEFAULT 'captured' CHECK (status IN ('captured', 'awaiting_response', 'pending_approval', 'approved', 'rejected', 'jira_created')),
  
  -- Jira integration
  jira_key TEXT UNIQUE,
  jira_url TEXT,
  jira_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  jira_created_at TIMESTAMP,
  jira_completed_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT unique_slack_message UNIQUE(slack_message_id, slack_channel_id)
);

-- Table 2: Follow-up Messages
CREATE TABLE followup_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  slack_message_id TEXT,
  question TEXT,
  answer TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: Weekly Reports
CREATE TABLE weekly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  completed_count INTEGER DEFAULT 0,
  in_progress_count INTEGER DEFAULT 0,
  blocked_count INTEGER DEFAULT 0,
  report_text TEXT,
  slack_message_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_week UNIQUE(week_start, week_end)
);

-- Table 4: Analytics (aggregated data)
CREATE TABLE issue_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  total_issues INTEGER DEFAULT 0,
  by_severity JSONB,
  by_category JSONB,
  by_team JSONB,
  avg_resolution_hours NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_jira_key ON issues(jira_key);
CREATE INDEX idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX idx_issues_user_id ON issues(user_id);
CREATE INDEX idx_issues_channel ON issues(slack_channel_id);
CREATE INDEX idx_followup_issue_id ON followup_messages(issue_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
CREATE TRIGGER update_issues_updated_at 
  BEFORE UPDATE ON issues 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Allow service role all access" ON issues
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all access" ON followup_messages
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all access" ON weekly_reports
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role all access" ON issue_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Verify Installation

Run this query to check tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

You should see:
- issues
- followup_messages
- weekly_reports
- issue_analytics
