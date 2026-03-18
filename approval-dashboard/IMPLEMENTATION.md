# Approval Dashboard Implementation

## For Claude Code: Build Instructions

Build a modern React dashboard for approving issues.

---

## Step 1: Project Setup

```bash
npm create vite@latest approval-dashboard -- --template react
cd approval-dashboard
npm install
npm install axios date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure Tailwind in `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Step 2: API Client

### File: `src/api/client.js`

```javascript
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function getPendingIssues() {
  const response = await api.get('/api/issues/pending');
  return response.data;
}

export async function approveIssue(issueId, modifications = {}) {
  const response = await api.post(`/api/issues/${issueId}/approve`, {
    modifications
  });
  return response.data;
}

export async function rejectIssue(issueId, reason) {
  const response = await api.post(`/api/issues/${issueId}/reject`, {
    reason
  });
  return response.data;
}

export async function editIssue(issueId, updates) {
  const response = await api.put(`/api/issues/${issueId}/edit`, updates);
  return response.data;
}
```

---

## Step 3: Components

### File: `src/components/Login.jsx`

```jsx
import { useState } from 'react';

export default function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_DASHBOARD_PASSWORD || 'admin123';
    
    if (password === correctPassword) {
      localStorage.setItem('dashboard_auth', 'true');
      onLogin();
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Issue Dashboard
        </h1>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              placeholder="Enter password"
              autoFocus
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

### File: `src/components/IssueCard.jsx`

```jsx
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const severityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

export default function IssueCard({ issue, onApprove, onReject, onEdit }) {
  const [showJiraPreview, setShowJiraPreview] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {issue.title}
          </h3>
          <p className="text-sm text-gray-500">
            Reported by {issue.user_name} • {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
          </p>
        </div>
        
        <span className={`${severityColors[issue.severity]} text-white px-3 py-1 rounded-full text-sm font-semibold uppercase`}>
          {issue.severity}
        </span>
      </div>

      {/* Original Message */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
        <p className="text-sm text-gray-600 font-semibold mb-1">Original Message:</p>
        <p className="text-gray-800 italic">"{issue.original_text}"</p>
      </div>

      {/* AI Analysis */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 font-semibold mb-2">AI Analysis:</p>
        <p className="text-gray-700">{issue.description}</p>
        
        <div className="mt-3 flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
            {issue.category}
          </span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
            {issue.affected_area}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
            Confidence: {issue.confidence_score}%
          </span>
        </div>
      </div>

      {/* Jira Preview Toggle */}
      <button
        onClick={() => setShowJiraPreview(!showJiraPreview)}
        className="text-purple-600 text-sm font-semibold mb-3 hover:underline"
      >
        {showJiraPreview ? '▼ Hide' : '▶'} Jira Ticket Preview
      </button>

      {showJiraPreview && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-semibold mb-2">Ticket that will be created:</p>
          <p className="text-gray-700 whitespace-pre-line">
            {`Title: ${issue.title}
            
Description:
${issue.description}

Original Report: "${issue.original_text}"

Severity: ${issue.severity}
Category: ${issue.category}
Affected Area: ${issue.affected_area}`}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => onApprove(issue.id)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ✅ Approve & Create Jira
        </button>
        
        <button
          onClick={() => onEdit(issue)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ✏️ Edit
        </button>
        
        <button
          onClick={() => onReject(issue.id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}
```

### File: `src/components/IssueList.jsx`

```jsx
import { useState, useEffect } from 'react';
import { getPendingIssues, approveIssue, rejectIssue } from '../api/client';
import IssueCard from './IssueCard';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await getPendingIssues();
      setIssues(data);
      setError(null);
    } catch (err) {
      setError('Failed to load issues');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadIssues, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (issueId) => {
    if (!confirm('Create Jira ticket for this issue?')) return;
    
    try {
      const result = await approveIssue(issueId);
      alert(`✅ Jira ticket created: ${result.jira_key}`);
      loadIssues();
    } catch (err) {
      alert('❌ Failed to create ticket');
      console.error(err);
    }
  };

  const handleReject = async (issueId) => {
    const reason = prompt('Why are you rejecting this issue?');
    if (!reason) return;
    
    try {
      await rejectIssue(issueId, reason);
      alert('✅ Issue rejected');
      loadIssues();
    } catch (err) {
      alert('❌ Failed to reject');
      console.error(err);
    }
  };

  const handleEdit = (issue) => {
    // TODO: Open edit modal
    alert('Edit functionality coming soon!');
  };

  if (loading && issues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">All caught up!</h2>
        <p className="text-gray-500">No pending issues to review</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Pending Issues ({issues.length})
        </h2>
        <button
          onClick={loadIssues}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold transition"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="space-y-6">
        {issues.map(issue => (
          <IssueCard
            key={issue.id}
            issue={issue}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </div>
  );
}
```

### File: `src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import IssueList from './components/IssueList';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('dashboard_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('dashboard_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Issue Intelligence Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <IssueList />
      </main>
    </div>
  );
}
```

---

## Step 4: Backend API Endpoints

Add these to your Slack Bot (`src/index.js`):

```javascript
// Approval dashboard endpoints
expressApp.get('/api/issues/pending', async (req, res) => {
  try {
    const issues = await getPendingApprovalIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

expressApp.post('/api/issues/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { modifications } = req.body;

    // Get issue
    const issue = await getIssueById(id);
    
    // Apply modifications if any
    if (modifications) {
      await updateIssueAnalysis(id, {
        ...issue,
        ...modifications
      });
    }

    // Create Jira ticket
    const jiraTicket = await createJiraTicket(issue);

    // Notify in Slack
    await notifyIssueCreated(issue, jiraTicket);

    res.json({
      success: true,
      jira_key: jiraTicket.key,
      jira_url: jiraTicket.url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

expressApp.post('/api/issues/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await updateIssueStatus(id, 'rejected', { rejection_reason: reason });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Step 5: Run Dashboard

```bash
npm run dev
```

Access at: `http://localhost:5173`

Default password: `admin123` (change in .env)
