import {
  Bell,
  CalendarDays,
  ChevronDown,
  Menu,
  ShieldCheck,
} from "lucide-react";

interface ParentTopbarProps {
  onOpenSidebar: () => void;
}

export function ParentTopbar({
  onOpenSidebar,
}: ParentTopbarProps) {
  return (
    <header className="parent-topbar">
      <div className="parent-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Parent Dashboard</h1>

          <p>
            Support progress with clear,
            respectful academic insights.
          </p>
        </div>
      </div>

      <div className="parent-topbar-status">
        <ShieldCheck size={15} />

        <span>
          Privacy controls active
        </span>
      </div>

      <div className="parent-topbar-actions">
        <button
          className="parent-topbar-icon"
          type="button"
          aria-label="Calendar"
        >
          <CalendarDays size={17} />
        </button>

        <button
          className="parent-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>3</span>
        </button>

        <button
          className="parent-account"
          type="button"
        >
          <span>AN</span>

          <div>
            <strong>Parent Account</strong>
            <small>Verified guardian</small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
