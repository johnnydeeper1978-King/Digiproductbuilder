import { ButtonLink } from "@/components/ui/Button";

export function NotFoundState() {
  return (
    <div className="state">
      <p className="eyebrow">404</p>
      <h3>Page not found</h3>
      <p className="muted">That page doesn't exist or has moved.</p>
      <ButtonLink to="/" variant="secondary" size="sm">Back home</ButtonLink>
    </div>
  );
}
