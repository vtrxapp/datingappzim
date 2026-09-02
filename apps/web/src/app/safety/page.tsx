'use client';

import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { api, ApiError } from '@/lib/api-client';

interface CheckinRow {
  id: string;
  safetyContactName: string;
  safetyContactPhone: string;
  meetingTime: string;
  checkinTime: string;
  status: 'SCHEDULED' | 'CONFIRMED_SAFE' | 'MISSED' | 'CANCELLED';
}

const STATUS_LABEL: Record<CheckinRow['status'], string> = {
  SCHEDULED: 'Scheduled',
  CONFIRMED_SAFE: "Confirmed you're safe",
  MISSED: 'Missed — contact was alerted',
  CANCELLED: 'Cancelled',
};

export default function SafetyPage() {
  return (
    <AuthGate>
      <SafetyContent />
      <BottomNav />
    </AuthGate>
  );
}

function toLocalInputValue(offsetMinutesFromNow: number): string {
  const d = new Date(Date.now() + offsetMinutesFromNow * 60_000);
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function SafetyContent() {
  const [checkins, setCheckins] = useState<CheckinRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('+263');
  const [meetingTime, setMeetingTime] = useState(toLocalInputValue(60));
  const [checkinTime, setCheckinTime] = useState(toLocalInputValue(180));
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.get<CheckinRow[]>('/safety/checkins').then(setCheckins);
  }

  useEffect(load, []);

  async function createCheckin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post('/safety/checkins', {
        safetyContactName: contactName,
        safetyContactPhone: contactPhone,
        meetingTime: new Date(meetingTime).toISOString(),
        checkinTime: new Date(checkinTime).toISOString(),
      });
      setShowForm(false);
      setContactName('');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not schedule that check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmSafe(id: string) {
    await api.post(`/safety/checkins/${id}/confirm`);
    load();
  }

  async function cancelCheckin(id: string) {
    await api.post(`/safety/checkins/${id}/cancel`);
    load();
  }

  return (
    <main className="flex-1 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-brand-700">Safety check-ins</h1>
        <button onClick={() => setShowForm((v) => !v)} className="text-sm font-semibold text-brand-600 underline">
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        Meeting someone in person? Pick a trusted contact (no app account needed) who'll get a text and a
        follow-up if you don't check in on time.
      </p>

      {showForm && (
        <form onSubmit={createCheckin} className="mb-6 space-y-3 rounded-xl border border-brand-100 bg-white p-4">
          <input
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Safety contact's name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <input
            required
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+263771234567"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <label className="block text-xs font-semibold text-gray-500">
            Meeting time
            <input
              required
              type="datetime-local"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block text-xs font-semibold text-gray-500">
            Check in by
            <input
              required
              type="datetime-local"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-500 py-2 font-semibold text-white disabled:opacity-50"
          >
            Schedule check-in
          </button>
        </form>
      )}

      <div className="space-y-2">
        {checkins?.map((c) => (
          <div key={c.id} className="rounded-xl border border-brand-100 bg-white p-3">
            <p className="font-semibold">{c.safetyContactName}</p>
            <p className="text-sm text-gray-500">
              Meeting {new Date(c.meetingTime).toLocaleString()} · Check in by{' '}
              {new Date(c.checkinTime).toLocaleString()}
            </p>
            <p className="text-sm font-semibold text-brand-600">{STATUS_LABEL[c.status]}</p>
            {c.status === 'SCHEDULED' && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => confirmSafe(c.id)}
                  className="flex-1 rounded-lg bg-brand-500 py-1.5 text-sm font-semibold text-white"
                >
                  I'm safe
                </button>
                <button
                  onClick={() => cancelCheckin(c.id)}
                  className="flex-1 rounded-lg border border-gray-300 py-1.5 text-sm text-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
