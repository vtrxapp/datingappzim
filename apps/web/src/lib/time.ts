const ONLINE_THRESHOLD_MS = 2 * 60_000;

/** Clock time for a message bubble, e.g. "10:42 AM". */
export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Last-message time for a Chats list row: clock time today, then Yesterday,
 * then weekday name within the last week, then a short date. */
export function formatConversationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return formatMessageTime(iso);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (daysAgo < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function isOnline(lastActiveAt: string | null): boolean {
  return !!lastActiveAt && Date.now() - new Date(lastActiveAt).getTime() < ONLINE_THRESHOLD_MS;
}

/** "Online" or "Active 10m/3h/2d ago" for a chat thread header, from lastActiveAt. */
export function formatLastActive(lastActiveAt: string | null): string | null {
  if (!lastActiveAt) return null;
  if (isOnline(lastActiveAt)) return 'Online';

  const minutes = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60_000);
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}
