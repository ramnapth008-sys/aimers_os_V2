import {
  useAuth,
} from "@aimers/auth";

import {
  Brain,
  CalendarDays,
  CheckCircle2,
  Link2,
  Mail,
  Settings,
  ShieldCheck,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import "./profile.css";

function profileName(
  user:
    ReturnType<
      typeof useAuth
    >["user"],
) {
  return (
    user?.displayName
      ?.trim() ||
    [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.email ||
    "AIMERS Student"
  );
}

function initials(
  value:
    string,
) {
  const letters =
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (part) =>
          part[0]
            ?.toUpperCase(),
      )
      .join("");

  return letters || "AS";
}

export function StudentProfilePage() {
  const {
    user,
  } = useAuth();

  const name =
    profileName(
      user,
    );

  const joinedAt =
    user?.createdAt
      ? new Intl.DateTimeFormat(
          "en-IN",
          {
            dateStyle:
              "medium",
          },
        ).format(
          new Date(
            user.createdAt,
          ),
        )
      : "Not available";

  return (
    <div className="student-profile-page">
      <header className="student-profile-hero">
        <div className="student-profile-avatar">
          {initials(
            name,
          )}
        </div>

        <div>
          <span>
            STUDENT IDENTITY
          </span>

          <h1>{name}</h1>

          <p>
            Your account, role and trusted AIMERS
            workspace connections.
          </p>
        </div>

        <strong>
          <ShieldCheck size={17} />
          {user?.status ??
            "ACTIVE"}
        </strong>
      </header>

      <section className="student-profile-grid">
        <article className="student-profile-card">
          <header>
            <Brain size={20} />

            <div>
              <small>
                LEARNING ACCOUNT
              </small>

              <h2>
                Student profile
              </h2>
            </div>
          </header>

          <dl>
            <div>
              <dt>
                Display name
              </dt>
              <dd>{name}</dd>
            </div>

            <div>
              <dt>
                Email
              </dt>
              <dd>
                {user?.email ??
                  "Not available"}
              </dd>
            </div>

            <div>
              <dt>
                Workspace role
              </dt>
              <dd>
                {user?.roles
                  .join(", ") ||
                  "STUDENT"}
              </dd>
            </div>
          </dl>
        </article>

        <article className="student-profile-card">
          <header>
            <CheckCircle2 size={20} />

            <div>
              <small>
                ACCOUNT TRUST
              </small>

              <h2>
                Verification
              </h2>
            </div>
          </header>

          <dl>
            <div>
              <dt>
                Email verification
              </dt>
              <dd>
                {user
                  ?.emailVerifiedAt
                  ? "Verified"
                  : "Not verified"}
              </dd>
            </div>

            <div>
              <dt>
                Account created
              </dt>
              <dd>{joinedAt}</dd>
            </div>

            <div>
              <dt>
                Organizations
              </dt>
              <dd>
                {user
                  ?.organizationMemberships
                  .length ??
                  0}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="student-profile-actions">
        <Link to="/settings">
          <Settings size={18} />

          <div>
            <strong>
              Privacy and settings
            </strong>

            <small>
              Manage monitoring, consent, devices
              and preferences.
            </small>
          </div>
        </Link>

        <Link to="/integrations">
          <Link2 size={18} />

          <div>
            <strong>
              Connected sources
            </strong>

            <small>
              Review verified and pending data
              connectors.
            </small>
          </div>
        </Link>

        <a
          href={`mailto:${user?.email ?? ""}`}
        >
          <Mail size={18} />

          <div>
            <strong>
              Account email
            </strong>

            <small>
              {user?.email ??
                "No email available"}
            </small>
          </div>
        </a>

        <Link to="/dashboard">
          <CalendarDays size={18} />

          <div>
            <strong>
              Return to dashboard
            </strong>

            <small>
              Continue the active learning
              workspace.
            </small>
          </div>
        </Link>
      </section>
    </div>
  );
}
