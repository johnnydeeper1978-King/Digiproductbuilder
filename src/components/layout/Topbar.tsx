import { useEffect, useState } from "react";
import { authService } from "@/services/authService";

export function Topbar() {
  const [initial, setInitial] = useState("U");
  useEffect(() => {
    let active = true;
    authService.getSession().then((s) => {
      const email = s?.user?.email;
      if (active && email) setInitial(email[0]?.toUpperCase() ?? "U");
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  return (
    <div className="topbar">
      <input className="search" placeholder="Search products, tools, guides…" />
      <div className="tb-actions">
        <div className="tb-ico" title="Notifications">◔</div>
        <div className="tb-ico" title="Help">?</div>
        <div className="avatar">{initial}</div>
      </div>
    </div>
  );
}
