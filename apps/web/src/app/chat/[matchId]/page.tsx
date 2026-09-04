'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MatchCandidateDto, MessageDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { Icon } from '@/components/Icon';
import { api, ApiError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const POLL_INTERVAL_MS = 5000;
const SWIPE_REPLY_THRESHOLD = 60;
const SWIPE_REPLY_MAX = 84;

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
  const [match, setMatch] = useState<MatchCandidateDto | null>(null);
  const [draft, setDraft] = useState('');
  const [replyTarget, setReplyTarget] = useState<MessageDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const draftInputRef = useRef<HTMLInputElement>(null);

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
    api.get<MatchCandidateDto>(`/matching/${matchId}`).then(setMatch);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendText() {
    if (!draft.trim()) return;
    const text = draft.trim();
    const replyToId = replyTarget?.id;
    setDraft('');
    setReplyTarget(null);
    try {
      await api.post(`/chat/${matchId}/messages`, { content: text, replyToId });
      load();
    } catch {
      setError('Could not send that message.');
    }
  }

  async function sendImage(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    if (replyTarget) formData.append('replyToId', replyTarget.id);
    setReplyTarget(null);
    try {
      await api.postForm(`/chat/${matchId}/messages/image`, formData);
      load();
    } catch {
      setError('Could not send that photo.');
    }
  }

  function startReply(message: MessageDto) {
    setReplyTarget(message);
    draftInputRef.current?.focus();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-brand-100 p-3">
        <button onClick={() => router.push('/chat')} className="text-brand-600">
          <Icon name="chevronLeft" size={20} />
        </button>
        {match && (
          <Link href={`/profile/${match.profile.userId}`} className="flex items-center gap-2">
            <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-brand-50">
              {match.profile.photos[0] && (
                <Image src={match.profile.photos[0]} alt="" fill className="object-cover" />
              )}
            </div>
            <span className="font-semibold text-gray-900">{match.profile.displayName}</span>
          </Link>
        )}
        <Link href="/safety" className="ml-auto text-xs font-semibold text-brand-600 underline">
          Plan a safe meet-up
        </Link>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages === null && <p className="text-sm text-gray-500">Loading…</p>}
        {messages?.map((m) => (
          <MessageBubble key={m.id} message={m} isMine={m.senderId === me?.userId} onReply={startReply} />
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-3 text-sm text-red-600">{error}</p>}

      {replyTarget && (
        <div className="flex items-center gap-2 border-t border-brand-100 bg-brand-50 px-3 py-2">
          <div className="flex-1 truncate border-l-2 border-brand-400 pl-2 text-sm text-gray-600">
            Replying to {replyTarget.senderId === me?.userId ? 'yourself' : match?.profile.displayName ?? 'them'}:{' '}
            {replyTarget.imageUrl ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="camera" size={13} /> Photo
              </span>
            ) : (
              replyTarget.content
            )}
          </div>
          <button onClick={() => setReplyTarget(null)} className="text-gray-400" aria-label="Cancel reply">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

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
        <button onClick={() => fileInputRef.current?.click()} className="text-gray-600" aria-label="Send a photo">
          <Icon name="camera" size={22} />
        </button>
        <input
          ref={draftInputRef}
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

/**
 * Swipe right past a threshold to reply, the same gesture as WhatsApp/Messenger.
 * Tracked with pointer events (not touch-only) so it works with mouse drag too.
 */
function MessageBubble({
  message,
  isMine,
  onReply,
}: {
  message: MessageDto;
  isMine: boolean;
  onReply: (message: MessageDto) => void;
}) {
  const [dragX, setDragX] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; horizontal: boolean } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, horizontal: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.horizontal && Math.abs(dx) > 8) {
      drag.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!drag.horizontal) return;
    setDragX(Math.max(0, Math.min(dx, SWIPE_REPLY_MAX)));
  }

  function endDrag() {
    if (dragRef.current?.horizontal && dragX >= SWIPE_REPLY_THRESHOLD) {
      onReply(message);
    }
    dragRef.current = null;
    setDragX(0);
  }

  return (
    <div className={`flex items-center gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      <span
        className="text-brand-500 transition-opacity"
        style={{ opacity: Math.min(dragX / SWIPE_REPLY_THRESHOLD, 1) }}
      >
        <Icon name="reply" size={20} />
      </span>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragX === 0 ? 'transform 0.2s ease' : 'none',
          touchAction: 'pan-y',
        }}
        className={`max-w-[75%] select-none rounded-2xl px-3 py-2 text-sm ${
          isMine ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-800'
        }`}
      >
        {message.replyTo && (
          <div
            className={`mb-1 rounded border-l-2 px-2 py-1 text-xs ${
              isMine ? 'border-white/60 bg-white/10 text-white/90' : 'border-brand-300 bg-white/70 text-gray-600'
            }`}
          >
            {message.replyTo.imageUrl ? (
              <span className="inline-flex items-center gap-1">
                <Icon name="camera" size={12} /> Photo
              </span>
            ) : (
              message.replyTo.content
            )}
          </div>
        )}
        {message.imageUrl ? (
          <div className="relative h-48 w-40 overflow-hidden rounded-lg">
            <Image src={message.imageUrl} alt="Shared photo" fill className="object-cover" />
          </div>
        ) : (
          <p>{message.content}</p>
        )}
      </div>
    </div>
  );
}
