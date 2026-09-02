'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MatchCandidateDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { api } from '@/lib/api-client';

export default function ChatListPage() {
  return (
    <AuthGate>
      <ChatListContent />
      <BottomNav />
    </AuthGate>
  );
}

function ChatListContent() {
  const [matches, setMatches] = useState<MatchCandidateDto[] | null>(null);

  useEffect(() => {
    api.get<MatchCandidateDto[]>('/matching/mutual').then(setMatches);
  }, []);

  return (
    <main className="flex-1 p-4">
      <h1 className="mb-4 text-lg font-bold text-brand-700">Chats</h1>

      {matches === null && <p className="text-sm text-gray-500">Loading…</p>}
      {matches?.length === 0 && (
        <p className="text-sm text-gray-500">
          No chats yet. Once you and someone are both interested, you'll be able to message here.
        </p>
      )}

      <div className="space-y-2">
        {matches?.map((match) => (
          <Link
            key={match.matchId}
            href={`/chat/${match.matchId}`}
            className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-50">
              {match.profile.photos[0] && (
                <Image src={match.profile.photos[0]} alt={match.profile.displayName} fill className="object-cover" />
              )}
            </div>
            <p className="font-semibold">{match.profile.displayName}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
