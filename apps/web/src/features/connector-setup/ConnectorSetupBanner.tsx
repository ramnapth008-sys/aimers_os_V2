import {
  useAuth,
} from "@aimers/auth";

import {
  ChevronRight,
  Link2,
  LoaderCircle,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  getConnectorSetupWorkspace,
  type ConnectorSetupWorkspace,
} from "../../pages/integrations";

import "./connector-setup-banner.css";

export function ConnectorSetupBanner() {
  const {
    apiFetch,
    status,
  } = useAuth();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    workspace,
    setWorkspace,
  ] = useState<
    ConnectorSetupWorkspace |
    null
  >(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );

  const [
    dismissed,
    setDismissed,
  ] = useState(
    false,
  );

  const load =
    useCallback(
      async () => {
        if (
          status !==
          "authenticated"
        ) {
          return;
        }

        try {
          const next =
            await getConnectorSetupWorkspace(
              apiFetch,
            );

          setWorkspace(
            next,
          );
        } catch {
          setWorkspace(
            null,
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        apiFetch,
        status,
      ],
    );

  useEffect(() => {
    void load();

    const handleUpdate =
      () => {
        setDismissed(
          false,
        );
        void load();
      };

    window.addEventListener(
      "aimers:connector-setup-updated",
      handleUpdate,
    );

    window.addEventListener(
      "aimers:intelligence-settings-updated",
      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        "aimers:connector-setup-updated",
        handleUpdate,
      );

      window.removeEventListener(
        "aimers:intelligence-settings-updated",
        handleUpdate,
      );
    };
  }, [load]);

  if (
    location.pathname ===
      "/integrations" ||
    dismissed ||
    !workspace ||
    workspace
      .summary
      .setupComplete
  ) {
    return null;
  }

  return (
    <section className="connector-setup-banner">
      <span>
        {loading
          ? (
            <LoaderCircle
              className="connector-banner-spin"
              size={20}
            />
          )
          : <Link2 size={20} />}
      </span>

      <div>
        <small>
          CONNECTION SETUP
        </small>

        <strong>
          {workspace
            .summary
            .connected}
          {" of "}
          {workspace
            .summary
            .total}
          {" sources verified"}
        </strong>

        <p>
          Consent is granted. External sources remain
          queued until their real integration and mandatory
          platform approval are available.
        </p>
      </div>

      <button
        className="connector-banner-action"
        type="button"
        onClick={() =>
          navigate(
            "/integrations",
          )
        }
      >
        <ShieldCheck size={15} />
        Review integrations
        <ChevronRight size={15} />
      </button>

      <button
        className="connector-banner-dismiss"
        type="button"
        aria-label="Dismiss connection setup banner"
        onClick={() =>
          setDismissed(
            true,
          )
        }
      >
        <X size={15} />
      </button>
    </section>
  );
}
