import { ButtonLink } from "@/components/ui/Button";

export function UnauthorizedState() {
  return (
    <div className="state">
      <h3>Sign in required</h3>
      <p className="muted">You need to be signed in to view this page.</p>
      <ButtonLink to="/login" size="sm">Sign in</ButtonLink>
    </div>
  );
}
