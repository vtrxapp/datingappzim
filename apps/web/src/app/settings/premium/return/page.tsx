'use client';

import Link from 'next/link';

/**
 * Paynow's browser return URL after a web-redirect payment flow. The MVP's
 * EcoCash Express Checkout flow doesn't redirect the browser at all (the
 * user approves on their phone while /settings/premium polls for status),
 * so this page mainly exists so PAYNOW_RETURN_URL always points somewhere
 * sensible if Paynow ever falls back to a redirect.
 */
export default function PremiumReturnPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-gray-600">Thanks! We're confirming your payment now.</p>
      <Link href="/settings/premium" className="text-brand-600 underline">
        Back to upgrade status
      </Link>
    </main>
  );
}
