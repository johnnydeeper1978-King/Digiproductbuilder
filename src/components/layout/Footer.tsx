import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container row wrap" style={{ justifyContent: "space-between", gap: 12 }}>
        <span>© {new Date().getFullYear()} 369 Degrees</span>
        <span className="dim row wrap" style={{ gap: 14 }}>
          <Link to="/marketplace">Marketplace</Link><Link to="/contact">Contact</Link><Link to="/terms">Terms</Link><Link to="/privacy">Privacy</Link>
        </span>
      </div>
    </footer>
  );
}
