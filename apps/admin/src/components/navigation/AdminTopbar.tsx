import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

import { useState } from "react";

interface AdminTopbarProps {
  onOpenSidebar: () => void;
}

export function AdminTopbar({
  onOpenSidebar,
}: AdminTopbarProps) {
  const [environment, setEnvironment] =
    useState("Production");

  return (
    <header className="admin-topbar">
      <div className="admin-topbar-title">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={20} />
        </button>

        <div>
          <h1>Company Overview</h1>

          <p>
            Real-time business, learner and
            system intelligence.
          </p>
        </div>
      </div>

      <button
        className="admin-global-search"
        type="button"
      >
        <Search size={16} />
        <span>
          Search students, customers, reports...
        </span>
        <kbd>⌘ K</kbd>
      </button>

      <div className="admin-topbar-actions">
        <button
          className="environment-selector"
          type="button"
          onClick={() =>
            setEnvironment((current) =>
              current === "Production"
                ? "Staging"
                : "Production",
            )
          }
        >
          <span />
          {environment}
          <ChevronDown size={13} />
        </button>

        <button
          className="admin-topbar-icon"
          type="button"
          aria-label="Security status"
        >
          <ShieldCheck size={17} />
        </button>

        <button
          className="admin-topbar-icon"
          type="button"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span>4</span>
        </button>

        <button
          className="admin-account-button"
          type="button"
        >
          <span>RN</span>

          <div>
            <strong>Ram N.</strong>
            <small>Founder & CEO</small>
          </div>

          <ChevronDown size={13} />
        </button>
      </div>
    </header>
  );
}
