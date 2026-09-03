'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MatchCandidateDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { api } from '@/lib/api-client';

interface AdmirersResponse {
  count: number;
  profiles: MatchCandidateDto[];
  upgradeRequired: boolean;
}

export default function AdmirersPage() {
  return (
    <AuthGate>
      <AdmirersContent />
      <BottomNav />
    </AuthGate>
  );
}

function AdmirersContent() {
  const [data, setData] = useState<AdmirersResponse | null>(null);

  useEffect(() => {
    api.get<AdmirersResponse>('/matching/admirers').then(setData);
  }, []);

  return (
    <main className="flex-1 p-4">
      <h1 className="mb-4 text-lg font-bold text-brand-700">Who likes you</h1>

      {!data && <p className="text-sm text-gray-500">Loading…</p>}

      {data && data.count === 0 && <p className="text-sm text-gray-500">No one yet — check back soon!</p>}

      <div className="space-y-3">
        {data?.profiles.map((match) => (
          <Link
            key={match.matchId}
            href={`/profile/${match.profile.userId}`}
            className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3"
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-brand-50">
              {match.profile.photos[0] && (
                <Image src={match.profile.photos[0]} alt={match.profile.displayName} fill className="object-cover" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {match.profile.displayName}, {match.profile.age}
              </p>
              <p className="text-sm text-gray-500">{match.profile.city}</p>
              {match.theirNote && <p className="mt-0.5 text-sm italic text-brand-600">"{match.theirNote}"</p>}
            </div>
          </Link>
        ))}
      </div>

      {data && data.upgradeRequired && (
        <div className="mt-4 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-center">
          <p className="mb-2 font-semibold text-brand-700">
            {data.count - data.profiles.length} more {data.count - data.profiles.length === 1 ? 'person is' : 'people are'} interested in you
          </p>
          <p className="mb-3 text-sm text-gray-600">Upgrade to Premium to see everyone.</p>
          <Link href="/settings/premium" className="inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Upgrade to Premium
          </Link>
        </div>
      )}
    </main>
  );
}
