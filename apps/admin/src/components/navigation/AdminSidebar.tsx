import {
  Brain,
  LogOut,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import { adminNavigation } from "../../data/navigation";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({
  open,
  onClose,
}: AdminSidebarProps) {
  const location = useLocation();

  return (
    <>
      <button
        className={
          open
            ? "admin-sidebar-backdrop visible"
            : "admin-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "admin-sidebar open"
            : "admin-sidebar"
        }
      >
        <header className="admin-sidebar-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Company Intelligence
            </small>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <section className="admin-role-card">
          <div>
            <ShieldCheck size={15} />
          </div>

          <span>
            <small>ACTIVE WORKSPACE</small>
            <strong>
              CEO Command Centre
            </strong>
          </span>

          <i>LIVE</i>
        </section>

        <nav className="admin-sidebar-navigation">
          {adminNavigation.map((group) => (
            <section key={group.label}>
              <h2>{group.label}</h2>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      isActive
                        ? "admin-sidebar-link active"
                        : "admin-sidebar-link"
                    }
                    onClick={onClose}
                  >
                    <Icon size={16} />

                    <span>{item.label}</span>

                    {location.pathname ===
                      item.path && <i />}
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>

        <footer className="admin-sidebar-profile">
          <div className="admin-profile-avatar">
            RN
          </div>

          <div>
            <strong>Ram N.</strong>
            <small>
              Founder & CEO
            </small>
          </div>

          <NavLink
            to="/settings"
            aria-label="Settings"
          >
            <Settings size={15} />
          </NavLink>

          <button
            type="button"
            aria-label="Log out"
          >
            <LogOut size={15} />
          </button>
        </footer>
      </aside>
    </>
  );
}
