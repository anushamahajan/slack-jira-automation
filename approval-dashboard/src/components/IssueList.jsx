import { useState, useEffect } from 'react';
import { getPendingIssues, getCompletedIssues, approveIssue, rejectIssue } from '../api/client';
import IssueTable from './IssueTable';
import IssueModal from './IssueModal';

export default function IssueList() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingIssues, setPendingIssues] = useState([]);
  const [completedIssues, setCompletedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  const loadPendingIssues = async () => {
    try {
      const data = await getPendingIssues();
      setPendingIssues(data);
    } catch (err) {
      console.error('Failed to load pending issues:', err);
      throw err;
    }
  };

  const loadCompletedIssues = async () => {
    try {
      const data = await getCompletedIssues();
      setCompletedIssues(data);
    } catch (err) {
      console.error('Failed to load completed issues:', err);
      throw err;
    }
  };

  const loadAllIssues = async () => {
    try {
      setLoading(true);
      await Promise.all([loadPendingIssues(), loadCompletedIssues()]);
      setError(null);
    } catch (err) {
      setError('Failed to load issues. Is the Slack bot server running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllIssues();
    const interval = setInterval(loadAllIssues, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (issueId) => {
    if (!confirm('Create Jira ticket for this issue?')) return;
    try {
      const result = await approveIssue(issueId);
      alert(`Jira ticket created: ${result.jira_key}`);
      setSelectedIssue(null);
      loadAllIssues();
    } catch (err) {
      alert('Failed to create ticket: ' + err.message);
    }
  };

  const handleReject = async (issueId) => {
    const reason = prompt('Why are you rejecting this issue?');
    if (reason == null) return;
    try {
      await rejectIssue(issueId, reason);
      alert('Issue rejected');
      setSelectedIssue(null);
      loadAllIssues();
    } catch (err) {
      alert('Failed to reject: ' + err.message);
    }
  };

  if (loading && pendingIssues.length === 0 && completedIssues.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-gray-500 text-sm">Loading issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-red-700 font-medium">{error}</p>
        <button
          onClick={loadAllIssues}
          className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const issues = activeTab === 'pending' ? pendingIssues : completedIssues;

  return (
    <div>
      {/* Tabs & Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'pending'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pending
            {pendingIssues.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                {pendingIssues.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition ${
              activeTab === 'completed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            History
            {completedIssues.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-semibold">
                {completedIssues.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={loadAllIssues}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium text-gray-700 transition disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Table */}
      <IssueTable
        issues={issues}
        onRowClick={setSelectedIssue}
        emptyMessage={
          activeTab === 'pending'
            ? 'No pending issues. All caught up!'
            : 'No completed issues yet.'
        }
      />

      {/* Modal */}
      {selectedIssue && (
        <IssueModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          showActions={activeTab === 'pending'}
        />
      )}
    </div>
  );
}
