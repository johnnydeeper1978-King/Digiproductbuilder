import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useSession } from "@/features/catalog/useSession";
import { authService } from "@/services/authService";

const LINKS = [
  { to: "/discover", label: "Discover" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/builder", label: "Builder" },
];

export function SiteNav() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <>
      <div className="announcement">DISCOVER YOUR PRODUCT · OR USE A READY-MADE SYSTEM</div>
      <nav className="site-nav">
        <div className="container nav-inner">
          <Link className="logo" to="/">369°<sup>DEGREES</sup></Link>
          <div className="navlinks">
            {LINKS.map((l) => <NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}
          </div>
          <div className="nav-actions">
            {session ? <Link className="login" to="/library">My Library</Link> : <Link className="login" to="/login">Log In</Link>}
            <Link className="btn primary nav-cta" to="/discover">Start Free →</Link>
            <button className="nav-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
        {open && (
          <div className="nav-mobile">
            {LINKS.map((l) => <Link key={l.to} to={l.to}>{l.label}</Link>)}
            {session ? (
              <>
                <Link to="/library">My Library</Link>
                <button onClick={() => authService.signOut().catch(() => {})}>Sign out</button>
              </>
            ) : <Link to="/login">Log In</Link>}
          </div>
        )}
      </nav>
    </>
  );
}
