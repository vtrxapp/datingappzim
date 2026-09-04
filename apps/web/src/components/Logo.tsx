import { useId } from 'react';

export type LogoVariant = 'icon' | 'lockup' | 'stacked';
export type LogoTheme = 'light' | 'dark';

// Dark = the tint set used when the logo sits on a dark surface, not app dark mode.
const PALETTE: Record<LogoTheme, { teal: string; coral: string; gold: string; text: string }> = {
  light: { teal: '#2B6157', coral: '#E8674F', gold: '#D9A441', text: '#1C1B29' },
  dark: { teal: '#3E8C7C', coral: '#F08268', gold: '#EFC066', text: '#F5F1EC' },
};

export interface LogoProps {
  /** icon: mark only. lockup: mark + wordmark side by side. stacked: mark above wordmark. */
  variant?: LogoVariant;
  /** Which surface the logo sits on. Picks the light- or dark-tinted mark. */
  theme?: LogoTheme;
  /** Icon edge length in px; wordmark size and gaps scale off this. */
  size?: number;
  className?: string;
}

export function Logo({ variant = 'lockup', theme = 'light', size = 40, className = '' }: LogoProps) {
  const clipId = useId();
  const { teal, coral, gold, text } = PALETTE[theme];
  const hasWordmark = variant !== 'icon';

  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      {...(hasWordmark ? { 'aria-hidden': true } : { role: 'img', 'aria-label': 'Tariro' })}
    >
      <circle cx="80" cy="100" r="55" fill={teal} />
      <circle cx="120" cy="100" r="55" fill={coral} />
      <clipPath id={clipId}>
        <circle cx="80" cy="100" r="55" />
      </clipPath>
      <circle cx="120" cy="100" r="55" fill={gold} clipPath={`url(#${clipId})`} />
    </svg>
  );

  if (variant === 'icon') {
    return <span className={className}>{icon}</span>;
  }

  const wordmark = (
    <span
      style={{
        fontFamily: 'var(--font-fraunces), Georgia, serif',
        fontWeight: 600,
        color: text,
        fontSize: size * 0.68,
        lineHeight: 1,
      }}
    >
      tariro
    </span>
  );

  return (
    <span
      className={`inline-flex ${variant === 'stacked' ? 'flex-col items-center' : 'items-center'} ${className}`}
      style={{ gap: size * (variant === 'stacked' ? 0.16 : 0.26) }}
    >
      {icon}
      {wordmark}
    </span>
  );
}
