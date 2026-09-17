export function ErrorState({ title = "Something went wrong", message, onRetry }:
  { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div className="state" role="alert">
      <h3>{title}</h3>
      {message && <p className="muted">{message}</p>}
      {onRetry && <button className="btn btn-secondary btn-sm" onClick={onRetry}>Try again</button>}
    </div>
  );
}
