import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { RequireAuth } from "./RequireAuth";

export function AppLayout() {
  return (
    <RequireAuth>
      <div className="app-shell">
        <Sidebar />
        <div>
          <Topbar />
          <main className="app-content"><Outlet /></main>
        </div>
      </div>
    </RequireAuth>
  );
}
