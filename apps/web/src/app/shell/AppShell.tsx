import {
  MessageSquareText,
  Radio,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
} from "react-router-dom";

import { Sidebar } from "../../components/navigation/Sidebar";
import { Topbar } from "../../components/navigation/Topbar";

export function AppShell() {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="aimers-app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="aimers-main-column">
        <Topbar
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <main className="aimers-page-content">
          <Outlet />
        </main>

        <footer className="aimers-system-footer">
          <div>
            <span />
            System Status
            <strong>
              All Systems Operational
            </strong>
          </div>

          <blockquote>
            “The expert in anything was once a
            beginner.”
          </blockquote>

          <nav>
            <button type="button">
              <MessageSquareText size={13} />
              Feedback
            </button>

            <button type="button">
              <Radio size={13} />
              Support
            </button>

            <span>v2.0.0</span>
          </nav>
        </footer>
      </div>
    </div>
  );
}
