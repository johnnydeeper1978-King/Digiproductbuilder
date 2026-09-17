export function Footer() {
  return (
    <footer className="footer">
      <div className="container row wrap" style={{ justifyContent: "space-between" }}>
        <span>© {new Date().getFullYear()} 369 Degrees</span>
        <span className="dim">Discover · Build · Launch · Sell · Automate</span>
      </div>
    </footer>
  );
}
