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
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2">{issue.title}</h3>
          <p className="text-sm text-gray-500">
            Reported by {issue.user_name} • {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
          </p>
        </div>
        <span
          className={`${severityColors[issue.severity] || 'bg-gray-500'} text-white px-3 py-1 rounded-full text-sm font-semibold uppercase`}
        >
          {issue.severity}
        </span>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
        <p className="text-sm text-gray-600 font-semibold mb-1">Original Message:</p>
        <p className="text-gray-800 italic">&quot;{issue.original_text}&quot;</p>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 font-semibold mb-2">AI Analysis:</p>
        <p className="text-gray-700">{issue.description}</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{issue.category}</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{issue.affected_area}</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
            Confidence: {issue.confidence_score}%
          </span>
        </div>
      </div>

      <button
        type="button"
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

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={() => onApprove(issue.id)}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ✅ Approve & Create Jira
        </button>
        <button
          type="button"
          onClick={() => onEdit(issue)}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          onClick={() => onReject(issue.id)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition"
        >
          ❌ Reject
        </button>
      </div>
    </div>
  );
}
