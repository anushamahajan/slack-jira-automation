import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500' },
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500' }
};

const statusConfig = {
  pending_approval: { label: 'Pending Approval', bg: 'bg-blue-100', text: 'text-blue-800' },
  awaiting_response: { label: 'Awaiting Response', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  jira_created: { label: 'Jira Created', bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800' }
};

export default function IssueModal({ issue, onClose, onApprove, onReject, showActions = true }) {
  if (!issue) return null;

  const severity = severityConfig[issue.severity] || severityConfig.medium;
  const status = statusConfig[issue.status] || { label: issue.status, bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b-4 ${severity.border} bg-gradient-to-r from-slate-50 to-slate-100`}>
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{issue.title || 'Untitled Issue'}</h2>
              <p className="text-sm text-gray-500">
                Reported by <span className="font-medium">{issue.user_name}</span> {' '}
                {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${severity.bg} ${severity.text}`}>
              {issue.severity}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {issue.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              {issue.affected_area}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[50vh]">
          {/* Original Message */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Original Message</h3>
            <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-400">
              <p className="text-gray-700 italic">"{issue.original_text}"</p>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="mb-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">AI Analysis</h3>
            <p className="text-gray-700">{issue.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              Confidence: <span className="font-semibold">{issue.confidence_score}%</span>
            </div>
          </div>

          {/* Jira Info */}
          {issue.jira_key && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Jira Ticket</h3>
              <a
                href={issue.jira_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" />
                  <path d="M5.024 5.732H16.57a5.218 5.218 0 0 0-5.232-5.215H9.208V.459A5.215 5.215 0 0 0 3.996 5.674v11.489a1.005 1.005 0 0 0 1.005 1.005h11.565a5.218 5.218 0 0 0-5.232-5.215h-2.13V5.732z" opacity=".65" />
                </svg>
                {issue.jira_key}
              </a>
            </div>
          )}

          {/* Missing Info */}
          {issue.missing_info?.length > 0 && (
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Missing Information</h3>
              <ul className="list-disc list-inside text-gray-600 text-sm">
                {issue.missing_info.map((info, idx) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && !issue.jira_key && (
          <div className="px-6 py-4 bg-slate-50 border-t flex gap-3">
            <button
              onClick={() => onApprove(issue.id)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve & Create Jira
            </button>
            <button
              onClick={() => onReject(issue.id)}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
