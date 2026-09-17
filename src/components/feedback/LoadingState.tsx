export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden />
      <p className="muted">{label}</p>
    </div>
  );
}
