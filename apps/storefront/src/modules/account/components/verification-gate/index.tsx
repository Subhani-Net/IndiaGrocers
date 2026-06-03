/**
 * VerificationGate — shows verification prompt for unverified accounts.
 * Grandfathers existing accounts (no email_verified metadata = let through).
 */

export default function VerificationGate() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-amber-200 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-grey-90 mb-2">Verify Your Email</h2>
        <p className="text-sm text-grey-50 mb-6">
          Please verify your email address to access your account. Check your inbox
          for the verification link we sent you.
        </p>
        <a
          href="/account"
          className="block w-full py-3 bg-brand-orange text-white font-semibold rounded-xl hover:bg-brand-orange-dark transition-colors text-center"
        >
          Go to Login Page
        </a>
        <p className="text-xs text-grey-50 mt-4">
          Already verified? Try signing out and signing in again.
        </p>
      </div>
    </div>
  )
}
