import { Seo } from "@/components/seo/Seo";
import { Container } from "@/components/ui/Container";
import { NotFoundState } from "@/components/feedback/NotFoundState";

export function NotFoundPage() {
  return (
    <Container>
      <Seo title="Not found" />
      <NotFoundState />
    </Container>
  );
}
