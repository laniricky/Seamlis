'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Flag, CheckCircle, Trash2, UserX, Loader2, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Report {
  id: string;
  reporterId: string;
  targetType: 'VIDEO' | 'COMMENT' | 'USER';
  targetId: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export default function ModerationQueue() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const data = await fetchApi('/admin/reports');
      setReports(data as Report[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'DISMISS' | 'DELETE_CONTENT' | 'BAN_USER') => {
    setProcessingId(reportId);
    try {
      await fetchApi(`/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      // Remove from list
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (e) {
      console.error('Failed to resolve report', e);
      alert('Failed to resolve report. Ensure you have ADMIN role.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Review Queue</h1>
          <p className="text-content-secondary mt-1">Review and take action on user-reported content.</p>
        </div>
        <div className="bg-surface-card px-4 py-2 rounded-xl border border-border flex items-center gap-2">
          <Flag className="w-4 h-4 text-brand-primary" />
          <span className="font-bold text-content-primary">{reports.length}</span>
          <span className="text-content-secondary text-sm">Pending</span>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-card rounded-2xl border border-border border-dashed">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-content-primary mb-2">Queue is Empty</h2>
          <p className="text-content-secondary text-center max-w-sm">
            All caught up! There are no pending reports requiring moderation at this time.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-background border-b border-border text-sm font-medium text-content-secondary">
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Reported</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border hover:bg-surface-hover/50 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-surface-background border border-border rounded text-xs font-bold text-content-primary">
                        {report.targetType}
                      </span>
                      {report.targetType === 'VIDEO' && (
                        <Link href={`/watch/${report.targetId}`} target="_blank" className="text-brand-primary hover:underline flex items-center gap-1 text-sm font-medium">
                          <Play className="w-3 h-3" /> View Video
                        </Link>
                      )}
                      {report.targetType === 'USER' && (
                        <span className="text-content-secondary text-sm font-mono truncate max-w-[120px]" title={report.targetId}>
                          {report.targetId}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-content-primary font-medium">{report.reason}</td>
                  <td className="p-4 text-content-secondary text-sm">
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      {processingId === report.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-content-secondary" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleResolve(report.id, 'DISMISS')}
                            className="px-3 py-1.5 rounded bg-surface-background border border-border text-content-secondary hover:text-content-primary hover:border-content-secondary transition-colors text-sm font-medium"
                            title="Dismiss Report (No action taken)"
                          >
                            Dismiss
                          </button>
                          {(report.targetType === 'VIDEO' || report.targetType === 'COMMENT') && (
                            <button
                              onClick={() => handleResolve(report.id, 'DELETE_CONTENT')}
                              className="px-3 py-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors text-sm font-medium flex items-center gap-1.5"
                              title="Delete this content"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                          <button
                            onClick={() => handleResolve(report.id, 'BAN_USER')}
                            className="px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-1.5"
                            title="Ban the user who created this content"
                          >
                            <UserX className="w-3.5 h-3.5" /> Ban User
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
