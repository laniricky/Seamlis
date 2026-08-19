'use client';

import { useState } from 'react';
import { Flag, X, Loader2 } from 'lucide-react';
import { fetchApi } from '@/lib/api';

const REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Hateful or abusive content',
  'Graphic violence',
  'Sexually explicit material',
  'Child abuse',
  'Promotes terrorism',
  'Infringes my rights',
];

interface ReportModalProps {
  targetType: 'VIDEO' | 'COMMENT' | 'USER';
  targetId: string;
  onClose: () => void;
}

export function ReportModal({ targetType, targetId, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchApi('/reports', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
        }),
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2 text-content-primary">
            <Flag className="w-5 h-5" />
            <h2 className="font-bold">Report Content</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-full text-content-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl text-content-primary mb-2">Report Submitted</h3>
              <p className="text-content-secondary">Thank you for helping keep our community safe.</p>
            </div>
          ) : (
            <>
              <p className="text-content-secondary mb-4 text-sm">
                What is the issue with this {targetType.toLowerCase()}?
              </p>
              
              <div className="space-y-2 mb-6">
                {REASONS.map((reason) => (
                  <label key={reason} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover cursor-pointer border border-transparent hover:border-border transition-colors">
                    <input
                      type="radio"
                      name="report-reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-4 h-4 text-brand-primary bg-surface-background border-border focus:ring-brand-primary"
                    />
                    <span className="text-content-primary text-sm">{reason}</span>
                  </label>
                ))}
              </div>

              {error && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-medium text-content-secondary hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 rounded-lg font-medium bg-brand-primary text-white hover:bg-brand-secondary transition-colors flex items-center justify-center min-w-[100px]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
