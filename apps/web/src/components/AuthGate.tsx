'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

/** Wrap any page that requires a signed-in (and, by default, onboarded) user. */
export function AuthGate({
  children,
  requireOnboarding = true,
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}) {
  const { me, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!me) {
      router.replace('/signup');
      return;
    }
    if (requireOnboarding && !me.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [loading, me, requireOnboarding, router]);

  if (loading || !me || (requireOnboarding && !me.onboardingComplete)) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">Loading…</div>
    );
  }

  return <>{children}</>;
}
