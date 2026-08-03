import {
  Brain,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
} from "react-router-dom";

const navigation = [
  {
    label: "Features",
    path: "/features",
  },
  {
    label: "How It Works",
    path: "/how-it-works",
  },
  {
    label: "Students",
    path: "/students",
  },
  {
    label: "Parents",
    path: "/parents",
  },
  {
    label: "Institutions",
    path: "/institutions",
  },
  {
    label: "Pricing",
    path: "/pricing",
  },
  {
    label: "Security",
    path: "/security",
  },
];

export function MarketingHeader() {
  const location = useLocation();

  const [menuOpen, setMenuOpen] =
    useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="marketing-header">
      <Link
        className="marketing-brand"
        to="/"
      >
        <span>
          <Brain size={27} />
        </span>

        <div>
          <strong>
            AIMERS <i>OS</i>
          </strong>

          <small>
            Your AI Education OS
          </small>
        </div>
      </Link>

      <nav
        className={
          menuOpen
            ? "marketing-navigation open"
            : "marketing-navigation"
        }
      >
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="mobile-auth-actions">
          <Link to="/login">
            Sign in
          </Link>

          <Link
            className="marketing-primary-button"
            to="/register"
          >
            Start free
          </Link>
        </div>
      </nav>

      <div className="marketing-header-actions">
        <Link
          className="marketing-login-link"
          to="/login"
        >
          Sign in
        </Link>

        <Link
          className="marketing-primary-button"
          to="/register"
        >
          <Sparkles size={15} />
          Start free
        </Link>

        <button
          className="marketing-menu-button"
          type="button"
          aria-label={
            menuOpen
              ? "Close menu"
              : "Open menu"
          }
          onClick={() =>
            setMenuOpen(
              (current) => !current,
            )
          }
        >
          {menuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>
      </div>
    </header>
  );
}
