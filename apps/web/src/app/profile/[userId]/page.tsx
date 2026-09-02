'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ProfileSummaryDto, ReportReason } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { api, ApiError } from '@/lib/api-client';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'FAKE_PROFILE', label: 'Fake profile' },
  { value: 'INAPPROPRIATE_MESSAGES', label: 'Inappropriate messages' },
  { value: 'INAPPROPRIATE_PHOTOS', label: 'Inappropriate photos' },
  { value: 'HARASSMENT', label: 'Harassment' },
  { value: 'SCAM_OR_SOLICITATION', label: 'Scam or solicitation' },
  { value: 'UNDERAGE', label: 'Appears underage' },
  { value: 'OTHER', label: 'Other' },
];

export default function ProfilePage() {
  return (
    <AuthGate>
      <ProfileContent />
    </AuthGate>
  );
}

function ProfileContent() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileSummaryDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>('OTHER');
  const [reportDetails, setReportDetails] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProfileSummaryDto>(`/profiles/${userId}`)
      .then(setProfile)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this profile.'));
  }, [userId]);

  async function submitReport() {
    try {
      await api.post('/reports', { reportedUserId: userId, reason: reportReason, details: reportDetails || undefined });
      setShowReport(false);
      setStatusMessage('Thanks — our team will review this.');
    } catch {
      setStatusMessage('Could not submit your report. Please try again.');
    }
  }

  async function blockUser() {
    if (!confirm('Block this person? They will no longer be able to match or message you.')) return;
    try {
      await api.post('/blocks', { userId });
      setStatusMessage('Blocked.');
      router.back();
    } catch {
      setStatusMessage('Could not block this user. Please try again.');
    }
  }

  if (error) {
    return <p className="p-6 text-sm text-red-600">{error}</p>;
  }
  if (!profile) {
    return <p className="p-6 text-sm text-gray-500">Loading…</p>;
  }

  return (
    <main className="flex-1 pb-8">
      <button onClick={() => router.back()} className="p-4 text-sm text-brand-600">
        ← Back
      </button>

      <div className="space-y-2 px-4">
        {profile.photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {profile.photos.map((url, i) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl bg-brand-50">
                <Image src={url} alt={`${profile.displayName} photo ${i + 1}`} fill sizes="240px" className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-xl bg-brand-50 text-5xl">🙂</div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h1 className="text-xl font-bold">
            {profile.displayName}, {profile.age}
          </h1>
          <p className="text-gray-500">
            {profile.city}
            {profile.verificationStatus === 'VERIFIED' && (
              <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                ✓ Verified
              </span>
            )}
          </p>
        </div>

        {profile.bio && <p className="text-gray-700">{profile.bio}</p>}

        {profile.aboutAnswers.map((a) => (
          <div key={a.key}>
            <p className="text-xs font-semibold uppercase text-gray-400">{a.label}</p>
            <p className="text-gray-700">{a.value}</p>
          </div>
        ))}

        {statusMessage && <p className="text-sm text-brand-600">{statusMessage}</p>}

        <div className="flex gap-3 pt-4">
          <button onClick={() => setShowReport(true)} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600">
            Report
          </button>
          <button onClick={blockUser} className="flex-1 rounded-lg border border-red-300 py-2 text-sm text-red-600">
            Block
          </button>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-20 flex items-end bg-black/40" onClick={() => setShowReport(false)}>
          <div className="w-full rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 font-semibold">Report {profile.displayName}</h2>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value as ReportReason)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Any details that would help us review this (optional)"
              maxLength={1000}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2"
              rows={3}
            />
            <button onClick={submitReport} className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white">
              Submit report
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
