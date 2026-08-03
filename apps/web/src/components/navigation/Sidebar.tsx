import {
  Bell,
  Brain,
  Power,
  Settings,
  X,
} from "lucide-react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  primaryNavigation,
  secondaryNavigation,
} from "../../data/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const location = useLocation();

  return (
    <>
      <button
        className={
          isOpen
            ? "sidebar-backdrop visible"
            : "sidebar-backdrop"
        }
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          isOpen
            ? "aimers-sidebar open"
            : "aimers-sidebar"
        }
      >
        <header className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <Brain size={27} />
          </div>

          <div>
            <strong>
              AIMERS <span>OS</span>
            </strong>

            <small>
              Your AI Education OS
            </small>
          </div>

          <button
            className="sidebar-close-button"
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <nav className="sidebar-navigation">
          {primaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                onClick={onClose}
              >
                <Icon size={17} />

                <span>{item.label}</span>

                {location.pathname ===
                  item.path && (
                  <i />
                )}
              </NavLink>
            );
          })}

          <div className="sidebar-divider" />

          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
                onClick={onClose}
              >
                <Icon size={17} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <section className="sidebar-pro-card">
          <span>AIMERS PRO</span>

          <strong>
            Unlock your full potential
          </strong>

          <p>
            Advanced AI, analytics and
            unlimited learning intelligence.
          </p>

          <NavLink to="/subscription">
            Upgrade now
          </NavLink>
        </section>

        <footer className="sidebar-profile">
          <div className="profile-row">
            <div className="profile-avatar">
              RN
            </div>

            <div>
              <strong>Ram N.</strong>
              <small>
                NEET 2027 Aspirant
              </small>
            </div>

            <span>PRO</span>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              aria-label="Notifications"
            >
              <Bell size={16} />
            </button>

            <NavLink
              to="/settings"
              aria-label="Settings"
            >
              <Settings size={16} />
            </NavLink>

            <button
              type="button"
              aria-label="Log out"
            >
              <Power size={16} />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
