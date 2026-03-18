import { formatDistanceToNow } from 'date-fns';

const severityConfig = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  low: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' }
};

const statusConfig = {
  pending_approval: { label: 'Pending', bg: 'bg-blue-100', text: 'text-blue-700' },
  awaiting_response: { label: 'Awaiting', bg: 'bg-amber-100', text: 'text-amber-700' },
  jira_created: { label: 'Created', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700' }
};

export default function IssueTable({ issues, onRowClick, emptyMessage = 'No issues found' }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <div className="text-5xl mb-3 opacity-50">📋</div>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Issue</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Severity</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Status</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Category</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Reporter</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Jira</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-28">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {issues.map((issue) => {
            const severity = severityConfig[issue.severity] || severityConfig.medium;
            const status = statusConfig[issue.status] || { label: issue.status, bg: 'bg-gray-100', text: 'text-gray-700' };

            return (
              <tr
                key={issue.id}
                onClick={() => onRowClick(issue)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900 truncate max-w-xs">
                    {issue.title || 'Untitled'}
                  </div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {issue.original_text?.substring(0, 60)}...
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${severity.bg} ${severity.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${severity.dot}`}></span>
                    {issue.severity}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                    {status.label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">{issue.category}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-600">{issue.user_name}</span>
                </td>
                <td className="px-5 py-4">
                  {issue.jira_key ? (
                    <a
                      href={issue.jira_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      {issue.jira_key}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
