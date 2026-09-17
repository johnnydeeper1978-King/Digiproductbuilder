import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AppLayout } from "@/components/layout/AppLayout";

import { HomePage } from "@/pages/public/HomePage";
import { HowItWorksPage } from "@/pages/public/HowItWorksPage";
import { DiscoverPage } from "@/pages/public/DiscoverPage";
import { DiscoverResultsPage } from "@/pages/public/DiscoverResultsPage";
import { BlueprintPage } from "@/pages/public/BlueprintPage";
import { BuilderPage } from "@/pages/public/BuilderPage";
import { MarketplacePage } from "@/pages/public/MarketplacePage";
import { WorkforcePage } from "@/pages/public/WorkforcePage";
import { BookACallPage } from "@/pages/public/BookACallPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { GetStartedPage } from "@/pages/public/GetStartedPage";

import { DashboardPage } from "@/pages/app/DashboardPage";
import { ProductsPage } from "@/pages/app/ProductsPage";
import { ProductDetailPage } from "@/pages/app/ProductDetailPage";
import { ProductBuilderPage } from "@/pages/app/ProductBuilderPage";
import { AiGuidePage } from "@/pages/app/AiGuidePage";
import { ContentPage } from "@/pages/app/ContentPage";
import { ToolsPage } from "@/pages/app/ToolsPage";
import { AffiliatePage } from "@/pages/app/AffiliatePage";
import { SettingsPage } from "@/pages/app/SettingsPage";

import { NotFoundPage } from "@/pages/NotFoundPage";

export function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/discover/results" element={<DiscoverResultsPage />} />
        <Route path="/blueprint" element={<BlueprintPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/workforce" element={<WorkforcePage />} />
        <Route path="/book-a-call" element={<BookACallPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/get-started" element={<GetStartedPage />} />
      </Route>

      {/* Authenticated application */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="/products/:productId/builder" element={<ProductBuilderPage />} />
        <Route path="/ai-guide" element={<AiGuidePage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
