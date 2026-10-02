import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

// Marketplace is the cream-themed commerce surface (see tokens.css
// [data-theme="light"]); Home, Discover, Blueprint and Builder stay on the
// dark functional-app theme.
const LIGHT_PATHS = ["/marketplace"];

export function PublicLayout() {
  const { pathname } = useLocation();
  const isLight = LIGHT_PATHS.some((p) => pathname.startsWith(p));
  return (
    <div data-theme={isLight ? "light" : undefined} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main><Outlet /></main>
      <Footer />
    </div>
  );
}
