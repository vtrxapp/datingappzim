'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGate } from '@/components/AuthGate';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  reporter: { profile: { displayName: string } | null };
  reportedUser: { profile: { displayName: string } | null };
}
interface VerificationRow {
  id: string;
  displayName: string;
  verificationDocumentUrl: string | null;
}

export default function AdminPage() {
  return (
    <AuthGate>
      <AdminGate>
        <AdminContent />
      </AdminGate>
    </AuthGate>
  );
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (me && me.role !== 'ADMIN') router.replace('/settings');
  }, [me, router]);

  if (!me || me.role !== 'ADMIN') return null;
  return <>{children}</>;
}

function AdminContent() {
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [verifications, setVerifications] = useState<VerificationRow[] | null>(null);

  function load() {
    api.get<ReportRow[]>('/admin/reports?status=PENDING').then(setReports);
    api.get<VerificationRow[]>('/admin/verifications').then(setVerifications);
  }

  useEffect(load, []);

  async function resolveReport(id: string, status: 'REVIEWED' | 'ACTIONED' | 'DISMISSED') {
    await api.post(`/admin/reports/${id}/resolve`, { status });
    load();
  }

  async function reviewVerification(id: string, approve: boolean) {
    await api.post(`/admin/verifications/${id}/review`, { approve });
    load();
  }

  return (
    <main className="flex-1 space-y-6 p-4">
      <h1 className="text-lg font-bold text-brand-700">Admin</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Pending reports</h2>
        {reports?.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
        <div className="space-y-2">
          {reports?.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 p-3 text-sm">
              <p>
                <strong>{r.reporter.profile?.displayName ?? 'Someone'}</strong> reported{' '}
                <strong>{r.reportedUser.profile?.displayName ?? 'a user'}</strong> for {r.reason}
              </p>
              {r.details && <p className="mt-1 text-gray-500">"{r.details}"</p>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="rounded border px-2 py-1 text-xs">
                  Dismiss
                </button>
                <button onClick={() => resolveReport(r.id, 'REVIEWED')} className="rounded border px-2 py-1 text-xs">
                  Mark reviewed
                </button>
                <button onClick={() => resolveReport(r.id, 'ACTIONED')} className="rounded bg-red-600 px-2 py-1 text-xs text-white">
                  Deactivate account
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Verification queue</h2>
        {verifications?.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
        <div className="space-y-2">
          {verifications?.map((v) => (
            <div key={v.id} className="rounded-lg border border-gray-200 p-3 text-sm">
              <p className="mb-1 font-semibold">{v.displayName}</p>
              {v.verificationDocumentUrl && (
                <a href={v.verificationDocumentUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                  View document
                </a>
              )}
              <div className="mt-2 flex gap-2">
                <button onClick={() => reviewVerification(v.id, false)} className="rounded border px-2 py-1 text-xs">
                  Reject
                </button>
                <button onClick={() => reviewVerification(v.id, true)} className="rounded bg-brand-500 px-2 py-1 text-xs text-white">
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
