'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Logo } from '@/components/Logo';

export default function HomePage() {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!me) return;
    router.replace(me.onboardingComplete ? '/matches' : '/onboarding');
  }, [loading, me, router]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">Loading…</div>;
  }

  if (me) {
    return null;
  }

  return (
    <main className="flex flex-1 flex-col justify-between p-6">
      <div className="mt-16 space-y-4 text-center">
        <Logo variant="stacked" size={64} />
        <p className="text-gray-600">
          Curated introductions for Zimbabweans ready to settle down. No swiping, no games. Just a few
          thoughtful matches a day and safety built in from the start.
        </p>
      </div>
      <div className="space-y-3 pb-8">
        <a
          href="/signup"
          className="block rounded-xl bg-brand-500 py-3 text-center font-semibold text-white active:bg-brand-600"
        >
          Get started
        </a>
        <p className="text-center text-xs text-gray-400">
          By continuing you agree this app is for marriage-minded adults 18+.
        </p>
      </div>
    </main>
  );
}
