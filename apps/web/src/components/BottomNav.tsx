'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConversationSummaryDto } from 'shared';
import { api } from '@/lib/api-client';
import { Icon, IconName } from './Icon';

const UNREAD_POLL_INTERVAL_MS = 15000;

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: '/matches', label: 'Matches', icon: 'heart' },
  { href: '/chat', label: 'Chat', icon: 'chat' },
  { href: '/safety', label: 'Safety', icon: 'shield' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    function loadUnreadCount() {
      api
        .get<ConversationSummaryDto[]>('/chat/conversations')
        .then((conversations) => setUnreadCount(conversations.reduce((sum, c) => sum + c.unreadCount, 0)))
        .catch(() => {});
    }
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, UNREAD_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-brand-100 bg-white">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        const showBadge = tab.href === '/chat' && unreadCount > 0;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              active ? 'text-brand-600 font-semibold' : 'text-gray-500'
            }`}
          >
            <span className="relative">
              <Icon name={tab.icon} size={20} />
              {showBadge && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
