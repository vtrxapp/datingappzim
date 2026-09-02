'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MessageDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const POLL_INTERVAL_MS = 5000;

export default function ChatThreadPage() {
  return (
    <AuthGate>
      <ChatThreadContent />
    </AuthGate>
  );
}

function ChatThreadContent() {
  const { matchId } = useParams<{ matchId: string }>();
  const { me } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<MessageDto[] | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const result = await api.get<MessageDto[]>(`/chat/${matchId}/messages`);
      setMessages(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load messages.');
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendText() {
    if (!draft.trim()) return;
    const text = draft.trim();
    setDraft('');
    try {
      await api.post(`/chat/${matchId}/messages`, { content: text });
      load();
    } catch {
      setError('Could not send that message.');
    }
  }

  async function sendImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    try {
      await api.postForm(`/chat/${matchId}/messages/image`, formData);
      load();
    } catch {
      setError('Could not send that photo.');
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-brand-100 p-3">
        <button onClick={() => router.push('/chat')} className="text-brand-600">
          ←
        </button>
        <Link href="/safety" className="ml-auto text-xs font-semibold text-brand-600 underline">
          Plan a safe meet-up
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages === null && <p className="text-sm text-gray-500">Loading…</p>}
        {messages?.map((m) => {
          const isMine = m.senderId === me?.userId;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  isMine ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.imageUrl ? (
                  <div className="relative h-48 w-40 overflow-hidden rounded-lg">
                    <Image src={m.imageUrl} alt="Shared photo" fill className="object-cover" />
                  </div>
                ) : (
                  <p>{m.content}</p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-3 text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-2 border-t border-brand-100 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) sendImage(file);
            e.target.value = '';
          }}
        />
        <button onClick={() => fileInputRef.current?.click()} className="text-xl" aria-label="Send a photo">
          📷
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:border-brand-400 focus:outline-none"
        />
        <button onClick={sendText} className="font-semibold text-brand-600">
          Send
        </button>
      </div>
    </div>
  );
}
