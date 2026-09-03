'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MatchCandidateDto, PLAN_CONFIG, ProfileReadinessDto, SubscriptionStateDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { api, ApiError } from '@/lib/api-client';

export default function MatchesPage() {
  return (
    <AuthGate>
      <MatchesContent />
      <BottomNav />
    </AuthGate>
  );
}

function MatchesContent() {
  const [matches, setMatches] = useState<MatchCandidateDto[] | null>(null);
  const [readiness, setReadiness] = useState<ProfileReadinessDto | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStateDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [noteDraftMatchId, setNoteDraftMatchId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const canSendInterestNote = subscription ? PLAN_CONFIG[subscription.plan].canSendInterestNote : false;

  useEffect(() => {
    api
      .get<MatchCandidateDto[]>('/matching/daily-batch')
      .then(setMatches)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your matches.'));
    api.get<ProfileReadinessDto>('/profiles/me/readiness').then(setReadiness);
    api.get<SubscriptionStateDto>('/subscriptions/me').then(setSubscription);
  }, []);

  async function respond(matchId: string, interested: boolean, note?: string) {
    setActingOn(matchId);
    try {
      const updated = await api.post<MatchCandidateDto>(`/matching/${matchId}/interest`, { interested, note });
      setMatches((prev) => (prev ? prev.map((m) => (m.matchId === matchId ? updated : m)) : prev));
      setNoteDraftMatchId(null);
      setNoteText('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your response. Try again.');
    } finally {
      setActingOn(null);
    }
  }

  function startInterested(matchId: string) {
    if (canSendInterestNote) {
      setNoteDraftMatchId(matchId);
      setNoteText('');
    } else {
      respond(matchId, true);
    }
  }

  return (
    <main className="flex-1 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-brand-700">Today's introductions</h1>
        <Link href="/matches/admirers" className="text-sm text-brand-600 underline">
          Who likes you
        </Link>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {readiness && !readiness.ready && (
        <Link
          href="/settings"
          className="mb-4 block rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm text-brand-700"
        >
          <span className="font-semibold">Complete your profile to respond to matches.</span>{' '}
          Add {!readiness.hasPhoto && !readiness.hasHobbies
            ? 'a photo and a hobby'
            : !readiness.hasPhoto
              ? 'a photo'
              : 'a hobby'}{' '}
          in Settings →
        </Link>
      )}

      {matches === null && <p className="text-sm text-gray-500">Loading…</p>}
      {matches?.length === 0 && (
        <p className="text-sm text-gray-500">
          No new introductions right now — check back tomorrow, or upgrade to Premium for more.
        </p>
      )}

      <div className="space-y-4">
        {matches?.map((match) => (
          <div key={match.matchId} className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
            <Link href={`/profile/${match.profile.userId}`} className="block">
              <div className="relative aspect-[4/3] w-full bg-brand-50">
                {match.profile.photos[0] ? (
                  <Image
                    src={match.profile.photos[0]}
                    alt={match.profile.displayName}
                    fill
                    sizes="480px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl">🙂</div>
                )}
                {match.profile.verificationStatus === 'VERIFIED' && (
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-brand-600">
                    ✓ Verified
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold">
                  {match.profile.displayName}, {match.profile.age}
                </p>
                <p className="text-sm text-gray-500">{match.profile.city}</p>
              </div>
            </Link>

            {match.isMutual ? (
              <div className="border-t border-brand-100 p-3 text-center text-sm font-semibold text-green-700">
                It's a match! Say hello in Chat.
              </div>
            ) : match.myStatus === 'PENDING' && readiness && !readiness.ready ? (
              <Link
                href="/settings"
                className="block border-t border-brand-100 p-3 text-center text-sm font-semibold text-brand-600"
              >
                Complete your profile to respond →
              </Link>
            ) : match.myStatus === 'PENDING' && noteDraftMatchId === match.matchId ? (
              <div className="space-y-2 border-t border-brand-100 p-3">
                <textarea
                  autoFocus
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder={`Add a note for ${match.profile.displayName} (optional)`}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setNoteDraftMatchId(null)}
                    className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => respond(match.matchId, true, noteText)}
                    disabled={actingOn === match.matchId}
                    className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Send Interested
                  </button>
                </div>
              </div>
            ) : match.myStatus === 'PENDING' ? (
              <div className="flex gap-2 border-t border-brand-100 p-3">
                <button
                  onClick={() => respond(match.matchId, false)}
                  disabled={actingOn === match.matchId}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 disabled:opacity-50"
                >
                  Pass
                </button>
                <button
                  onClick={() => startInterested(match.matchId)}
                  disabled={actingOn === match.matchId}
                  className="flex-1 rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Interested
                </button>
              </div>
            ) : (
              <div className="border-t border-brand-100 p-3 text-center text-sm text-gray-500">
                {match.myStatus === 'INTERESTED' ? "You're interested — waiting on them" : 'You passed'}
                {match.myNote && <p className="mt-1 italic text-gray-400">You said: "{match.myNote}"</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
