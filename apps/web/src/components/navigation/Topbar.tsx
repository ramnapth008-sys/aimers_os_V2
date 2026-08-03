import {
  Bell,
  Bot,
  CalendarDays,
  Command,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { allNavigation } from "../../data/navigation";

interface TopbarProps {
  onOpenSidebar: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good Morning";
  }

  if (hour < 17) {
    return "Good Afternoon";
  }

  return "Good Evening";
}

export function Topbar({
  onOpenSidebar,
}: TopbarProps) {
  const navigate = useNavigate();

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  const [query, setQuery] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [focusMode, setFocusMode] =
    useState(false);

  useEffect(() => {
    function handleKeyboard(
      event: KeyboardEvent,
    ) {
      if (
        (event.metaKey ||
          event.ctrlKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);

        window.setTimeout(() => {
          searchInputRef.current?.focus();
        }, 0);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyboard,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyboard,
      );
    };
  }, []);

  const results = useMemo(() => {
    const normalized =
      query.trim().toLowerCase();

    if (!normalized) {
      return allNavigation.slice(0, 6);
    }

    return allNavigation.filter(
      (item) =>
        item.label
          .toLowerCase()
          .includes(normalized),
    );
  }, [query]);

  function openResult(path: string) {
    navigate(path);
    setQuery("");
    setSearchOpen(false);
  }

  return (
    <>
      <header className="aimers-topbar">
        <div className="topbar-greeting">
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Open navigation"
            onClick={onOpenSidebar}
          >
            <Menu size={21} />
          </button>

          <div>
            <h1>
              {getGreeting()}, Ram{" "}
              <span>👋</span>
            </h1>

            <p>
              “Discipline today, Doctor
              tomorrow.”
            </p>
          </div>
        </div>

        <button
          className="topbar-search"
          type="button"
          onClick={() => {
            setSearchOpen(true);

            window.setTimeout(() => {
              searchInputRef.current?.focus();
            }, 0);
          }}
        >
          <Search size={17} />

          <span>Search anything...</span>

          <kbd>
            <Command size={12} /> K
          </kbd>
        </button>

        <div className="topbar-actions">
          <button
            className={
              focusMode
                ? "focus-toggle active"
                : "focus-toggle"
            }
            type="button"
            onClick={() =>
              setFocusMode(
                (current) => !current,
              )
            }
          >
            <ShieldCheck size={16} />

            <span>Focus Mode</span>

            <i>
              <b />
            </i>
          </button>

          <button
            className="topbar-icon-button"
            type="button"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span>2</span>
          </button>

          <button
            className="topbar-icon-button"
            type="button"
            aria-label="Calendar"
            onClick={() =>
              navigate("/calendar")
            }
          >
            <CalendarDays size={18} />
          </button>

          <button
            className="ask-aimers-button"
            type="button"
            onClick={() =>
              navigate("/ai-mentor")
            }
          >
            <Bot size={18} />

            <span>Ask AIMERS</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div
          className="command-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSearchOpen(false);
            }
          }}
        >
          <section
            className="command-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search AIMERS OS"
          >
            <header>
              <Search size={19} />

              <input
                ref={searchInputRef}
                value={query}
                placeholder="Search AIMERS OS..."
                onChange={(event) =>
                  setQuery(
                    event.target.value,
                  )
                }
              />

              <kbd>ESC</kbd>
            </header>

            <div className="command-results">
              <p>Navigate to</p>

              {results.length === 0 ? (
                <div className="command-empty">
                  No modules found.
                </div>
              ) : (
                results.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() =>
                        openResult(
                          item.path,
                        )
                      }
                    >
                      <Icon size={17} />
                      <span>
                        {item.label}
                      </span>
                      <small>Open</small>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
