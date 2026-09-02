'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/matches', label: 'Matches', icon: '💛' },
  { href: '/chat', label: 'Chat', icon: '💬' },
  { href: '/safety', label: 'Safety', icon: '🛡️' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-brand-100 bg-white">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              active ? 'text-brand-600 font-semibold' : 'text-gray-500'
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
