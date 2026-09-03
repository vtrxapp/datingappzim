import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tariro — Marriage-minded matches',
  description: 'Curated, safety-first matchmaking for Zimbabweans ready to settle down.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c9542f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-50">
        <AuthProvider>
          <div className="mx-auto flex min-h-screen max-w-app flex-col bg-white shadow-sm">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
