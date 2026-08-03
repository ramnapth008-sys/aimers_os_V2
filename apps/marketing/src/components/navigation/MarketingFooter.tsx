import {
  Brain,
  BriefcaseBusiness,
  Mail,
  MapPin,
  MessageCircle,
  Video,
} from "lucide-react";

import { Link } from "react-router-dom";

const productLinks = [
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  ["Students", "/students"],
  ["Parents", "/parents"],
  ["Institutions", "/institutions"],
];

const companyLinks = [
  ["About", "/about"],
  ["Careers", "/careers"],
  ["Contact", "/contact"],
  ["Blog", "/blog"],
  ["System Status", "/status"],
];

const legalLinks = [
  ["Privacy", "/privacy"],
  ["Security", "/security"],
  ["Terms", "/terms"],
  ["Help Centre", "/help"],
];

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <section className="footer-main">
        <div className="footer-brand-column">
          <Link
            className="marketing-brand"
            to="/"
          >
            <span>
              <Brain size={25} />
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

          <p>
            A personalised learning operating
            system that helps students plan,
            learn, practise, remember and
            improve.
          </p>

          <div className="footer-contact">
            <span>
              <MapPin size={14} />
              Kerala, India
            </span>

            <span>
              <Mail size={14} />
              hello@aimers.ai
            </span>
          </div>
        </div>

        <div className="footer-link-column">
          <strong>Product</strong>

          {productLinks.map(
            ([label, path]) => (
              <Link
                key={path}
                to={path}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="footer-link-column">
          <strong>Company</strong>

          {companyLinks.map(
            ([label, path]) => (
              <Link
                key={path}
                to={path}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="footer-link-column">
          <strong>Trust</strong>

          {legalLinks.map(
            ([label, path]) => (
              <Link
                key={path}
                to={path}
              >
                {label}
              </Link>
            ),
          )}
        </div>

        <div className="footer-newsletter">
          <strong>
            Learning intelligence updates
          </strong>

          <p>
            Product news, study insights and
            AIMERS research.
          </p>

          <form
            onSubmit={(event) =>
              event.preventDefault()
            }
          >
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
            />

            <button type="submit">
              Join
            </button>
          </form>
        </div>
      </section>

      <section className="footer-bottom">
        <span>
          © 2026 AIMERS OS. All rights
          reserved.
        </span>

        <div>
          <button
            type="button"
            aria-label="Twitter"
          >
            <MessageCircle size={15} />
          </button>

          <button
            type="button"
            aria-label="YouTube"
          >
            <Video size={15} />
          </button>

          <button
            type="button"
            aria-label="LinkedIn"
          >
            <BriefcaseBusiness size={15} />
          </button>
        </div>
      </section>
    </footer>
  );
}
