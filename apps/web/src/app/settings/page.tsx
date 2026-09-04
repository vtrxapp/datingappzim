'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { SubscriptionStateDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { HobbiesInput } from '@/components/HobbiesInput';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface ProfilePhoto {
  id: string;
  url: string;
  position: number;
}
interface MyProfile {
  displayName: string;
  bio: string | null;
  photos: ProfilePhoto[];
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}
interface BlockRow {
  blockedId: string;
}
interface QuestionnaireResponseRow {
  questionKey: string;
  answerValue: unknown;
}

export default function SettingsPage() {
  return (
    <AuthGate>
      <SettingsContent />
      <BottomNav />
    </AuthGate>
  );
}

function SettingsContent() {
  const { me, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStateDto | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  function load() {
    api.get<MyProfile>('/profiles/me').then((p) => {
      setProfile(p);
      setDisplayName(p.displayName);
      setBio(p.bio ?? '');
    });
    api.get<QuestionnaireResponseRow[]>('/questionnaire/me').then((rows) => {
      const hobbiesRow = rows.find((r) => r.questionKey === 'HOBBIES');
      setHobbies(Array.isArray(hobbiesRow?.answerValue) ? (hobbiesRow.answerValue as string[]) : []);
    });
    api.get<SubscriptionStateDto>('/subscriptions/me').then(setSubscription);
    api.get<BlockRow[]>('/blocks').then(setBlocks);
  }

  useEffect(load, []);

  async function saveDisplayName() {
    try {
      await api.post('/profiles/me/display-name', { displayName });
      setMessage('Name saved.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your name.');
    }
  }

  async function saveBio() {
    try {
      await api.post('/profiles/me/bio', { bio });
      setMessage('Bio saved.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your bio.');
    }
  }

  async function saveHobbies() {
    try {
      await api.post('/questionnaire/hobbies', { hobbies });
      setMessage('Hobbies saved.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your hobbies.');
    }
  }

  async function uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      await api.postForm('/profiles/me/photos', formData);
      load();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not upload that photo.');
    }
  }

  async function removePhoto(photoId: string) {
    await api.delete(`/profiles/me/photos/${photoId}`);
    load();
  }

  async function uploadVerification(file: File) {
    const formData = new FormData();
    formData.append('document', file);
    try {
      await api.postForm('/profiles/me/verification', formData);
      setMessage('Submitted for review. We usually get to these within a day or two.');
      load();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not submit your document.');
    }
  }

  async function unblock(userId: string) {
    await api.delete('/blocks', { userId });
    load();
  }

  async function deactivate() {
    if (!confirm('Deactivate your account? Your profile will be hidden. You can come back any time with the same phone number.')) return;
    await api.post('/users/me/deactivate');
    await logout();
    router.replace('/');
  }

  if (!profile) {
    return <main className="flex-1 p-4 text-sm text-gray-500">Loading…</main>;
  }

  return (
    <main className="flex-1 space-y-6 p-4">
      <h1 className="text-lg font-bold text-brand-700">Settings</h1>

      {message && <p className="text-sm text-brand-600">{message}</p>}

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Photos ({profile.photos.length}/6)</h2>
        <div className="grid grid-cols-3 gap-2">
          {profile.photos
            .sort((a, b) => a.position - b.position)
            .map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
                <Image src={p.url} alt="" fill className="object-cover" />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
          {profile.photos.length < 6 && (
            <button
              onClick={() => photoInputRef.current?.click()}
              className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-2xl text-gray-400"
            >
              +
            </button>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadPhoto(file);
            e.target.value = '';
          }}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Name</h2>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          placeholder="Your name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left"
        />
        <button
          onClick={saveDisplayName}
          className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Save name
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Bio</h2>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Tell people a bit about yourself…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
        <button onClick={saveBio} className="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Save bio
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Hobbies</h2>
        <p className="mb-2 text-sm text-gray-500">You'll need at least one to respond to matches.</p>
        <HobbiesInput value={hobbies} onChange={setHobbies} />
        <button onClick={saveHobbies} className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Save hobbies
        </button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Verification</h2>
        {profile.verificationStatus === 'VERIFIED' ? (
          <p className="flex items-center gap-1.5 text-sm text-green-700">
            <Icon name="check" size={15} />
            Your profile is verified.
          </p>
        ) : profile.verificationStatus === 'PENDING' ? (
          <p className="text-sm text-gray-500">Your ID is under review.</p>
        ) : (
          <>
            <p className="mb-2 text-sm text-gray-500">
              Upload a photo ID to get a Verified badge. It helps others trust your profile.
            </p>
            <button
              onClick={() => idInputRef.current?.click()}
              className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-600"
            >
              Upload ID
            </button>
            <input
              ref={idInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadVerification(file);
                e.target.value = '';
              }}
            />
          </>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Subscription</h2>
        <div className="rounded-xl border border-brand-100 bg-white p-3">
          <p className="font-semibold">{subscription?.plan === 'PREMIUM' ? 'Premium' : 'Free'} plan</p>
          <p className="text-sm text-gray-500">{subscription?.dailyIntroductionsRemaining ?? 0} introductions left today</p>
          {subscription?.plan !== 'PREMIUM' && (
            <Link href="/settings/premium" className="mt-2 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
              Upgrade to Premium
            </Link>
          )}
        </div>
      </section>

      {blocks.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-400">Blocked</h2>
          <div className="space-y-1">
            {blocks.map((b) => (
              <div key={b.blockedId} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
                <span className="text-gray-500">User {b.blockedId.slice(0, 8)}…</span>
                <button onClick={() => unblock(b.blockedId)} className="text-brand-600 underline">
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-2 pt-4">
        <button
          onClick={() => logout().then(() => router.replace('/'))}
          className="w-full rounded-lg border border-gray-300 py-2 text-sm text-gray-600"
        >
          Log out
        </button>
        <button onClick={deactivate} className="w-full rounded-lg border border-red-300 py-2 text-sm text-red-600">
          Deactivate account
        </button>
        {me?.role === 'ADMIN' && (
          <Link href="/admin" className="block w-full rounded-lg border border-gray-300 py-2 text-center text-sm text-gray-600">
            Admin panel
          </Link>
        )}
      </section>
    </main>
  );
}
