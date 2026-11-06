# Hajree — Site Design System

## Classification and choices

- **Site type:** hybrid open-source product landing page + authenticated attendance web application.
- **Theme:** light product-marketing theme. This choice fits an education/workflow product without real cinematic footage; preserve the existing functional dark/light application theme.
- **Hero:** light particle-led original vector/CSS scene, with an explicit illustrative label and no invented biometric output.
- **Audience:** campus administrators, faculty, students, developers, and self-hosters.
- **Primary conversion:** Open Hajree / sign in; secondary student registration and open-source repository.
- **Reference influence:** antigravity.google light editorial typography/particle suggestions; flow.google.com/about narrative staging and cinematic hierarchy, interpreted as aesthetic principles only. Exact reference implementations, performance values, typography licenses, and source code remain **Unverified**.

## Actual implementation

\`frontend/src/marketing/LandingPage.tsx\` and \`frontend/src/marketing/landing.css\` are deliberately isolated from the role-based dashboard views. Application authorization, recognition and reports are unchanged.

### Typography
- Marketing: Plus Jakarta Sans with system fallback (already loaded in \`frontend/index.html\`).
- Terminal: JetBrains Mono with monospace fallback.
- Large display text uses responsive \`clamp()\`; headings are balanced and copy is short.

### Surfaces
- Canvas: #fff, ink: #181a22, muted: #626776, neutral surfaces: #f6f7fa.
- Brand accent: #6055ca; deep developer chapter: #1a1b27.
- Hairline borders, 22–29px panels, 100px pill actions, crisp dark CTAs.
- No recurring blurred glass cards; avoid decorative gradient overload.

### Motion
- Navigation/hover: 180–250ms.
- Role and stage swaps: 350–420ms.
- Carousel track: 480ms.
- Ambient hero canvas: 32–72 dots based on width; pointer response only inside canvas; paused offscreen/when hidden; disabled with reduced motion or Save-Data.
- Scroll sections remain visible if JavaScript is unavailable. \`IntersectionObserver\` only adds progressive decoration, not essential visibility control.
- Media: no video supplied, so no autoplay, pause, poster, or fake media control.

### Accessibility decisions
- Skip link, semantic nav and landmarks, heading hierarchy.
- Tabs are actual buttons, with \`aria-selected\`, \`aria-controls\`, keyboard arrow handling, and selected tab focus.
- Native \`details\` and \`summary\` for no-JS FAQ.
- Carousel is user-controlled with descriptive controls and disabled ends; no auto-rotation.
- Decorative particles and scan shapes are hidden from the accessibility tree or contextualized as illustrative.
- Reduced-motion query stops ambient particles and removes movement.
- Focus-visible outlines and responsive 44px touch controls.
- Text remains readable without script or high-bandwidth media.

## Effects catalog audit

Status definitions: **Built** means the implementation exists in source; runtime visual inspection may still be **not run**. **Skipped** means deliberately absent for this single-product attendance application. IDs follow the user's reference catalog (L, A, P, S, C, O, M, T, R). Values are indicative design settings, not measured reference values.

| IDs | Effect / trigger / properties | Timing/easing | Reduced motion | Status / why / location | Evidence |
| --- | --- | --- | --- | --- | --- |
| L1–L2, T2 | Hero typography and call-to-action entrance; load | Static baseline; no mandatory delayed reveal | Instant visible | **Built** semantic hero text; no character animation for readability (\`LandingPage.tsx\`) | Recommended |
| L3, L5–L6 | Hero diffusion, announcement and header entrance | Static load | Visible | **Skipped**: text and controls should not delay page render | Recommended |
| L4 | Particle layer mounted in hero | Canvas | Static | **Built** \`ParticleField\` | Inferred |
| L7 | Looping scroll cue | — | — | **Skipped**: native visual page affordance is sufficient | Recommended |
| A1–A2, P1 | Particle ambient drift, small oscillations, pointer influence | requestAnimationFrame + damping | Stop | **Built**, hero canvas | Inferred |
| A3–A4, R12 | Orbital animation/mode selector | — | — | **Skipped**: not required by attendance workflow; no control added solely as decoration | Inferred |
| A5–A6 | Floating chips, breathing atmosphere | — | Static | **Skipped**: unnecessary ambient workload | Recommended |
| A7–A8 | Video loop and content-derived colors | — | Poster | **Skipped**: no verified media assets | Observed/Designer-confirmed |
| P2–P4 | Custom cursor, magnetic buttons/borders | — | Off | **Skipped**: pointer ergonomics and performance prioritized | Observed/Recommended |
| P5–P8, P10, P12 | Tactile hover, active, link/nav and visible focus states | 180–250ms | Color/border only | **Built**, marketing CSS | Recommended |
| P9, P11, P13–P14 | Dropdown, explorer preview, font shift, video preview | — | Static | **Skipped**: no such product component/media | Recommended |
| S1–S4 | Scroll-reveal markup, section transitions | 650ms, primary | No movement | **Partial**: observer exists, content remains visible; no hide-before-JS; no blur | Recommended |
| S5–S10 | Parallax, pinned scenes, scrubbed motion, progress bar | — | Static | **Skipped**: long-scroll friction and complexity | Recommended |
| S11–S13 | Active scroll nav, header switch, scroll-cue fade | — | Static | **Skipped**: anchors/navigation remain usable without scroll observers | Recommended |
| S14–S15 | Native scroll/hash links | Browser default | Native | **Built**, section links and scroll offsets | Recommended |
| S16 | Docs TOC scroll tracking | — | Static | **Skipped**: existing docs live in repository/Swagger, not separate content pages | Recommended |
| C1–C2, C4–C5 | Manual capability carousel, buttons, slide progress | 480ms ease-in-out | Instant | **Built** in \`LandingPage.tsx\` and \`landing.css\`; no drag gesture implemented | Observed/Recommended |
| C3 | Peek fade mask | — | — | **Skipped**: full-frame slides chosen for small screens | Observed |
| C6 | Autoplay carousel | — | Off | **Skipped**: user controlled | Recommended |
| C7–C10 | Workflow and user-role selectors, cross-fade/indicator | 350–420ms | Instant | **Built** selectors and panel swap; no oversized rotating stage word | Observed/Recommended |
| C11–C12 | Showcase selector, pricing card | — | Static | **Skipped**: no verified videos or paid plans | Observed/Recommended |
| C13 | FAQ accordion | Native details; plus rotation 250ms | Instant | **Built**, accessible native FAQ | Observed |
| C14 | Code/docs tabs | — | Static | **Skipped**: no in-site code-tab system | Recommended |
| O1 | Mobile menu expansion | Instant display; hover/focus styling | Instant | **Built**, responsive nav, no trapped focus | Recommended |
| O2–O4 | Search/video/dropdown overlays | — | — | **Skipped**: single-product landing and repository docs require no overlays | Observed/Recommended |
| O5 | Copy action success message | Success state; reset 2.2s | Text-only | **Built**, clipboard feedback | Observed |
| O6 | Tooltip | — | — | **Skipped**: descriptive permanent labels instead | Recommended |
| M1–M6 | Video controls, media poster, image reveal | — | Poster/static | **Skipped**: no verified demo footage; static vector presentation and branding used instead | Observed/Recommended |
| T1, T3 | Per-character/typewriter | — | Full text | **Skipped**: long titles accessible and indexable from first paint | Recommended |
| T4 | Animated counters | — | Final value | **Skipped**: no validated metrics | Recommended |
| T5 | Async step statuses | — | Status text | **Skipped**: no simulated asynchronous action | Observed |
| R1–R4 | Cross-route transitions / shared elements | — | None | **Skipped**: normal hyperlinks preserve native navigation and history | Recommended |
| R5–R6 | Search/filter reflow and empty state | — | Static | **Skipped**: only one verified product | Observed/Recommended |
| R7–R10 | Skeletons, loading spinner, success/error animation | Existing app-specific states | Existing app design | **Existing**, application views; marketing has no fake submission | Recommended |
| R11 | Toggle control | — | Instant | **Skipped** marketing page; app theme toggle preserved | Recommended |
| R13 | Theme control | Existing app theme | Existing app theme | **Existing**, authenticated UI, no new marketing theme selector | Recommended |
| R14–R15 | Guided tour, animated diagram stroke | — | Static | **Skipped**: no guided simulated product video | Observed/Recommended |
| R16 | Logo-copy action | — | — | **Skipped**: logo is existing SVG asset; no redundant brand kit promise | Observed |
| R17 | Language/download expansion | — | — | **Skipped**: no translated locales/download service | Observed |

Notes: some IDs are grouped to avoid repeating equivalent implementation. **This is not a row-by-row proof of each ID**; verify individual effects during a full browser QA pass. Full interaction state matrix and Lighthouse measurements remain unverified until tested on a running deployment.

## Deferred / intentional exclusions

Do not invent a multi-product registry, pricing, one-click demo login for public production, press-kit downloads, customer testimonials, AI recognition accuracy, fake user accounts, or new server endpoints. The site remains a fast, credible front door to the real project.
