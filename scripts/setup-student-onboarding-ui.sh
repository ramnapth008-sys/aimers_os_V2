#!/usr/bin/env bash

set -euo pipefail

echo "Creating AIMERS student onboarding interface..."

mkdir -p apps/web/src/pages/onboarding

# ============================================================
# TYPES
# ============================================================

cat > apps/web/src/pages/onboarding/onboarding.types.ts <<'EOF'
export interface StudentOnboardingProfile {
  id: string;
  examTarget: string | null;
  targetYear: number | null;
  dateOfBirth: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };
}

export interface StudentOnboardingStatus {
  completed: boolean;
  profile: StudentOnboardingProfile | null;
}

export interface StudentOnboardingInput {
  examTarget: string;
  targetYear: number;
  dateOfBirth?: string;
}

export interface StudentOnboardingResult {
  success: boolean;
  message: string;

  organization: {
    id: string;
    name: string;
    slug: string;
    type: string;
  };

  profile: StudentOnboardingProfile;

  membership: {
    role: string;
    status: string;
    joinedAt: string | null;
  };
}

export type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
) => Promise<T>;
EOF

# ============================================================
# SERVICE
# ============================================================

cat > apps/web/src/pages/onboarding/onboarding.service.ts <<'EOF'
import type {
  ApiFetch,
  StudentOnboardingInput,
  StudentOnboardingResult,
  StudentOnboardingStatus,
} from "./onboarding.types";

export function getStudentOnboardingStatus(
  apiFetch: ApiFetch,
): Promise<StudentOnboardingStatus> {
  return apiFetch<StudentOnboardingStatus>(
    "/onboarding/status",
  );
}

export function completeStudentOnboarding(
  apiFetch: ApiFetch,
  input: StudentOnboardingInput,
): Promise<StudentOnboardingResult> {
  return apiFetch<StudentOnboardingResult>(
    "/onboarding/student",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
EOF

# ============================================================
# ONBOARDING ROUTE GATE
# ============================================================

cat > apps/web/src/pages/onboarding/StudentOnboardingGate.tsx <<'EOF'
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
EOF

# ============================================================
# ONBOARDING PAGE
# ============================================================

cat > apps/web/src/pages/onboarding/StudentOnboardingPage.tsx <<'EOF'
import {
  useAuth,
} from "@aimers/auth";

import {
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  GraduationCap,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  completeStudentOnboarding,
  getStudentOnboardingStatus,
} from "./onboarding.service";

import "./onboarding.css";

const examTargets = [
  {
    value: "NEET",
    label: "NEET",
    description:
      "Medical entrance preparation",
  },
  {
    value: "JEE MAIN",
    label: "JEE Main",
    description:
      "Engineering entrance preparation",
  },
  {
    value: "JEE ADVANCED",
    label: "JEE Advanced",
    description:
      "Advanced engineering preparation",
  },
  {
    value: "KEAM",
    label: "KEAM",
    description:
      "Kerala engineering and medical entrance",
  },
  {
    value: "CUET",
    label: "CUET",
    description:
      "Central university entrance preparation",
  },
  {
    value: "OTHER",
    label: "Other",
    description:
      "Build a custom learning system",
  },
];

const currentYear =
  new Date().getFullYear();

export function StudentOnboardingPage() {
  const navigate =
    useNavigate();

  const {
    apiFetch,
    user,
  } = useAuth();

  const [
    examTarget,
    setExamTarget,
  ] = useState("NEET");

  const [
    targetYear,
    setTargetYear,
  ] = useState(
    Math.max(
      currentYear,
      2027,
    ),
  );

  const [
    dateOfBirth,
    setDateOfBirth,
  ] = useState("");

  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadExistingProfile() {
      try {
        const result =
          await getStudentOnboardingStatus(
            apiFetch,
          );

        if (
          !active ||
          !result.profile
        ) {
          return;
        }

        if (
          result.profile.examTarget
        ) {
          setExamTarget(
            result.profile.examTarget,
          );
        }

        if (
          result.profile.targetYear
        ) {
          setTargetYear(
            result.profile.targetYear,
          );
        }

        if (
          result.profile.dateOfBirth
        ) {
          setDateOfBirth(
            result.profile.dateOfBirth
              .slice(0, 10),
          );
        }
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    void loadExistingProfile();

    return () => {
      active = false;
    };
  }, [apiFetch]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      await completeStudentOnboarding(
        apiFetch,
        {
          examTarget,
          targetYear,

          ...(dateOfBirth
            ? {
                dateOfBirth,
              }
            : {}),
        },
      );

      navigate(
        "/dashboard",
        {
          replace: true,
        },
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save your learning profile.",
      );

      setSubmitting(false);
    }
  }

  return (
    <main className="student-onboarding-page">
      <section className="student-onboarding-visual">
        <header className="onboarding-brand">
          <span>
            <Brain size={27} />
          </span>

          <div>
            <strong>
              AIMERS <i>OS</i>
            </strong>

            <small>
              Personal Learning Intelligence
            </small>
          </div>
        </header>

        <div className="onboarding-visual-content">
          <span className="onboarding-eyebrow">
            BUILD YOUR LEARNING SYSTEM
          </span>

          <h1>
            Let AIMERS understand where
            you are going.
          </h1>

          <p>
            Your target helps AIMERS organise
            subjects, planning, revision,
            assessments and future AI
            recommendations around your goal.
          </p>

          <div className="onboarding-benefit-list">
            <article>
              <Target size={18} />

              <div>
                <strong>
                  Goal-aware planning
                </strong>

                <span>
                  Plans and milestones shaped
                  around your target exam.
                </span>
              </div>
            </article>

            <article>
              <Sparkles size={18} />

              <div>
                <strong>
                  Personalised intelligence
                </strong>

                <span>
                  Future recommendations based
                  on your learning journey.
                </span>
              </div>
            </article>

            <article>
              <ShieldCheck size={18} />

              <div>
                <strong>
                  Private by design
                </strong>

                <span>
                  Your learning profile is
                  protected by your account.
                </span>
              </div>
            </article>
          </div>
        </div>

        <footer>
          Signed in as
          <strong>
            {user?.email}
          </strong>
        </footer>
      </section>

      <section className="student-onboarding-form-panel">
        <form
          className="student-onboarding-form"
          onSubmit={handleSubmit}
        >
          <header>
            <span>
              STUDENT PROFILE SETUP
            </span>

            <h2>
              What are you preparing for?
            </h2>

            <p>
              You can update these details
              later from Settings.
            </p>
          </header>

          {loadingProfile ? (
            <div className="onboarding-profile-loader">
              <LoaderCircle
                className="onboarding-spinner"
                size={24}
              />

              Loading your profile…
            </div>
          ) : (
            <>
              <fieldset>
                <legend>
                  Select your primary target
                </legend>

                <div className="exam-target-grid">
                  {examTargets.map(
                    (target) => {
                      const selected =
                        examTarget ===
                        target.value;

                      return (
                        <button
                          key={target.value}
                          className={
                            selected
                              ? "exam-target-card is-selected"
                              : "exam-target-card"
                          }
                          type="button"
                          onClick={() =>
                            setExamTarget(
                              target.value,
                            )
                          }
                        >
                          <span>
                            <GraduationCap
                              size={19}
                            />
                          </span>

                          <div>
                            <strong>
                              {target.label}
                            </strong>

                            <small>
                              {
                                target.description
                              }
                            </small>
                          </div>

                          {selected && (
                            <Check
                              className="exam-target-check"
                              size={17}
                            />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              </fieldset>

              <div className="onboarding-fields">
                <label>
                  <span>
                    Target examination year
                  </span>

                  <div>
                    <CalendarDays size={17} />

                    <input
                      required
                      max={2100}
                      min={currentYear}
                      type="number"
                      value={targetYear}
                      onChange={(event) =>
                        setTargetYear(
                          Number(
                            event.target
                              .value,
                          ),
                        )
                      }
                    />
                  </div>
                </label>

                <label>
                  <span>
                    Date of birth
                    <small>Optional</small>
                  </span>

                  <div>
                    <CalendarDays size={17} />

                    <input
                      max={
                        new Date()
                          .toISOString()
                          .slice(0, 10)
                      }
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) =>
                        setDateOfBirth(
                          event.target.value,
                        )
                      }
                    />
                  </div>
                </label>
              </div>
            </>
          )}

          {error && (
            <div
              className="onboarding-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            className="onboarding-submit-button"
            disabled={
              loadingProfile ||
              submitting
            }
            type="submit"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="onboarding-spinner"
                  size={17}
                />
                Creating your system…
              </>
            ) : (
              <>
                Save and open dashboard
                <ArrowRight size={17} />
              </>
            )}
          </button>

          <small className="onboarding-consent-note">
            This setup stores only the
            academic profile information
            shown above.
          </small>
        </form>
      </section>
    </main>
  );
}
EOF

# ============================================================
# STYLES
# ============================================================

cat > apps/web/src/pages/onboarding/onboarding.css <<'EOF'
.student-onboarding-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns:
    minmax(0, 1.08fr)
    minmax(460px, 0.92fr);
  color: #f7f8ff;
  background:
    radial-gradient(
      circle at 12% 12%,
      rgba(118, 83, 255, 0.25),
      transparent 34%
    ),
    radial-gradient(
      circle at 82% 88%,
      rgba(28, 127, 255, 0.17),
      transparent 35%
    ),
    #070914;
}

.student-onboarding-visual,
.student-onboarding-form-panel {
  min-height: 100vh;
  padding:
    clamp(30px, 5vw, 76px);
}

.student-onboarding-visual {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right:
    1px solid
    rgba(255, 255, 255, 0.07);
}

.onboarding-brand {
  display: flex;
  align-items: center;
  gap: 13px;
}

.onboarding-brand > span {
  width: 49px;
  height: 49px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background:
    linear-gradient(
      135deg,
      #7b5cff,
      #2787ff
    );
  box-shadow:
    0 18px 58px
    rgba(84, 72, 255, 0.34);
}

.onboarding-brand strong,
.onboarding-brand small {
  display: block;
}

.onboarding-brand i {
  color: #8f9aff;
  font-style: normal;
}

.onboarding-brand small {
  margin-top: 3px;
  color: #929ab4;
}

.onboarding-visual-content {
  max-width: 760px;
}

.onboarding-eyebrow,
.student-onboarding-form header > span {
  color: #929dff;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.17em;
}

.onboarding-visual-content h1 {
  max-width: 760px;
  margin: 20px 0;
  font-size:
    clamp(2.7rem, 5.5vw, 5.8rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.onboarding-visual-content > p {
  max-width: 680px;
  color: #a6aec8;
  font-size: 1.03rem;
  line-height: 1.75;
}

.onboarding-benefit-list {
  display: grid;
  gap: 12px;
  margin-top: 32px;
}

.onboarding-benefit-list article {
  max-width: 560px;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 16px 18px;
  border:
    1px solid
    rgba(139, 123, 255, 0.19);
  border-radius: 16px;
  background:
    rgba(15, 19, 40, 0.69);
  backdrop-filter: blur(18px);
}

.onboarding-benefit-list article > svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #9d8bff;
}

.onboarding-benefit-list strong,
.onboarding-benefit-list span {
  display: block;
}

.onboarding-benefit-list span {
  margin-top: 4px;
  color: #9199b3;
  line-height: 1.5;
}

.student-onboarding-visual footer {
  display: flex;
  gap: 7px;
  color: #7f879f;
  font-size: 0.82rem;
}

.student-onboarding-visual footer strong {
  color: #cdd2e6;
}

.student-onboarding-form-panel {
  display: grid;
  place-items: center;
  overflow-y: auto;
}

.student-onboarding-form {
  width: min(620px, 100%);
  display: grid;
  gap: 24px;
  padding:
    clamp(25px, 4vw, 40px);
  border:
    1px solid
    rgba(144, 123, 255, 0.2);
  border-radius: 25px;
  background:
    rgba(13, 16, 34, 0.84);
  box-shadow:
    0 30px 100px
    rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(25px);
}

.student-onboarding-form header h2 {
  margin: 10px 0 8px;
  font-size:
    clamp(1.7rem, 3vw, 2.35rem);
}

.student-onboarding-form header p {
  margin: 0;
  color: #979fb9;
  line-height: 1.6;
}

.student-onboarding-form fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.student-onboarding-form legend {
  margin-bottom: 12px;
  color: #d9ddef;
  font-size: 0.87rem;
  font-weight: 700;
}

.exam-target-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.exam-target-card {
  position: relative;
  min-height: 86px;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 14px;
  border:
    1px solid
    rgba(255, 255, 255, 0.09);
  border-radius: 15px;
  cursor: pointer;
  color: #eff1ff;
  text-align: left;
  background:
    rgba(255, 255, 255, 0.028);
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    background 160ms ease;
}

.exam-target-card:hover {
  transform: translateY(-2px);
  border-color:
    rgba(140, 119, 255, 0.38);
}

.exam-target-card.is-selected {
  border-color:
    rgba(130, 104, 255, 0.72);
  background:
    linear-gradient(
      135deg,
      rgba(116, 82, 255, 0.18),
      rgba(34, 126, 255, 0.1)
    );
}

.exam-target-card > span {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: #a99aff;
  background:
    rgba(126, 97, 255, 0.13);
}

.exam-target-card strong,
.exam-target-card small {
  display: block;
}

.exam-target-card small {
  margin-top: 5px;
  color: #858da8;
  line-height: 1.35;
}

.exam-target-check {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #75ecbc;
}

.onboarding-fields {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.onboarding-fields label {
  min-width: 0;
  display: grid;
  gap: 8px;
  color: #d7dbed;
  font-size: 0.84rem;
  font-weight: 650;
}

.onboarding-fields label > span {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.onboarding-fields label small {
  color: #777f99;
  font-weight: 500;
}

.onboarding-fields label > div {
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  border:
    1px solid
    rgba(255, 255, 255, 0.1);
  border-radius: 13px;
  background:
    rgba(255, 255, 255, 0.03);
}

.onboarding-fields input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: white;
  color-scheme: dark;
  background: transparent;
}

.onboarding-submit-button {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 0;
  border-radius: 14px;
  cursor: pointer;
  color: white;
  font-weight: 800;
  background:
    linear-gradient(
      135deg,
      #7659ff,
      #287fff
    );
  box-shadow:
    0 16px 44px
    rgba(74, 84, 255, 0.27);
}

.onboarding-submit-button:disabled {
  cursor: wait;
  opacity: 0.62;
}

.onboarding-error {
  padding: 12px 14px;
  border:
    1px solid
    rgba(255, 87, 126, 0.3);
  border-radius: 12px;
  color: #ff9caf;
  background:
    rgba(255, 54, 103, 0.08);
}

.onboarding-consent-note {
  color: #737b95;
  text-align: center;
  line-height: 1.5;
}

.onboarding-profile-loader {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #a8afc6;
}

.onboarding-state-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  color: #f7f8ff;
  background:
    radial-gradient(
      circle at 20% 10%,
      rgba(116, 76, 255, 0.18),
      transparent 35%
    ),
    #070914;
}

.onboarding-state-card {
  width: min(430px, 100%);
  display: grid;
  justify-items: center;
  gap: 13px;
  padding: 30px;
  border:
    1px solid
    rgba(144, 125, 255, 0.23);
  border-radius: 21px;
  text-align: center;
  background:
    rgba(15, 18, 37, 0.84);
  box-shadow:
    0 24px 80px
    rgba(0, 0, 0, 0.36);
}

.onboarding-state-card h1,
.onboarding-state-card p {
  margin: 0;
}

.onboarding-state-card p {
  color: #9ba3bc;
}

.onboarding-state-card button {
  min-height: 43px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding: 0 17px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  color: white;
  background:
    linear-gradient(
      135deg,
      #765cff,
      #377dff
    );
}

.onboarding-spinner {
  animation:
    onboarding-spin
    900ms linear infinite;
}

@keyframes onboarding-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 980px) {
  .student-onboarding-page {
    grid-template-columns: 1fr;
  }

  .student-onboarding-visual {
    min-height: auto;
    gap: 70px;
    border-right: 0;
    border-bottom:
      1px solid
      rgba(255, 255, 255, 0.07);
  }

  .student-onboarding-form-panel {
    min-height: auto;
  }
}

@media (max-width: 620px) {
  .student-onboarding-visual,
  .student-onboarding-form-panel {
    padding: 22px;
  }

  .exam-target-grid,
  .onboarding-fields {
    grid-template-columns: 1fr;
  }

  .student-onboarding-form {
    padding: 22px;
  }
}
EOF

# ============================================================
# BARREL EXPORT
# ============================================================

cat > apps/web/src/pages/onboarding/index.ts <<'EOF'
export {
  StudentOnboardingGate,
} from "./StudentOnboardingGate";

export {
  StudentOnboardingPage,
} from "./StudentOnboardingPage";

export {
  completeStudentOnboarding,
  getStudentOnboardingStatus,
} from "./onboarding.service";

export type {
  StudentOnboardingInput,
  StudentOnboardingProfile,
  StudentOnboardingResult,
  StudentOnboardingStatus,
} from "./onboarding.types";
EOF

# ============================================================
# PATCH STUDENT ROUTER
# ============================================================

python3 - <<'PY'
from pathlib import Path

path = Path(
    "apps/web/src/app/router/AppRouter.tsx",
)

text = path.read_text()

gate_import = '''
import {
  StudentOnboardingGate,
  StudentOnboardingPage,
} from "../../pages/onboarding";
'''.strip()

if (
    'from "../../pages/onboarding"'
    not in text
):
    marker = (
        'import { DashboardPage } '
        'from "../../pages/dashboard/DashboardPage";'
    )

    if marker not in text:
        raise SystemExit(
            "Could not locate the DashboardPage import."
        )

    text = text.replace(
        marker,
        marker + "\n\n" + gate_import,
        1,
    )

old_route = (
    '          <Route element={<AppShell />}>'
)

new_route = '''          <Route
            path="onboarding"
            element={
              <StudentOnboardingPage />
            }
          />

          <Route
            element={
              <StudentOnboardingGate />
            }
          >'''

if old_route in text:
    text = text.replace(
        old_route,
        new_route,
        1,
    )
elif (
    "<StudentOnboardingGate />"
    not in text
):
    raise SystemExit(
        "Could not locate the AppShell route."
    )

path.write_text(text)

print(
    "Student onboarding routes connected.",
)
PY

echo "Student onboarding interface created successfully."
