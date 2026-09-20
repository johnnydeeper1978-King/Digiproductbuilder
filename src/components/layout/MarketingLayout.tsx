import { Outlet } from "react-router-dom";
import { SiteNav } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";

/** Light premium marketing chrome. Scoped under .site so the functional dark
 *  app experiences (Discovery/Blueprint/Builder) remain untouched. */
export function MarketingLayout() {
  return (
    <div className="site">
      <SiteNav />
      <main><Outlet /></main>
      <SiteFooter />
    </div>
  );
}
