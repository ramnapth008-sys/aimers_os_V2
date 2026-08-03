import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

interface InstitutionTopbarProps {
  onOpenSidebar: () => void;
}

export function InstitutionTopbar({
  onOpenSidebar,
}: InstitutionTopbarProps) {
  return (
    <header className="institution-topbar">
      <div className="institution-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Institution Dashboard</h1>

          <p>
            Student, batch, teacher and
            outcome intelligence.
          </p>
        </div>
      </div>

      <button
        className="institution-search"
        type="button"
      >
        <Search size={16} />

        <span>
          Search students, batches, tests...
        </span>

        <kbd>⌘ K</kbd>
      </button>

      <div className="institution-topbar-actions">
        <span className="institution-security-status">
          <ShieldCheck size={15} />
          Secure workspace
        </span>

        <button
          className="institution-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>5</span>
        </button>

        <button
          className="institution-account"
          type="button"
        >
          <span>AD</span>

          <div>
            <strong>Institution Admin</strong>
            <small>Academic Director</small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
