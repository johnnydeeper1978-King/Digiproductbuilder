import { Link } from "react-router-dom";

export function SiteNav() {
  return (
    <>
      <div className="announcement">DISCOVER → CREATE → BUILD → LAUNCH → SELL → SCALE → <span>&nbsp;AUTOMATE</span></div>
      <nav className="site-nav">
        <div className="container nav-inner">
          <Link className="logo" to="/">369°<sup>DEGREES</sup></Link>
          <div className="navlinks">
            <Link to="/discover">Discover</Link>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/builder">Build</Link>
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/workforce">AI Workforce</Link>
          </div>
          <div className="nav-actions">
            <Link className="login" to="/login">Log In</Link>
            <Link className="btn primary" to="/discover">Get Started →</Link>
          </div>
        </div>
      </nav>
    </>
  );
}
