import {
  Brain,
  Building2,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { institutionNavigation } from "../../data/navigation";

interface InstitutionSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function InstitutionSidebar({
  open,
  onClose,
}: InstitutionSidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem(
      "aimers_institution_session",
    );

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <>
      <button
        className={
          open
            ? "institution-sidebar-backdrop visible"
            : "institution-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "institution-sidebar open"
            : "institution-sidebar"
        }
      >
        <header className="institution-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Institution Intelligence
            </small>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <section className="institution-workspace-card">
          <span>
            <Building2 size={16} />
          </span>

          <div>
            <small>ACTIVE INSTITUTION</small>
            <strong>AIMERS Academy</strong>
            <p>Trivandrum Campus</p>
          </div>
        </section>

        <nav className="institution-navigation">
          {institutionNavigation.map(
            (item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    isActive
                      ? "institution-nav-link active"
                      : "institution-nav-link"
                  }
                  onClick={onClose}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  <i />
                </NavLink>
              );
            },
          )}
        </nav>

        <section className="institution-security-card">
          <ShieldCheck size={17} />

          <div>
            <strong>
              Role-based access
            </strong>

            <p>
              Student and staff information is
              restricted by institution role.
            </p>
          </div>
        </section>

        <footer className="institution-profile">
          <div className="institution-avatar">
            AD
          </div>

          <div>
            <strong>Institution Admin</strong>
            <small>Academic Director</small>
          </div>

          <button
            type="button"
            aria-label="Log out"
            onClick={handleLogout}
          >
            <LogOut size={15} />
          </button>
        </footer>
      </aside>
    </>
  );
}
