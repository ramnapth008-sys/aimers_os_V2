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

import { InstitutionSidebar } from "../../components/navigation/InstitutionSidebar";
import { InstitutionTopbar } from "../../components/navigation/InstitutionTopbar";

export function InstitutionShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="institution-app-shell">
      <InstitutionSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="institution-main-column">
        <InstitutionTopbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="institution-page-content">
          <Outlet />
        </main>

        <footer className="institution-system-footer">
          <span>
            <CircleCheck size={13} />
            Institution systems operational
          </span>

          <span>
            <ShieldCheck size={13} />
            Role-based access active
          </span>

          <strong>
            AIMERS Institution v2.0.0
          </strong>
        </footer>
      </div>
    </div>
  );
}
