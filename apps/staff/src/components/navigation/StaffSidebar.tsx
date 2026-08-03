import {
  Brain,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { staffNavigation } from "../../data/navigation";

interface StaffSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function StaffSidebar({
  open,
  onClose,
}: StaffSidebarProps) {
  return (
    <>
      <button
        className={
          open
            ? "staff-sidebar-backdrop visible"
            : "staff-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "staff-sidebar open"
            : "staff-sidebar"
        }
      >
        <header className="staff-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Mentor Intelligence
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

        <section className="staff-access-card">
          <span>
            <ShieldCheck size={15} />
          </span>

          <div>
            <small>
              AUTHORISED ACCESS
            </small>

            <strong>
              Assigned students only
            </strong>
          </div>

          <i>LIVE</i>
        </section>

        <nav className="staff-navigation">
          {staffNavigation.map((group) => (
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
                        ? "staff-nav-link active"
                        : "staff-nav-link"
                    }
                    onClick={onClose}
                  >
                    <Icon size={16} />

                    <span>{item.label}</span>

                    <i />
                  </NavLink>
                );
              })}
            </section>
          ))}
        </nav>

        <footer className="staff-profile">
          <div className="staff-avatar">
            AM
          </div>

          <div>
            <strong>
              Anjali Menon
            </strong>

            <small>
              Senior Academic Mentor
            </small>
          </div>

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
