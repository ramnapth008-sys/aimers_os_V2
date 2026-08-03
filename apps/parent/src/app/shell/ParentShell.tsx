import {
  CircleCheck,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { ParentSidebar } from "../../components/navigation/ParentSidebar";
import { ParentTopbar } from "../../components/navigation/ParentTopbar";

export function ParentShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="parent-app-shell">
      <ParentSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="parent-main-column">
        <ParentTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="parent-page-content">
          <Outlet />
        </main>

        <footer className="parent-system-footer">
          <span>
            <CircleCheck size={13} />
            Parent reporting operational
          </span>

          <span>
            <ShieldCheck size={13} />
            Privacy controls active
          </span>

          <strong>
            AIMERS Parent v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
