Card presentation regression checklist
====================================

Purpose
-------
Provide a lightweight, repeatable way to detect regressions where event cards fall back to an unstyled, HTML-like appearance (usually because global CSS failed to load or class names changed).

Automated verification
----------------------
1. From the project root run:

   npm install
   npm run verify:cards

2. What the script does:
   - Starts a small static server serving the project at http://localhost:5174
   - Launches a headless Chromium via Playwright
   - Loads the SPA routes /#/events and /#/admin at two breakpoints: desktop (1280x800) and mobile (375x812)
   - Confirms there are .event-card elements and that the first card has computed styles indicating the CSS is applied (display:flex or inline-flex, non-zero border-radius) and expected structural children (.event-card__media, .event-card__body).

3. Exit codes:
   - 0 = all checks passed
   - 2 = one or more presentation checks failed
   - 3 = unexpected error during verification

When automated verification is not available
-------------------------------------------
If you cannot run the automated script (no Playwright installed, CI limitations, etc.), follow this manual checklist to detect regressions quickly.

Manual QA checklist
-------------------
Environment setup
- Open a modern browser (Chromium, Firefox, or Safari)
- Serve the project (recommended): run `npm run dev` and preview at the dev server URL, or build and preview using `npm run build && npm run preview`.

Global checks
- Open the app root and navigate to #/events and #/admin.
- Confirm the network tab shows the CSS files (src/style.css and src/design-system.css) loaded successfully (HTTP 200). If CSS files failed to load, cards will render unstyled.

Visual checks (desktop)
- Viewport: Desktop (>= 1024px width)
- Navigate to /#/events
  - Confirm event tiles appear in a 3-column grid.
  - Each event card should present as a contained product-like card: rounded corners, subtle box-shadow, image on top, and a body with title and metadata.
  - Verify that images have been cropped (cinematic 16:9) and there is a date badge overlapping the image.
- Navigate to /#/admin
  - Confirm admin cards render in a compact row layout with an image thumbnail on the left and actions on the right.

Visual checks (mobile)
- Viewport: Mobile (e.g. 375x812)
- Navigate to /#/events
  - Cards should stack in a single column, with body padding and readable titles.
  - No raw HTML tags (like <div>, <h3>, or angle brackets) should be visible in the card text.
- Navigate to /#/admin
  - Admin list should stack or remain compact but not show unstyled content.

Structural checks (DOM)
- Inspect a card element in the browser DevTools and confirm:
  - The top-level element has class "event-card".
  - It contains an element with class "event-card__media" (an <img> or background container).
  - It contains an element with class "event-card__body" with child elements including "event-card__title" and optionally "event-card__dek".
  - The computed style for the .event-card has display:flex (or inline-flex) and a non-zero border-radius value (e.g. "10px"). If display is "block" and border-radius is "0px" the global card style likely wasn't applied.

What to do if you find a regression
- If CSS failed to load: check network, verify the server is serving style files and that paths are correct.
- If class names changed in markup: ensure the code that renders cards uses the expected class names (event-card, event-card__media, event-card__body, etc.).
- If only some breakpoints fail: confirm media queries are intact and the CSS is not blocked by CSP or incorrect import order.

Notes for CI/automation
- The included script (npm run verify:cards) is intentionally lightweight and quick. It is suitable for inclusion as a pre-merge check in CI pipelines that can run Playwright.
- If CI agents cannot download Playwright browsers, consider using puppeteer-core with a pre-bundled Chromium or running the checks as part of an integration environment that already has browsers available.

Document history
- 2026-03-24: Added automated verification script and manual QA checklist to detect card presentation regressions across /events and /admin in desktop and mobile breakpoints.
