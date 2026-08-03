import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

interface StaffTopbarProps {
  onOpenSidebar: () => void;
}

export function StaffTopbar({
  onOpenSidebar,
}: StaffTopbarProps) {
  return (
    <header className="staff-topbar">
      <div className="staff-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Mentor Dashboard</h1>

          <p>
            Assigned learner progress,
            alerts and interventions.
          </p>
        </div>
      </div>

      <button
        className="staff-search"
        type="button"
      >
        <Search size={16} />

        <span>
          Search assigned students...
        </span>

        <kbd>⌘ K</kbd>
      </button>

      <div className="staff-topbar-actions">
        <span className="staff-security-status">
          <ShieldCheck size={15} />
          Access logged
        </span>

        <button
          className="staff-topbar-icon"
          type="button"
          aria-label="Calendar"
        >
          <CalendarDays size={17} />
        </button>

        <button
          className="staff-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>7</span>
        </button>

        <button
          className="staff-account"
          type="button"
        >
          <span>AM</span>

          <div>
            <strong>
              Anjali Menon
            </strong>

            <small>
              Senior Mentor
            </small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
