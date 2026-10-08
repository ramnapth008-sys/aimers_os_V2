# AIMERS OS — Evidence-Led Student UX Research Standard

**Status:** Research and testing protocol; not a claim of validated AIMERS usability.
**Scope:** Student portal (especially first-time learners and exam-preparation workflows). Other age groups require separate validation.
**Core question:** Can a new student understand what AIMERS does, choose a useful next learning action, and begin studying without instruction?

## Evidence hierarchy

1. **Student observation (highest local relevance):** moderated first-use tests with actual intended students, task completion, confusion points, follow-up interviews.
2. **Peer-reviewed learning science and educational dashboard studies:** use to form hypotheses; avoid claiming findings transfer automatically across ages/cultures.
3. **Usability research from established UX organizations:** apply principles with context-sensitive testing.
4. **Public social media discussions:** generate hypotheses and vocabulary; never treat posts, upvotes, or comments as representative survey data.
5. **Designer judgment and aesthetics:** last, not first.

## Sources and implications

| Source | Evidence type | Main takeaway | AIMERS testable implication |
|---|---|---|---|
| Mayer & Moreno (2003), *Nine Ways to Reduce Cognitive Load in Multimedia Learning*, https://doi.org/10.1207/S15326985EP3801_6 | Peer-reviewed learning theory / research | Processing capacity is limited; instructional presentation can impose unnecessary load | Keep the entry view relevant to the next task, eliminate duplicate indicators and decorative information |
| Matcha et al. (2020), *A Systematic Review of Empirical Studies on Learning Analytics Dashboards*, https://doi.org/10.1109/TLT.2019.2916802 | Systematic review | Many dashboards are not well connected to effective learning tactics / self-regulation | Every student-facing insight should offer an understandable next action |
| Paulsen & Lindsay (2024), *Learning analytics dashboards are increasingly becoming about learning and not just analytics*, https://doi.org/10.1007/s10639-023-12401-4 | Systematic review | Dashboard design benefits from a pedagogical rather than metrics-first approach | Keep detailed analytics in Progress, not the home landing page |
| Chernev et al. (2015), *Choice Overload: A Conceptual Review and Meta-Analysis*, https://doi.org/10.1016/j.jcps.2014.08.002 | Meta-analysis (choice decisions; not education-specific) | Complexity, goal, and uncertainty influence whether choice abundance overwhelms | Test one primary action plus a limited number of secondary paths against current home |
| Nielsen Norman Group (2006), *Progressive Disclosure*, https://www.nngroup.com/articles/progressive-disclosure/ | Professional usability guidance | Show the most frequent tasks first and make advanced capabilities discoverable | Introduce progressively disclosed tools; avoid hiding essential learning actions |
| Nielsen Norman Group, *UX Design for Teenagers (13–17)*, https://www.nngroup.com/reports/teenagers-on-the-web/ | User-research report | Teens are goal-oriented; mobile, onboarding, comprehension and patience all matter | Conduct research with intended teen learners instead of assuming technical familiarity |
| Jivet, *Designing Dashboards to Help Students Take Action* (2020), https://www.solaresearch.org/2020/10/designing-dashboards-to-help-students-take-action/ | Learning analytics research perspective | Metrics alone do not ensure students take useful steps | Replace unlabeled scores with interpretations and action links |
| Student-led discussion, r/Notion (2025), https://www.reddit.com/r/Notion/comments/1jcw3y1/are_we_making_notion_too_complicated_after_6/ | Anecdotal online feedback | Complex setups and aesthetic dashboards can impede actual tasks | Ask testers whether AIMERS feels like studying or configuring a dashboard |
| Student discussion, r/GetStudying (2025), https://www.reddit.com/r/GetStudying/comments/1lhhmow | Anecdotal online feedback | Setup and organization can consume study time | Measure time from login to meaningful study activity |
| JEE/NEET student discussion, r/JEENEETards (2025), https://www.reddit.com/r/JEENEETards/comments/1o4ph6n/one_jeeneet_dashboard_to_rule_them_all/ | Anecdotal domain-specific online feedback | Fragmented tools and distractions motivate integrated learning workflows | Test fast access to chapters, practice, tasks and mock-review in one consistent flow |
| Student preferences study (2026), https://doi.org/10.1007/s10758-026-09969-4 | Survey of 1,020 university students; not directly representative of teens | Students want understandable grades and explanations; preference isn't equivalent to learning efficacy | Explain the basis of every score and recommendation; don't overpromise AI prediction |

## Product hypotheses (NOT scientifically established AIMERS outcomes)

- **H1:** New students finish a meaningful learning action more quickly when the home screen shows one personalized recommendation and a straightforward escape route to Learn / Practice.
- **H2:** Replacing AI jargon (e.g., behavior intelligence, cognitive engine) with task language improves comprehension.
- **H3:** Keeping secondary tools under visible named navigation improves first-use confidence, compared with 10+ parallel dashboard cards.
- **H4:** A calmer, more restrained visual hierarchy improves scan speed and readability; premium visuals should complement comprehension, not crowd it.
- **H5:** Interpretable, actionable learning feedback is more useful than showing many percentages and scores with no explanation.

## Home experience design contract

The first viewport should answer:
1. **Where am I?** AIMERS, my learning space.
2. **What's next?** A single task or chapter, or an honest first-time empty state.
3. **How do I start?** One highly visible CTA tied to the actual chapter / task.
4. **Where can I go?** Learn, Practice, AI Mentor, Progress, discoverable other tools.
5. **What is urgent?** At most one or two verified, relevant reminders; no invented deadlines.

Avoid:
- Generic promises of AI intelligence without a demonstrated benefit.
- Two or three adjacent primary CTAs competing for attention.
- Many percentages without labels explaining why they matter.
- Putting monetization ahead of the learning task for beginners.
- Excessive visual decoration, large illustrations, celebratory motion, badges or alerts.
- Shame / pressure based on streaks, comparisons, unvalidated risk predictions.
- Faux notifications, artificially urgent red statuses, pseudo-scientific labels.
- Fixing the page to one screen if it clips content at zoom, accessibility text sizes, or mobile. Desktop may fit one view; smaller or magnified screens must scroll.

## First-time vs returning learners

**First-time:** straightforward welcome; choose goal/syllabus; pick first subject; start first activity. No empty zeroed analytics across the screen. Onboarding must be skippable, resumable and brief.

**Returning:** resume precise chapter/session, progress toward a concrete task, one understandable recommendation, optional progress link.

**Student choice:** allow browsing or dismissing recommendations; do not force AI automation or behavior monitoring. Tracking requires transparent, appropriate consent and optional opt-out.

## Design system to evaluate, not assume

Use a calmer matte/acrylic hybrid with purple used mostly for identity and primary action. Strong contrast, generous type, consistent spacing and clear controls. Test alternate visual treatments with students. Prefer subtle motion and respect reduced-motion preferences. 'Premium' is not synonymous with blur, glass, neon or illustration density.

## Moderated usability study (pilot)

Recruit **6–10 intended students** with variation in grade, prep goal, tech familiarity and device. Do not frame this as statistically representative. For minors, obtain appropriate parental/guardian permission and the student's assent.

Give each person the same tasks **without coaching**:
1. After first login: tell us what AIMERS is and what they can do first.
2. Find and start a chapter in a subject.
3. Continue an unfinished chapter.
4. Practice a weak topic / find questions.
5. Ask AI Mentor for a simple explanation.
6. Check the reason for a progress number and locate full details.

Observe:
- First meaningful action time (seconds).
- Unassisted task success and wrong turns.
- Misinterpretations of labels, alerts or AI recommendations.
- Perceived ease (short post-task question) and trust.
- Mobile/desktop behavior and accessibility issues.
- Student's own words for the items and tasks.

Afterward ask: What would you remove? What felt confusing? What would you return to use? Which suggestion felt unfair or inaccurate?

## Design release gates

Do not merge a student UI redesign into the primary branch solely because it looks attractive. Require:
- Build and navigation checks pass.
- Actual onboarding and return journeys can be completed.
- No fabricated data/alerts/status claims.
- Responsive desktop/mobile views tested at normal and 200% browser zoom.
- Feedback from real intended students recorded, along with unresolved confusion points.
- A short decision log tying design choices to evidence and observed test results.

## Next research deliverables

1. Compare V4 against a **focused, low-density** home screen with the same user data.
2. Prepare a first-use clickable prototype before a full implementation.
3. Pilot usability study and theme-code feedback.
4. Implement the best-supported option, keeping all advanced modules in dedicated routes.
5. Retest learning-task completion, not merely page attractiveness.

**Principle:** The user should spend their effort learning, not learning how to operate AIMERS.
