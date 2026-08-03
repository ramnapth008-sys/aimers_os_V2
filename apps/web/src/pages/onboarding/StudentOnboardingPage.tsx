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
