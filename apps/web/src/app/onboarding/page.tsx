'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONNAIRE, QuestionDefinition } from 'shared';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type AnswerMap = Record<string, unknown>;

const NAME_STEP = 'DISPLAY_NAME';
const PHOTO_STEP = 'PROFILE_PHOTO';

export default function OnboardingPage() {
  const { me, loading, refresh } = useAuth();
  const router = useRouter();

  const steps = useMemo(
    () => [NAME_STEP, PHOTO_STEP, ...QUESTIONNAIRE.filter((q) => (q.options?.length ?? 0) !== 1).map((q) => q.key)],
    [],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function selectPhoto(file: File) {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  }
  function removePhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  useEffect(() => {
    if (!loading && !me) router.replace('/signup');
    if (!loading && me?.onboardingComplete) router.replace('/matches');
  }, [loading, me, router]);

  if (loading || !me || me.onboardingComplete) {
    return <div className="flex flex-1 items-center justify-center p-8 text-sm text-gray-500">Loading…</div>;
  }

  const currentKey = steps[stepIndex];
  const question = QUESTIONNAIRE.find((q) => q.key === currentKey);
  const isLastStep = stepIndex === steps.length - 1;

  function isCurrentStepValid(): boolean {
    if (currentKey === NAME_STEP) return displayName.trim().length > 0;
    if (currentKey === PHOTO_STEP) return true; // optional — skippable
    if (!question) return false;
    const value = answers[question.key];
    if (!question.required) return true;
    if (question.type === 'MULTI_SELECT') return Array.isArray(value) && value.length > 0;
    if (question.type === 'RANGE') {
      const r = value as { min?: number; max?: number } | undefined;
      return typeof r?.min === 'number' && typeof r?.max === 'number' && r.min <= r.max;
    }
    return value !== undefined && value !== '';
  }

  async function goNext() {
    if (!isCurrentStepValid()) return;
    if (!isLastStep) {
      setStepIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const fullAnswers: AnswerMap = { ...answers };
      for (const q of QUESTIONNAIRE) {
        if (q.options?.length === 1) fullAnswers[q.key] = q.options[0].value;
      }
      await api.post('/questionnaire/submit', { displayName: displayName.trim(), answers: fullAnswers });
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('photo', photoFile);
          await api.postForm('/profiles/me/photos', formData);
        } catch {
          // Non-fatal — the profile itself was created fine; they can add a photo later from Settings.
        }
      }
      await refresh();
      router.replace('/matches');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your answers. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col p-6">
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-brand-100">
        <div
          className="h-full rounded-full bg-brand-500 transition-all"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex-1">
        {currentKey === NAME_STEP ? (
          <NameStep value={displayName} onChange={setDisplayName} />
        ) : currentKey === PHOTO_STEP ? (
          <PhotoStep previewUrl={photoPreviewUrl} onSelect={selectPhoto} onRemove={removePhoto} />
        ) : question ? (
          <QuestionStep
            question={question}
            value={answers[question.key]}
            onChange={(value) => setAnswers((a) => ({ ...a, [question.key]: value }))}
          />
        ) : null}
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={goNext}
        disabled={!isCurrentStepValid() || submitting}
        className="w-full rounded-xl bg-brand-500 py-3 font-semibold text-white active:bg-brand-600 disabled:opacity-50"
      >
        {submitting
          ? 'Saving…'
          : isLastStep
            ? 'See my matches'
            : currentKey === PHOTO_STEP && !photoFile
              ? 'Skip for now'
              : 'Next'}
      </button>
    </main>
  );
}

function NameStep({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-brand-700">What should we call you?</h1>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={60}
        placeholder="Your first name"
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-lg focus:border-brand-400 focus:outline-none"
      />
    </div>
  );
}

function PhotoStep({
  previewUrl,
  onSelect,
  onRemove,
}: {
  previewUrl: string | null;
  onSelect: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-brand-700">Add a profile photo</h1>
      <p className="text-sm text-gray-500">
        You can skip this for now, but you'll need at least one photo before you can respond to matches —
        you can always add it later from Settings.
      </p>
      <div className="flex justify-center py-2">
        <label className="relative flex h-36 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-brand-50">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not a remote/optimizable image
            <img src={previewUrl} alt="Your photo preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl text-gray-400">+</span>
          )}
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {previewUrl && (
        <button type="button" onClick={onRemove} className="mx-auto block text-sm text-red-600 underline">
          Remove photo
        </button>
      )}
    </div>
  );
}

function QuestionStep({
  question,
  value,
  onChange,
}: {
  question: QuestionDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <div className="space-y-3">
      <h1 className="text-xl font-bold text-brand-700">{question.prompt}</h1>
      {question.helperText && <p className="text-sm text-gray-500">{question.helperText}</p>}

      {question.type === 'SINGLE_SELECT' && (
        <div className="space-y-2">
          {question.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`w-full rounded-lg border px-4 py-3 text-left ${
                value === opt.value ? 'border-brand-500 bg-brand-50 font-semibold' : 'border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'MULTI_SELECT' && (
        <div className="space-y-2">
          {question.options?.map((opt) => {
            const selected: string[] = Array.isArray(value) ? (value as string[]) : [];
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  if (isSelected) {
                    onChange(selected.filter((v) => v !== opt.value));
                  } else if (!question.maxSelections || selected.length < question.maxSelections) {
                    onChange([...selected, opt.value]);
                  }
                }}
                className={`w-full rounded-lg border px-4 py-3 text-left ${
                  isSelected ? 'border-brand-500 bg-brand-50 font-semibold' : 'border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {question.maxSelections && (
            <p className="text-xs text-gray-400">Pick up to {question.maxSelections}</p>
          )}
        </div>
      )}

      {question.type === 'RANGE' && (
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={question.min}
            max={question.max}
            value={(value as { min?: number })?.min ?? ''}
            onChange={(e) =>
              onChange({ ...(value as object), min: Number(e.target.value) })
            }
            placeholder="From"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
          <span className="text-gray-400">to</span>
          <input
            type="number"
            min={question.min}
            max={question.max}
            value={(value as { max?: number })?.max ?? ''}
            onChange={(e) =>
              onChange({ ...(value as object), max: Number(e.target.value) })
            }
            placeholder="To"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-400 focus:outline-none"
          />
        </div>
      )}

      {question.type === 'TEXT' && question.key === 'DATE_OF_BIRTH' && (
        <input
          type="date"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-400 focus:outline-none"
        />
      )}
    </div>
  );
}
