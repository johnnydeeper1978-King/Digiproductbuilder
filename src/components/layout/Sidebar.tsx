import { NavLink, Link } from "react-router-dom";

const primary = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/products", label: "My Products" },
  { to: "/discover", label: "Discover" },
];
const build = [
  { to: "/ai-guide", label: "AI Guide" },
  { to: "/content", label: "Content" },
  { to: "/tools", label: "Tools" },
];
const grow = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/workforce", label: "AI Workforce" },
  { to: "/affiliate", label: "Affiliate Program" },
  { to: "/book-a-call", label: "Book a Call" },
];

function Group({ title, items }: { title: string; items: { to: string; label: string }[] }) {
  return (
    <>
      <div className="side-section">{title}</div>
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>
          {i.label}
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand" style={{ marginBottom: "var(--space-6)" }}>
        <span className="brand-mark">369</span> Degrees
      </Link>
      <Group title="Overview" items={primary} />
      <Group title="Build" items={build} />
      <Group title="Grow" items={grow} />
      <div className="side-section">Account</div>
      <NavLink to="/settings" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>Settings</NavLink>
    </aside>
  );
}
