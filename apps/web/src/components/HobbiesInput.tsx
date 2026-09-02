'use client';

import { useState } from 'react';
import { HOBBY_OPTIONS } from 'shared';

const MAX_HOBBIES = 5;
const MAX_HOBBY_LENGTH = 40;

export function HobbiesInput({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const atMax = value.length >= MAX_HOBBIES;

  function addHobby(raw: string) {
    const trimmed = raw.trim().slice(0, MAX_HOBBY_LENGTH);
    if (!trimmed || atMax) return;
    if (value.some((h) => h.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...value, trimmed]);
    setDraft('');
  }

  function removeHobby(hobby: string) {
    onChange(value.filter((h) => h !== hobby));
  }

  const suggestions = HOBBY_OPTIONS.filter(
    (opt) => !value.some((h) => h.toLowerCase() === opt.label.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((h) => (
            <span
              key={h}
              className="flex items-center gap-1.5 rounded-full border border-brand-500 bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700"
            >
              {h}
              <button type="button" onClick={() => removeHobby(h)} aria-label={`Remove ${h}`} className="text-brand-400">
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addHobby(draft);
            }
          }}
          maxLength={MAX_HOBBY_LENGTH}
          disabled={atMax}
          placeholder={atMax ? `You've added ${MAX_HOBBIES}` : 'Type a hobby — the more specific, the better'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="button"
          onClick={() => addHobby(draft)}
          disabled={atMax || !draft.trim()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {!atMax && suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Or pick a suggestion</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => addHobby(opt.label)}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-600"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        {value.length}/{MAX_HOBBIES}
      </p>
    </div>
  );
}
