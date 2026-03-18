import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export async function getPendingIssues() {
  const { data } = await api.get('/api/issues/pending');
  return data;
}

export async function getCompletedIssues() {
  const { data } = await api.get('/api/issues/completed');
  return data;
}

export async function approveIssue(issueId, modifications = {}) {
  const { data } = await api.post(`/api/issues/${issueId}/approve`, { modifications });
  return data;
}

export async function rejectIssue(issueId, reason) {
  const { data } = await api.post(`/api/issues/${issueId}/reject`, { reason });
  return data;
}

export async function editIssue(issueId, updates) {
  const { data } = await api.put(`/api/issues/${issueId}/edit`, updates);
  return data;
}
