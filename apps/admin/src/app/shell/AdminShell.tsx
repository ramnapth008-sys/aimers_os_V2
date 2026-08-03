import {
  Activity,
  CircleCheck,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { AdminSidebar } from "../../components/navigation/AdminSidebar";
import { AdminTopbar } from "../../components/navigation/AdminTopbar";

export function AdminShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="admin-app-shell">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="admin-main-column">
        <AdminTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="admin-page-content">
          <Outlet />
        </main>

        <footer className="admin-system-footer">
          <span>
            <CircleCheck size={13} />
            All production systems operational
          </span>

          <span>
            <Activity size={13} />
            Live data refreshed 12 seconds ago
          </span>

          <strong>
            AIMERS OS Admin v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
