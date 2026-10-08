import {
  Bell,
  Brain,
  LoaderCircle,
  Power,
  Settings,
  X,
} from "lucide-react";

import {
  useAuth,
} from "@aimers/auth";

import {
  useState,
} from "react";

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

  const mainItems = [
    { path: "/dashboard", label: "Home" },
    { path: "/subjects", label: "Learn" },
    { path: "/question-bank", label: "Practice" },
    { path: "/analytics", label: "My Progress" },
    { path: "/ai-mentor", label: "AI Mentor" },
  ];

  const extraGroups = [
    { title: "Study tools", paths: ["/planner", "/mock-tests", "/flashcards", "/notes", "/memory-engine"] },
    { title: "Explore", paths: ["/research-ai", "/community", "/achievements"] },
    { title: "Advanced insights", paths: ["/prediction", "/behavior-ai", "/digital-activity"] },
  ];

  const {
    logout,
    user,
  } = useAuth();

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(
    false,
  );

  const profileName =
    user?.displayName
      ?.trim() ||
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.email ||
    "AIMERS Student";

  const profileInitials =
    profileName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase(),
      )
      .join("") ||
    "AS";

  const handleLogout =
    async () => {
      if (loggingOut) {
        return;
      }

      setLoggingOut(
        true,
      );

      onClose();

      try {
        await logout();
      } finally {
        setLoggingOut(
          false,
        );
      }
    };

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
          <p className="sidebar-section-label">YOUR WORKSPACE</p>
          {mainItems.map(({ path, label }) => {
            const item = primaryNavigation.find((candidate) => candidate.path === path);
            if (!item) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={path}
                to={path}
                end
                className={({ isActive }) =>
                  isActive ? "sidebar-link active" : "sidebar-link"
                }
                onClick={onClose}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                {location.pathname === path && <i aria-hidden="true" />}
              </NavLink>
            );
          })}

          <div className="sidebar-divider" />
          <p className="sidebar-section-label">MORE TO EXPLORE</p>
          {extraGroups.map((group) => {
            const activeInGroup = group.paths.some(
              (path) => location.pathname === path || location.pathname.startsWith(path + "/")
            );
            return (
              <details className="sidebar-nav-group" key={group.title} open={activeInGroup}>
                <summary>{group.title}</summary>
                <div className="sidebar-nav-group-links">
                  {group.paths.map((path) => {
                    const item = primaryNavigation.find((candidate) => candidate.path === path);
                    if (!item) return null;
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                          isActive ? "sidebar-link active" : "sidebar-link"
                        }
                        onClick={onClose}
                      >
                        <Icon size={17} aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </details>
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
          <NavLink
            className="profile-row"
            to="/profile"
            aria-label="Open student profile"
            onClick={onClose}
          >
            <div className="profile-avatar">
              {profileInitials}
            </div>

            <div>
              <strong>
                {profileName}
              </strong>

              <small>
                Student profile
              </small>
            </div>

            <span>PRO</span>
          </NavLink>

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
              className="profile-logout-button"
              type="button"
              disabled={loggingOut}
              aria-busy={loggingOut}
              aria-label={
                loggingOut
                  ? "Logging out"
                  : "Log out"
              }
              title="Log out"
              onClick={() => {
                void handleLogout();
              }}
            >
              {loggingOut
                ? (
                  <LoaderCircle
                    className="sidebar-logout-spinner"
                    size={16}
                  />
                )
                : <Power size={16} />}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
