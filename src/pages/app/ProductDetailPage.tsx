import { useParams } from "react-router-dom";
import { Seo } from "@/components/seo/Seo";
import { EmptyState } from "@/components/feedback/EmptyState";

export function ProductDetailPage() {
  const { productId } = useParams();
  return (
    <>
      <Seo title="Product" />
      <div className="page-head">
        <span className="eyebrow">Product</span>
        <h1>Product detail</h1>
        <p className="dim" style={{ fontSize: "0.85rem" }}>ID: {productId}</p>
      </div>
      <EmptyState
        title="Product view is a foundation"
        message="Name, status, current phase, progress, created/updated dates and the resume/view/restart/archive actions render here once persistence exists."
      />
    </>
  );
}
