import { NavLink, Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";

const links = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/discover", label: "Discover" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/workforce", label: "AI Workforce" },
];

export function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">369</span> Degrees
        </Link>
        <nav className="nav-links desktop">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="row">
          <ButtonLink to="/login" variant="ghost" size="sm">Sign in</ButtonLink>
          <ButtonLink to="/get-started" size="sm">Get started</ButtonLink>
        </div>
      </div>
    </header>
  );
}
