import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo">369°<sup>DEGREES</sup></div>
            <p style={{ maxWidth: 270, lineHeight: 1.6, fontSize: 13 }}>Discover. Build. Launch. Sell. Scale. Automate.</p>
          </div>
          <div>
            <h4>PLATFORM</h4>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/discover">Discover Your Product</Link>
            <Link to="/builder">Digital Product Builder</Link>
            <Link to="/workforce">AI Workforce</Link>
          </div>
          <div>
            <h4>EARN</h4>
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/marketplace">Sell Your Product</Link>
            <Link to="/get-started">Affiliate Program</Link>
          </div>
          <div>
            <h4>LEARN</h4>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/book-a-call">Book a Call</Link>
            <Link to="/get-started">Get Started</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} 369 Degrees. All rights reserved.</span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </div>
    </footer>
  );
}
