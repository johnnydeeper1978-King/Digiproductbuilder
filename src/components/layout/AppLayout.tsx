import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { RequireAuth } from "./RequireAuth";

export function AppLayout() {
  return (
    <RequireAuth>
      <div className="app-shell" data-theme="light">
        <Sidebar />
        <main className="app-main"><Outlet /></main>
      </div>
    </RequireAuth>
  );
}
