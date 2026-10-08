import { ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "../../components/navigation/Sidebar";
import { Topbar } from "../../components/navigation/Topbar";
import { primaryNavigation } from "../../data/navigation";
import { ConnectorSetupBanner } from "../../features/connector-setup";
import { AimersWebCollector } from "../../features/digital-intelligence";

export function AppShell() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);
  return (
    <div className="aimers-app-shell student-shell">
      <AimersWebCollector />
      <a className="student-skip-link" href="#student-main">
        Skip to learning
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="aimers-main-column">
        <Topbar
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <ConnectorSetupBanner />
        <main id="student-main" tabIndex={-1} className="aimers-page-content">
          <Outlet />
        </main>
        <footer className="aimers-system-footer">
          <Link to="/settings">
            <ShieldCheck size={14} /> Your data, your choice.
          </Link>
          <span>Learn a little. Build something lasting.</span>
          <Link to="/help-support">Help & feedback</Link>
        </footer>
      </div>
      <nav className="student-bottom-nav" aria-label="Everyday navigation">
        {primaryNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              end
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={20} />
              <span>{item.label === "Companion" ? "Chat" : item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
