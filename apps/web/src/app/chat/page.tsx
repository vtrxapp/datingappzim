'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ConversationSummaryDto } from 'shared';
import { AuthGate } from '@/components/AuthGate';
import { BottomNav } from '@/components/BottomNav';
import { api } from '@/lib/api-client';
import { formatConversationTime, isOnline } from '@/lib/time';
import { useAuth } from '@/lib/auth-context';

export default function ChatListPage() {
  return (
    <AuthGate>
      <ChatListContent />
      <BottomNav />
    </AuthGate>
  );
}

function ChatListContent() {
  const { me } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummaryDto[] | null>(null);

  useEffect(() => {
    api.get<ConversationSummaryDto[]>('/chat/conversations').then(setConversations);
  }, []);

  return (
    <main className="flex-1 p-4">
      <h1 className="mb-4 text-lg font-bold text-brand-700">Chats</h1>

      {conversations === null && <p className="text-sm text-gray-500">Loading…</p>}
      {conversations?.length === 0 && (
        <p className="text-sm text-gray-500">
          No chats yet. Once you and someone are both interested, you'll be able to message here.
        </p>
      )}

      <div className="space-y-2">
        {conversations?.map((conv) => {
          const unread = conv.unreadCount > 0;
          const preview = !conv.lastMessage
            ? 'Say hello!'
            : conv.lastMessage.imageUrl
              ? 'Photo'
              : conv.lastMessage.content;
          const previewPrefix = conv.lastMessage?.senderId === me?.userId ? 'You: ' : '';

          return (
            <Link
              key={conv.matchId}
              href={`/chat/${conv.matchId}`}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3"
            >
              <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-50">
                {conv.profile.photos[0] && (
                  <Image src={conv.profile.photos[0]} alt={conv.profile.displayName} fill className="object-cover" />
                )}
                {isOnline(conv.theirLastActiveAt) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate ${unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                    {conv.profile.displayName}
                  </p>
                  {conv.lastMessage && (
                    <span className={`flex-shrink-0 text-xs ${unread ? 'font-semibold text-brand-600' : 'text-gray-400'}`}>
                      {formatConversationTime(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${unread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                    {previewPrefix}
                    {preview}
                  </p>
                  {unread && (
                    <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
