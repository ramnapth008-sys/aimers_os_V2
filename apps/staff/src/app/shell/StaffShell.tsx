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

import { StaffSidebar } from "../../components/navigation/StaffSidebar";
import { StaffTopbar } from "../../components/navigation/StaffTopbar";

export function StaffShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="staff-app-shell">
      <StaffSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="staff-main-column">
        <StaffTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="staff-page-content">
          <Outlet />
        </main>

        <footer className="staff-system-footer">
          <span>
            <CircleCheck size={13} />
            Mentor systems operational
          </span>

          <span>
            <ShieldCheck size={13} />
            Student access is audited
          </span>

          <strong>
            AIMERS Staff v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
