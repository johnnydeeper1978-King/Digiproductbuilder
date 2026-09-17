import { useParams } from "react-router-dom";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export function ProductBuilderPage() {
  const { productId } = useParams();
  return (
    <PlaceholderPage
      title="Product Builder"
      what={`The guided build workspace for product ${productId}.`}
      why="It walks a single product through strategy, creation, positioning, pricing and launch."
      next="The Builder phases are implemented after the Blueprint handoff."
    />
  );
}
