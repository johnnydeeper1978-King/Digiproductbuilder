import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo">369°<sup>DEGREES</sup></div>
            <p style={{ maxWidth: 280, lineHeight: 1.6, fontSize: 13 }}>Find a digital product that fits you — or use a ready-made system. Discover. Build. Launch. Sell.</p>
          </div>
          <div>
            <h4>START</h4>
            <Link to="/discover">Free Product Discovery</Link>
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/builder">Product Builder</Link>
            <Link to="/how-it-works">How It Works</Link>
          </div>
          <div>
            <h4>ACCOUNT</h4>
            <Link to="/library">My Library</Link>
            <Link to="/login">Log In</Link>
            <Link to="/login?mode=signup">Create Account</Link>
          </div>
          <div>
            <h4>HELP</h4>
            <Link to="/contact">Contact & Support</Link>
            <Link to="/book-a-call">Book a Call</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy (POPIA)</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} 369 Degrees. All rights reserved.</span>
          <span><Link to="/privacy">Privacy</Link> · <Link to="/terms">Terms</Link> · <Link to="/contact">Contact</Link></span>
        </div>
      </div>
    </footer>
  );
}
