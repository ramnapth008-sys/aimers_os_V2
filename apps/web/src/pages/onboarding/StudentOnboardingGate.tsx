import {
  useAuth,
} from "@aimers/auth";

import {
  AlertTriangle,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  AppShell,
} from "../../app/shell/AppShell";

import {
  getStudentOnboardingStatus,
} from "./onboarding.service";

type GateStatus =
  | "loading"
  | "complete"
  | "incomplete"
  | "error";

export function StudentOnboardingGate() {
  const {
    apiFetch,
  } = useAuth();

  const [
    status,
    setStatus,
  ] = useState<GateStatus>(
    "loading",
  );

  const [
    error,
    setError,
  ] = useState("");

  const checkStatus =
    useCallback(async () => {
      setStatus("loading");
      setError("");

      try {
        const result =
          await getStudentOnboardingStatus(
            apiFetch,
          );

        setStatus(
          result.completed
            ? "complete"
            : "incomplete",
        );
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load onboarding status.",
        );

        setStatus("error");
      }
    }, [apiFetch]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  if (status === "complete") {
    return <AppShell />;
  }

  if (status === "incomplete") {
    return (
      <Navigate
        replace
        to="/onboarding"
      />
    );
  }

  if (status === "error") {
    return (
      <main className="onboarding-state-page">
        <section className="onboarding-state-card">
          <AlertTriangle size={27} />

          <h1>
            We could not load your profile
          </h1>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => {
              void checkStatus();
            }}
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-state-page">
      <section className="onboarding-state-card">
        <LoaderCircle
          className="onboarding-spinner"
          size={29}
        />

        <h1>
          Preparing your learning system
        </h1>

        <p>
          Checking your AIMERS student
          profile…
        </p>
      </section>
    </main>
  );
}
