'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export default function SignupPage() {
  const [phone, setPhone] = useState('+263');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!E164_REGEX.test(phone)) {
      setError('Enter your number in international format, e.g. +263771234567');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/otp/request', { phone });
      router.push(`/signup/verify?phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-6 p-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold text-brand-700">What's your number?</h1>
        <p className="text-sm text-gray-500">We'll text you a one-time code. No passwords, no email needed.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="tel"
          inputMode="tel"
          autoFocus
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}
          placeholder="+263771234567"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg tracking-wide focus:border-brand-400 focus:outline-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white active:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send code'}
        </button>
      </form>
    </main>
  );
}
