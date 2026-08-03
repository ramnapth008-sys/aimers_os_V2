import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { MarketingLayout } from "../../layouts/MarketingLayout";

import { AuthPage } from "../../pages/auth/AuthPage";
import { HomePage } from "../../pages/home/HomePage";
import { PricingPage } from "../../pages/pricing/PricingPage";
import { MarketingContentPage } from "../../pages/shared/MarketingContentPage";

const contentPages = [
  {
    path: "features",
    eyebrow: "AIMERS PRODUCT MODULES",
    title:
      "One connected system for every stage of learning.",
    description:
      "Explore AI Mentor, Behavior AI, Memory Engine, tests, analytics, research, digital activity and more.",
  },
  {
    path: "how-it-works",
    eyebrow: "FROM DATA TO IMPROVEMENT",
    title:
      "Understand. Personalise. Intervene. Improve.",
    description:
      "AIMERS turns study activity and performance into useful learning actions.",
  },
  {
    path: "students",
    eyebrow: "BUILT FOR STUDENTS",
    title:
      "A personal operating system for ambitious learners.",
    description:
      "Plan, focus, learn, practise, remember and improve inside one connected workspace.",
  },
  {
    path: "parents",
    eyebrow: "PARENT EXPERIENCE",
    title:
      "Support progress without turning learning into pressure.",
    description:
      "Clear academic summaries, meaningful alerts and consent-aware progress reporting.",
  },
  {
    path: "institutions",
    eyebrow: "INSTITUTION INTELLIGENCE",
    title:
      "Improve student outcomes across batches and classrooms.",
    description:
      "Give teachers and leaders access to cohort analytics, tests, interventions and outcome dashboards.",
  },
  {
    path: "coaching-centres",
    eyebrow: "FOR COACHING ORGANISATIONS",
    title:
      "Connect content, mentoring and learning intelligence.",
    description:
      "Manage batches, tests, staff workflows and individual student improvement.",
  },
  {
    path: "security",
    eyebrow: "TRUST AND SECURITY",
    title:
      "Privacy, consent and responsible access by design.",
    description:
      "AIMERS separates student data, mentor access and company-level analytics with strict controls.",
  },
  {
    path: "privacy",
    eyebrow: "PRIVACY CONTROLS",
    title:
      "Students remain in control of optional monitoring.",
    description:
      "Granular consent, monitoring pauses, data exports, retention controls and deletion workflows.",
  },
  {
    path: "terms",
    eyebrow: "AIMERS TERMS",
    title:
      "Clear terms for a trustworthy learning platform.",
    description:
      "The final legal terms will be published before production launch.",
  },
  {
    path: "about",
    eyebrow: "ABOUT AIMERS",
    title:
      "Building a better learning system for every student.",
    description:
      "AIMERS combines education, technology, AI and continuous experimentation.",
  },
  {
    path: "contact",
    eyebrow: "CONTACT AIMERS",
    title:
      "Talk to the AIMERS team.",
    description:
      "Contact us about subscriptions, institutions, partnerships, support or the product roadmap.",
  },
  {
    path: "blog",
    eyebrow: "AIMERS RESEARCH",
    title:
      "Learning science, product updates and student improvement.",
    description:
      "The AIMERS publication system will contain educational research and product announcements.",
  },
  {
    path: "careers",
    eyebrow: "BUILD AIMERS",
    title:
      "Join the team building the learning operating system.",
    description:
      "Future roles will include education, engineering, AI, design, research and student success.",
  },
  {
    path: "help",
    eyebrow: "HELP CENTRE",
    title:
      "Find answers and get support.",
    description:
      "Documentation, account help, subscription support and product guidance.",
  },
  {
    path: "status",
    eyebrow: "SYSTEM STATUS",
    title:
      "AIMERS services and platform availability.",
    description:
      "Operational status for websites, applications, APIs, workers and AI services.",
  },
];

export function MarketingRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route
            index
            element={<HomePage />}
          />

          <Route
            path="pricing"
            element={<PricingPage />}
          />

          {contentPages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={
                <MarketingContentPage
                  eyebrow={page.eyebrow}
                  title={page.title}
                  description={
                    page.description
                  }
                />
              }
            />
          ))}
        </Route>

        <Route
          path="login"
          element={<AuthPage />}
        />

        <Route
          path="register"
          element={<AuthPage />}
        />

        <Route
          path="*"
          element={
            <Navigate
              replace
              to="/"
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
