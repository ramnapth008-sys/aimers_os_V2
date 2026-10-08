# Aimers OS student UI system

## Direction

A calm daily learning space inspired by the supplied olive, cream and lime reference. Keep the next study action prominent and introduce specialist tools through expandable navigation and search.

- Background: `#12160f`
- Navigation background: `#171c13`
- Main card: `#191e15`
- Highlighted study card: `#242c1d`
- Primary text: `#f1f3e8`
- Secondary text: `#b3bca6`
- Primary action: `#c3f467`, with dark text
- Border: `#39422f`
- Use a restrained accent palette. State colors remain meaningful.
- System sans-serif typography; clear headings, readable body text.
- Rounded surfaces, thin borders, generous spacing. Avoid decorative system-health indicators and unsupported readiness claims.

The student palette overrides shared tokens in `apps/web/src/styles/student-theme.css`. Company, parent and institution portal designs are separate. Existing student workspace panels and heroes match this palette while their forms and detailed tools retain their behavior.

## Navigation

Five everyday destinations: Today, Learn, Plan, Progress, Companion.

Expandable groups: Study tools, More insights, Explore. Connections and Settings & privacy are always discoverable. Search includes old module names so existing users can still find them. The previous dashboard remains available as Detailed dashboard.

## Responsive behavior

- Above 1180px: persistent sidebar; Today uses two columns.
- 761px to 1180px: sidebar becomes an accessible drawer; two-column Today where space permits.
- At 760px and below: main content becomes one column.
- At 680px and below: bottom navigation provides five everyday destinations; safe-area padding keeps content clear.
- At 480px and below: progress and companion cards stack, primary study action spans the card.
- Support 320px browser width without horizontal overflow.
- Use viewport width and content reflow instead of proportional scaling of a fixed desktop canvas.

## Interaction and evidence

Every apparent action should navigate somewhere or invoke a real API. Session time is a record of studying, not a mastery score. Unassessed or unavailable results must remain explicit. Avoid presenting placeholders as connected features.

Include visible keyboard focus, a skip link, native search-dialog focus handling, Escape dismissal, mobile-drawer focus containment, inactive hidden navigation, and reduced-motion support.
