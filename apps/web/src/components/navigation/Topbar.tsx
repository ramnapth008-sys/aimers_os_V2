import { ArrowUpRight, Command, Menu, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { allNavigation } from "../../data/navigation";

interface TopbarProps {
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
}

export function Topbar({ onOpenSidebar, sidebarOpen }: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const pageName =
    allNavigation.find((item) => item.path === location.pathname)?.label ??
    "Your workspace";
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? allNavigation.filter((item) =>
          `${item.label} ${item.keywords ?? ""}`
            .toLowerCase()
            .includes(normalized),
        )
      : allNavigation;
  }, [query]);
  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);
  useEffect(() => {
    if (searchOpen) {
      dialogRef.current?.showModal();
      searchInputRef.current?.focus();
    } else {
      dialogRef.current?.close();
      setQuery("");
    }
  }, [searchOpen]);

  return (
    <>
      <header className="aimers-topbar">
        <div className="topbar-greeting">
          <button
            className="mobile-menu-button"
            type="button"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
            aria-controls="student-navigation"
            onClick={onOpenSidebar}
          >
            <Menu size={21} />
          </button>
          <div>
            <small>YOUR LEARNING SPACE</small>
            <strong>{pageName}</strong>
          </div>
        </div>
        <button
          className="topbar-search"
          type="button"
          aria-label="Search tools"
          onClick={() => setSearchOpen(true)}
        >
          <Search size={17} />
          <span>Find a tool or workspace</span>
          <kbd>
            <Command size={12} /> K
          </kbd>
        </button>
        <div className="topbar-actions">
          <button
            className="student-mobile-search"
            type="button"
            aria-label="Search tools"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={19} />
          </button>
          <Link className="ask-aimers-button" to="/ai-mentor">
            <Sparkles size={17} />
            <span>Talk to Aimers</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>
      <dialog
        ref={dialogRef}
        className="student-search-dialog"
        aria-labelledby="student-search-title"
        onCancel={() => setSearchOpen(false)}
        onClose={() => setSearchOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSearchOpen(false);
        }}
      >
        <header>
          <Search size={19} />
          <input
            ref={searchInputRef}
            value={query}
            aria-label="Search all student tools"
            placeholder="What would you like to do?"
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setSearchOpen(false)}
          >
            <X size={19} />
          </button>
        </header>
        <div className="command-results">
          <p id="student-search-title">All your tools, in one place</p>
          {results.length === 0 ? (
            <div className="command-empty">No tools match that search.</div>
          ) : (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setSearchOpen(false);
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  <ArrowUpRight size={14} />
                </button>
              );
            })
          )}
        </div>
      </dialog>
    </>
  );
}
