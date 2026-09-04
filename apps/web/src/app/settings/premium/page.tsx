'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLAN_CONFIG, SubscriptionPlanId } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { api, ApiError } from '@/lib/api-client';

const POLL_INTERVAL_MS = 2000;
const premium = PLAN_CONFIG[SubscriptionPlanId.PREMIUM];
const free = PLAN_CONFIG[SubscriptionPlanId.FREE];
const PREMIUM_FEATURES = [
  `${premium.dailyIntroductions} daily introductions, instead of ${free.dailyIntroductions}`,
  `See everyone who's interested in you. Free only shows your most recent ${free.maxVisibleAdmirers}`,
  'Add a personal note when you say Interested, so they see it before they respond',
];

interface InitiateResult {
  paymentTransactionId: string;
  instructions?: string;
}

export default function PremiumUpgradePage() {
  return (
    <AuthGate>
      <PremiumUpgradeContent />
    </AuthGate>
  );
}

function PremiumUpgradeContent() {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'pending' | 'paid' | 'error'>('idle');
  const [instructions, setInstructions] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  async function startUpgrade() {
    setState('pending');
    setError(null);
    try {
      const result = await api.post<InitiateResult>('/subscriptions/premium/initiate');
      setInstructions(result.instructions ?? null);

      pollRef.current = setInterval(async () => {
        const status = await api.get<{ status: string }>(`/subscriptions/payments/${result.paymentTransactionId}/status`);
        if (status.status === 'PAID') {
          if (pollRef.current) clearInterval(pollRef.current);
          setState('paid');
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      setState('error');
      setError(err instanceof ApiError ? err.message : 'Could not start the upgrade.');
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-6 p-6 text-center">
      <div>
        <div className="text-4xl">⭐</div>
        <h1 className="mt-2 text-xl font-bold text-brand-700">Go Premium</h1>
        <p className="mt-1 text-gray-600">${premium.priceUsd.toFixed(2)}/month</p>
        <ul className="mt-4 space-y-2 text-left">
          {PREMIUM_FEATURES.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm text-gray-600">
              <span className="text-green-600">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {state === 'idle' && (
        <button onClick={startUpgrade} className="rounded-xl bg-brand-500 py-3 font-semibold text-white">
          Pay with EcoCash
        </button>
      )}

      {state === 'pending' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{instructions ?? 'Approve the EcoCash prompt on your phone…'}</p>
          <p className="text-xs text-gray-400">Waiting for payment confirmation…</p>
        </div>
      )}

      {state === 'paid' && (
        <div className="space-y-3">
          <p className="font-semibold text-green-700">You're Premium! 🎉</p>
          <button onClick={() => router.replace('/settings')} className="rounded-xl bg-brand-500 py-3 font-semibold text-white">
            Back to settings
          </button>
        </div>
      )}

      {state === 'error' && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
