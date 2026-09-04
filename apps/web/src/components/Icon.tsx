export type IconName =
  | 'check'
  | 'checkDouble'
  | 'close'
  | 'camera'
  | 'heart'
  | 'chat'
  | 'shield'
  | 'settings'
  | 'star'
  | 'sparkle'
  | 'pin'
  | 'person'
  | 'chevronLeft'
  | 'chevronRight'
  | 'reply';

const PATHS: Record<IconName, React.ReactNode> = {
  check: <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  checkDouble: (
    <>
      <path d="M1 13l4 4L14 8" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />,
  camera: (
    <>
      <path
        d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke="currentColor"
        strokeWidth={1.8}
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx={12} cy={13} r={3.2} stroke="currentColor" strokeWidth={1.8} fill="none" />
    </>
  ),
  heart: (
    <path
      d="M12 20s-7-4.4-9.5-9C1 8 2 4.5 5.5 4c2-.3 3.8.8 4.5 2.3C10.7 4.8 12.5 3.7 14.5 4c3.5.5 4.5 4 3 7-2.5 4.6-9.5 9-9.5 9Z"
      stroke="currentColor"
      strokeWidth={1.8}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  chat: (
    <>
      <path d="M12 3a9 9 0 0 0-7.75 13.55L3 21l4.6-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" strokeWidth={1.8} fill="none" />
      <path d="M8.5 9.5c.3 3 2.7 5.3 5.7 5.6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" fill="none" />
    </>
  ),
  shield: (
    <path
      d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
      stroke="currentColor"
      strokeWidth={1.8}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  settings: (
    <>
      <circle cx={12} cy={12} r={3} stroke="currentColor" strokeWidth={1.8} fill="none" />
      <path
        d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7 5.6 5.6"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </>
  ),
  star: (
    <path
      d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3.5Z"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinejoin="round"
    />
  ),
  sparkle: <path d="M12 2 13.8 9.2 21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8L12 2Z" fill="currentColor" strokeLinejoin="round" />,
  pin: (
    <>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinejoin="round" />
      <circle cx={12} cy={9} r={2.3} stroke="currentColor" strokeWidth={1.8} fill="none" />
    </>
  ),
  person: (
    <>
      <circle cx={12} cy={8.5} r={3.2} stroke="currentColor" strokeWidth={1.8} fill="none" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  chevronLeft: <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  chevronRight: <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  reply: (
    <path
      d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 5 5v1"
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`inline-block shrink-0 align-middle ${className}`} aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
