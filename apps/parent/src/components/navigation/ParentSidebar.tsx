import {
  Brain,
  LogOut,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import { parentNavigation } from "../../data/navigation";

interface ParentSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ParentSidebar({
  open,
  onClose,
}: ParentSidebarProps) {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem(
      "aimers_parent_session",
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
            ? "parent-sidebar-backdrop visible"
            : "parent-sidebar-backdrop"
        }
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
      />

      <aside
        className={
          open
            ? "parent-sidebar open"
            : "parent-sidebar"
        }
      >
        <header className="parent-brand">
          <span>
            <Brain size={25} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>Parent Portal</small>
          </div>

          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <section className="parent-child-card">
          <div className="parent-child-avatar">
            RN
          </div>

          <div>
            <small>VIEWING PROGRESS FOR</small>
            <strong>Ram N.</strong>
            <span>NEET 2027 Aspirant</span>
          </div>
        </section>

        <nav className="parent-navigation">
          {parentNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "parent-nav-link active"
                    : "parent-nav-link"
                }
                onClick={onClose}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                <i />
              </NavLink>
            );
          })}
        </nav>

        <section className="parent-privacy-card">
          <ShieldCheck size={17} />

          <div>
            <strong>Respectful reporting</strong>

            <p>
              Parents receive progress summaries,
              not private messages, raw browsing
              history or sensitive student data.
            </p>
          </div>
        </section>

        <footer className="parent-profile">
          <div className="parent-profile-avatar">
            AN
          </div>

          <div>
            <strong>Account Parent</strong>
            <small>Verified guardian</small>
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
