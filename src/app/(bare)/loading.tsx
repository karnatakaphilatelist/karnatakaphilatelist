/**
 * Shown the instant someone navigates to the landing page (the wordmark link from
 * inside the app, say) while `getPostOffices()` resolves. Without this, that
 * transition could show a blank screen for a couple of seconds — a user-visible
 * gap, not a build-time one, since the office list is only cached for a while and
 * still has to be fetched fresh sometimes.
 */
export default function BareLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="grid h-dvh place-items-center bg-[#fffffe]"
    >
      <div className="kp-wordmark animate-pulse opacity-70" />
    </div>
  );
}
