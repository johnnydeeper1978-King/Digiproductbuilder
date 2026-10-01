import { NavLink, Link } from "react-router-dom";
import { ButtonLink } from "@/components/ui/Button";
import { useSession } from "@/features/catalog/useSession";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/how-it-works", label: "How it works" },
];

export function Navbar() {
  const session = useSession();
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
          {session
            ? <ButtonLink to="/library" variant="ghost" size="sm">My Library</ButtonLink>
            : <ButtonLink to="/login" variant="ghost" size="sm">Sign in</ButtonLink>}
          <ButtonLink to="/marketplace" size="sm">Marketplace</ButtonLink>
        </div>
      </div>
    </header>
  );
}
