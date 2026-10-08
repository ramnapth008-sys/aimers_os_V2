import {
  ArrowUpRight,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@aimers/auth";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  navigationGroups,
  primaryNavigation,
  secondaryNavigation,
  type NavigationItem,
} from "../../data/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [compact, setCompact] = useState(
    () => window.matchMedia("(max-width: 1180px)").matches,
  );
  const closeRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const profileName =
    user?.displayName?.trim() || user?.firstName?.trim() || "Student";
  const initials = profileName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1180px)");
    const update = () => {
      setCompact(media.matches);
      if (!media.matches) onClose();
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = Array.from(
        asideRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not(:disabled), summary",
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  function renderLink(item: NavigationItem) {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        end
        to={item.path}
        onClick={onClose}
        className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </NavLink>
    );
  }

  return (
    <>
      {isOpen && (
        <button
          className="sidebar-backdrop visible"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        ref={asideRef}
        id="student-navigation"
        className={`aimers-sidebar${isOpen ? " open" : ""}`}
        aria-label="Main navigation"
        inert={compact && !isOpen}
        aria-hidden={compact && !isOpen}
        role={compact && isOpen ? "dialog" : undefined}
        aria-modal={compact && isOpen ? true : undefined}
      >
        <header className="sidebar-brand">
          <Link
            className="sidebar-brand-mark"
            to="/dashboard"
            aria-label="Aimers home"
            onClick={onClose}
          >
            a
          </Link>
          <div>
            <strong>
              aimers<span> / os</span>
            </strong>
            <small>Your next step, clearer.</small>
          </div>
          <button
            ref={closeRef}
            className="sidebar-close-button"
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>
        <nav className="sidebar-navigation" aria-label="Student tools">
          <p className="sidebar-section-label">YOUR SPACE</p>
          {primaryNavigation.map(renderLink)}
          <div className="sidebar-divider" />
          {navigationGroups.map((group) => (
            <details
              key={`${group.label}-${location.pathname}`}
              className="sidebar-tool-group"
              open={group.items.some(
                (item) =>
                  location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`),
              )}
            >
              <summary>
                {group.label}
                <ChevronDown size={15} />
              </summary>
              <div>{group.items.map(renderLink)}</div>
            </details>
          ))}
          <div className="sidebar-divider" />
          {secondaryNavigation.map(renderLink)}
        </nav>
        <Link
          className="sidebar-companion-card"
          to="/ai-mentor"
          onClick={onClose}
        >
          <Sparkles size={19} />
          <strong>A little help, anytime.</strong>
          <span>Work through a doubt or find your next step.</span>
          <small>
            Meet your companion <ArrowUpRight size={14} />
          </small>
        </Link>
        <footer className="sidebar-profile">
          <NavLink className="profile-row" to="/profile" onClick={onClose}>
            <div className="profile-avatar">{initials || "S"}</div>
            <div>
              <strong>{profileName}</strong>
              <small>Your learning profile</small>
            </div>
          </NavLink>
          <button
            className="student-logout"
            type="button"
            disabled={loggingOut}
            aria-label="Log out"
            onClick={async () => {
              setLoggingOut(true);
              try {
                await logout();
                onClose();
              } finally {
                setLoggingOut(false);
              }
            }}
          >
            {loggingOut ? (
              <LoaderCircle className="sidebar-logout-spinner" size={17} />
            ) : (
              <LogOut size={17} />
            )}
          </button>
        </footer>
      </aside>
    </>
  );
}
