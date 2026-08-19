'use client';

import { useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { Heart, DollarSign, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const TIP_PRESETS = [
  { label: '$1', cents: 100 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
  { label: '$20', cents: 2000 },
];

interface TipButtonProps {
  payeeId: string;
  creatorName: string;
}

export function TipButton({ payeeId, creatorName }: TipButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCents, setSelectedCents] = useState(500);
  const [step, setStep] = useState<'select' | 'processing' | 'done' | 'error'>('select');

  if (!user) return null;

  const handleTip = async () => {
    setStep('processing');
    try {
      const res = await fetchApi<{ clientSecret: string }>('/payments/intent', {
        method: 'POST',
        body: JSON.stringify({ payeeId, amountCents: selectedCents }),
      });
      // In production we'd use Stripe.js to confirm the payment intent here
      // For now, we treat the response as success (test mode)
      if (res.clientSecret) {
        setStep('done');
      } else {
        setStep('error');
      }
    } catch {
      setStep('error');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setStep('select'), 300);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold text-sm hover:from-yellow-500 hover:to-orange-500 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
      >
        <DollarSign className="w-4 h-4" />
        Super Thanks
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-800">
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'select' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Send Super Thanks</h2>
                  <p className="text-gray-500 text-sm mt-1">Support <span className="font-semibold text-gray-700 dark:text-gray-300">{creatorName}</span></p>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-6">
                  {TIP_PRESETS.map((preset) => (
                    <button
                      key={preset.cents}
                      onClick={() => setSelectedCents(preset.cents)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        selectedCents === preset.cents
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-400 text-white shadow-md scale-105'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handleTip}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl"
                >
                  Send ${(selectedCents / 100).toFixed(2)}
                </Button>
              </>
            )}

            {step === 'processing' && (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Processing payment…</p>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thank you! 🎉</h3>
                <p className="text-gray-500 text-sm mt-2">Your Super Thanks was sent to {creatorName}.</p>
                <Button onClick={handleClose} variant="secondary" className="mt-6 w-full">Close</Button>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Payment Failed</h3>
                <p className="text-gray-500 text-sm mt-2">Please try again or use a different payment method.</p>
                <Button onClick={() => setStep('select')} variant="secondary" className="mt-6 w-full">Try Again</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
