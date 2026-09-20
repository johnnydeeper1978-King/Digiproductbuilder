import { NavLink, Link } from "react-router-dom";

type Item = { to: string; label: string; ico: string; badge?: string };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: "Overview", items: [
    { to: "/dashboard", label: "Dashboard", ico: "▦" },
    { to: "/products", label: "Product Library", ico: "▤" },
  ]},
  { title: "Create", items: [
    { to: "/discover", label: "Discovery", ico: "◎" },
    { to: "/blueprint", label: "Blueprint", ico: "◈" },
    { to: "/builder", label: "Builder", ico: "⚙" },
  ]},
  { title: "Tools", items: [
    { to: "/ai-guide", label: "AI Guide", ico: "✦" },
    { to: "/content", label: "Content", ico: "✎" },
    { to: "/tools", label: "Tools", ico: "⚒" },
  ]},
  { title: "Grow", items: [
    { to: "/marketplace", label: "Marketplace", ico: "◫" },
    { to: "/affiliate", label: "Affiliate", ico: "↗" },
    { to: "/workforce", label: "AI Workforce", ico: "⬢", badge: "SOON" },
  ]},
  { title: "Account", items: [
    { to: "/settings", label: "Settings", ico: "☰" },
  ]},
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <Link to="/" className="brand"><span className="brand-mark">369</span> Degrees</Link>
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="side-section">{g.title}</div>
          {g.items.map((i) => (
            <NavLink key={i.to} to={i.to} className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>
              <span className="side-ico">{i.ico}</span>{i.label}
              {i.badge && <span className="side-badge">{i.badge}</span>}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
