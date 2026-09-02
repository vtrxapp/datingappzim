'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthTokensIssuedDto } from 'shared';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function VerifyForm() {
  const params = useSearchParams();
  const phone = params.get('phone') ?? '';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post<AuthTokensIssuedDto>('/auth/otp/verify', { phone, code });
      await refresh();
      router.replace(result.onboardingComplete ? '/matches' : '/onboarding');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify that code.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    try {
      await api.post('/auth/otp/request', { phone });
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) clearInterval(interval);
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.');
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-brand-700">Enter the code</h1>
        <p className="text-sm text-gray-500">We sent a code to {phone || 'your phone'}.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="123456"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl tracking-[0.5em] focus:border-brand-400 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || code.length < 4}
          className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white active:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'Verifying…' : 'Verify'}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="w-full text-sm text-brand-600 underline disabled:text-gray-400 disabled:no-underline"
        >
          {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
        </button>
      </form>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
