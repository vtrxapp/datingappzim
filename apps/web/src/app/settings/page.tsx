'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { City, CORE_VALUE_OPTIONS, QUESTIONNAIRE, SubscriptionStateDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { HobbiesInput } from '@/components/HobbiesInput';
import { Icon, IconName } from '@/components/Icon';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface ProfilePhoto {
  id: string;
  url: string;
  position: number;
}
interface PendingPhoto {
  file: File;
  previewUrl: string;
}
interface MyProfile {
  displayName: string;
  bio: string | null;
  city: City;
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

const RELATIONSHIP_INTENT_OPTIONS = QUESTIONNAIRE.find((q) => q.key === 'RELATIONSHIP_INTENT')!.options!;
const CITY_OPTIONS = QUESTIONNAIRE.find((q) => q.key === 'CITY')!.options!;

type SectionId = 'photos' | 'name' | 'bio' | 'location' | 'hobbies' | 'intent' | 'coreValues' | 'verification' | 'subscription' | 'blocked';

export default function SettingsPage() {
  return (
    <AuthGate>
      <SettingsContent />
      <BottomNav />
    </AuthGate>
  );
}

/** A collapsed row shows a leading icon, a title, and a summary of the
 * current value (wrapped to two lines rather than cut off after one);
 * tapping it expands to edit, in place, without navigating to a new screen.
 * Only one section is open at a time, so the settings page reads as a
 * short, scannable list instead of a long stack of always-open forms. */
function SettingsSection({
  icon,
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  icon: IconName;
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center gap-3 p-3.5 text-left">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-500">
          <Icon name={icon} size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</span>
          <span className="mt-0.5 block text-sm leading-snug text-gray-600 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
            {summary}
          </span>
        </span>
        <Icon name="chevronRight" size={14} className={`flex-none text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && <div className="space-y-3 border-t border-gray-100 p-4">{children}</div>}
    </section>
  );
}

function SettingsGroupLabel({ children }: { children: ReactNode }) {
  return <p className="px-1 text-xs font-bold uppercase tracking-wide text-gray-400">{children}</p>;
}

function SettingsContent() {
  const { me, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState<City | ''>('');
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [relationshipIntent, setRelationshipIntent] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionStateDto | null>(null);
  const [blocks, setBlocks] = useState<BlockRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [openSection, setOpenSection] = useState<SectionId | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);

  const visiblePhotos = profile?.photos.filter((p) => !removedPhotoIds.includes(p.id)).sort((a, b) => a.position - b.position) ?? [];
  const photoDraftCount = visiblePhotos.length + pendingPhotos.length;

  function toggleSection(id: SectionId) {
    setOpenSection((cur) => (cur === id ? null : id));
  }

  function load() {
    api.get<MyProfile>('/profiles/me').then((p) => {
      setProfile(p);
      setDisplayName(p.displayName);
      setBio(p.bio ?? '');
      setCity(p.city);
    });
    api.get<QuestionnaireResponseRow[]>('/questionnaire/me').then((rows) => {
      const hobbiesRow = rows.find((r) => r.questionKey === 'HOBBIES');
      setHobbies(Array.isArray(hobbiesRow?.answerValue) ? (hobbiesRow.answerValue as string[]) : []);
      const coreValuesRow = rows.find((r) => r.questionKey === 'CORE_VALUES');
      setCoreValues(Array.isArray(coreValuesRow?.answerValue) ? (coreValuesRow.answerValue as string[]) : []);
      const relationshipIntentRow = rows.find((r) => r.questionKey === 'RELATIONSHIP_INTENT');
      setRelationshipIntent(typeof relationshipIntentRow?.answerValue === 'string' ? relationshipIntentRow.answerValue : '');
    });
    api.get<SubscriptionStateDto>('/subscriptions/me').then(setSubscription);
    api.get<BlockRow[]>('/blocks').then(setBlocks);
  }

  useEffect(load, []);

  async function saveDisplayName() {
    try {
      await api.post('/profiles/me/display-name', { displayName });
      setMessage('Name saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your name.');
    }
  }

  async function saveBio() {
    try {
      await api.post('/profiles/me/bio', { bio });
      setMessage('Bio saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your bio.');
    }
  }

  async function saveCity() {
    try {
      await api.post('/profiles/me/city', { city });
      setMessage('Location saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your location.');
    }
  }

  async function saveHobbies() {
    try {
      await api.post('/questionnaire/hobbies', { hobbies });
      setMessage('Hobbies saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your hobbies.');
    }
  }

  async function saveCoreValues() {
    try {
      await api.post('/questionnaire/core-values', { coreValues });
      setMessage('Core values saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save your core values.');
    }
  }

  async function saveRelationshipIntent() {
    try {
      await api.post('/questionnaire/relationship-intent', { relationshipIntent });
      setMessage('Saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save that.');
    }
  }

  function removePendingPhoto(index: number) {
    setPendingPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function savePhotos() {
    setSavingPhotos(true);
    try {
      for (const id of removedPhotoIds) {
        await api.delete(`/profiles/me/photos/${id}`);
      }
      for (const pending of pendingPhotos) {
        const formData = new FormData();
        formData.append('photo', pending.file);
        await api.postForm('/profiles/me/photos', formData);
      }
      setMessage('Photos saved.');
      setOpenSection(null);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Could not save all your photos. Please try again.');
    } finally {
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPendingPhotos([]);
      setRemovedPhotoIds([]);
      setSavingPhotos(false);
      load();
    }
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

  const hobbiesSummary = hobbies.length > 0 ? hobbies.join(', ') : "Add at least one so you can respond to matches";
  const coreValuesSummary =
    coreValues.length > 0
      ? coreValues.map((v) => CORE_VALUE_OPTIONS.find((o) => o.value === v)?.label ?? v).join(', ')
      : 'None selected';
  const intentSummary = RELATIONSHIP_INTENT_OPTIONS.find((o) => o.value === relationshipIntent)?.label ?? 'Not set';
  const citySummary = CITY_OPTIONS.find((o) => o.value === city)?.label ?? 'Not set';
  const verificationSummary =
    profile.verificationStatus === 'VERIFIED' ? 'Verified' : profile.verificationStatus === 'PENDING' ? 'Under review' : 'Not verified';
  const subscriptionSummary = `${subscription?.plan === 'PREMIUM' ? 'Premium' : 'Free'} plan`;

  return (
    <main className="flex-1 space-y-4 p-4">
      <h1 className="text-lg font-bold text-brand-700">Settings</h1>

      {message && <p className="text-sm text-brand-600">{message}</p>}

      {me && (
        <Link
          href={`/profile/${me.userId}`}
          className="flex items-center gap-3 rounded-xl bg-brand-500 p-3.5 text-sm font-semibold text-white"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-white/15">
            <Icon name="eye" size={17} />
          </span>
          <span className="flex-1">Preview my profile</span>
          <Icon name="chevronRight" size={14} />
        </Link>
      )}

      <div className="space-y-2">
        <SettingsGroupLabel>Profile</SettingsGroupLabel>
        <SettingsSection
          icon="camera"
          title="Photos"
          summary={`${photoDraftCount}/6 photos`}
          isOpen={openSection === 'photos'}
          onToggle={() => toggleSection('photos')}
        >
          <div className="grid grid-cols-3 gap-2">
            {visiblePhotos.map((p) => (
              <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
                <Image src={p.url} alt="" fill className="object-cover" />
                <button
                  onClick={() => setRemovedPhotoIds((prev) => [...prev, p.id])}
                  disabled={savingPhotos}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white disabled:opacity-50"
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
            {pendingPhotos.map((p, idx) => (
              <div key={p.previewUrl} className="relative aspect-square overflow-hidden rounded-lg bg-brand-50">
                <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removePendingPhoto(idx)}
                  disabled={savingPhotos}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white disabled:opacity-50"
                >
                  <Icon name="close" size={12} />
                </button>
                <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  New
                </span>
              </div>
            ))}
            {photoDraftCount < 6 && (
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={savingPhotos}
                className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-2xl text-gray-400 disabled:opacity-50"
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
              if (file) setPendingPhotos((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
              e.target.value = '';
            }}
          />
          <button
            onClick={savePhotos}
            disabled={savingPhotos || (pendingPhotos.length === 0 && removedPhotoIds.length === 0)}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingPhotos ? 'Saving…' : 'Save photos'}
          </button>
        </SettingsSection>

        <SettingsSection
          icon="person"
          title="Name"
          summary={displayName || 'Add your name'}
          isOpen={openSection === 'name'}
          onToggle={() => toggleSection('name')}
        >
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            placeholder="Your name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left"
          />
          <button onClick={saveDisplayName} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save name
          </button>
        </SettingsSection>

        <SettingsSection
          icon="pencil"
          title="Bio"
          summary={bio || 'Add a short bio'}
          isOpen={openSection === 'bio'}
          onToggle={() => toggleSection('bio')}
        >
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Tell people a bit about yourself…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />
          <button onClick={saveBio} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save bio
          </button>
        </SettingsSection>

        <SettingsSection
          icon="pin"
          title="Location"
          summary={citySummary}
          isOpen={openSection === 'location'}
          onToggle={() => toggleSection('location')}
        >
          <div className="space-y-2">
            {CITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCity(opt.value as City)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${
                  city === opt.value ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700' : 'border-gray-300 text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={saveCity} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save location
          </button>
        </SettingsSection>

        <SettingsSection
          icon="star"
          title="Hobbies"
          summary={hobbiesSummary}
          isOpen={openSection === 'hobbies'}
          onToggle={() => toggleSection('hobbies')}
        >
          <p className="text-sm text-gray-500">You'll need at least one to respond to matches.</p>
          <HobbiesInput value={hobbies} onChange={setHobbies} />
          <button onClick={saveHobbies} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save hobbies
          </button>
        </SettingsSection>
      </div>

      <div className="space-y-2">
        <SettingsGroupLabel>Preferences</SettingsGroupLabel>
        <SettingsSection
          icon="heart"
          title="What are you looking for?"
          summary={intentSummary}
          isOpen={openSection === 'intent'}
          onToggle={() => toggleSection('intent')}
        >
          <p className="text-sm text-gray-500">This app is focused on marriage-track relationships only.</p>
          <div className="space-y-2">
            {RELATIONSHIP_INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRelationshipIntent(opt.value)}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm ${
                  relationshipIntent === opt.value
                    ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={saveRelationshipIntent} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </SettingsSection>

        <SettingsSection
          icon="sparkle"
          title="Core values"
          summary={coreValuesSummary}
          isOpen={openSection === 'coreValues'}
          onToggle={() => toggleSection('coreValues')}
        >
          <p className="text-sm text-gray-500">Pick up to 3 things that matter most to you.</p>
          <div className="flex flex-wrap gap-2">
            {CORE_VALUE_OPTIONS.map((opt) => {
              const selected = coreValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (selected) setCoreValues(coreValues.filter((v) => v !== opt.value));
                    else if (coreValues.length < 3) setCoreValues([...coreValues, opt.value]);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">{coreValues.length}/3 selected</p>
          <button onClick={saveCoreValues} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
            Save core values
          </button>
        </SettingsSection>
      </div>

      <div className="space-y-2">
        <SettingsGroupLabel>Account</SettingsGroupLabel>
        <SettingsSection
          icon="shield"
          title="Verification"
          summary={verificationSummary}
          isOpen={openSection === 'verification'}
          onToggle={() => toggleSection('verification')}
        >
          {profile.verificationStatus === 'VERIFIED' ? (
            <p className="flex items-center gap-1.5 text-sm text-green-700">
              <Icon name="check" size={15} />
              Your profile is verified.
            </p>
          ) : profile.verificationStatus === 'PENDING' ? (
            <p className="text-sm text-gray-500">Your ID is under review.</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Upload a photo ID to get a Verified badge. It helps others trust your profile.</p>
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
        </SettingsSection>

        <SettingsSection
          icon="crown"
          title="Subscription"
          summary={subscriptionSummary}
          isOpen={openSection === 'subscription'}
          onToggle={() => toggleSection('subscription')}
        >
          <div className="rounded-xl border border-brand-100 bg-white p-3">
            <p className="font-semibold">{subscription?.plan === 'PREMIUM' ? 'Premium' : 'Free'} plan</p>
            <p className="text-sm text-gray-500">{subscription?.dailyIntroductionsRemaining ?? 0} introductions left today</p>
            {subscription?.plan !== 'PREMIUM' && (
              <Link href="/settings/premium" className="mt-2 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                Upgrade to Premium
              </Link>
            )}
          </div>
        </SettingsSection>

        {blocks.length > 0 && (
          <SettingsSection
            icon="close"
            title="Blocked"
            summary={`${blocks.length} blocked`}
            isOpen={openSection === 'blocked'}
            onToggle={() => toggleSection('blocked')}
          >
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
          </SettingsSection>
        )}
      </div>

      <section className="space-y-2 pt-2">
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
