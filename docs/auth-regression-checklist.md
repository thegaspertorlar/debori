Authentication-sensitive Event UI
================================

Purpose
-------
Provide a focused regression checklist and automated coverage for authentication-sensitive event UI. The goal is repeatable, pre-release coverage that detects regressions where UI visibility or navigation incorrectly exposes or hides manager-only features.

Scope
-----
- Signed-out (guest) browsing of public event pages
- Signed-in manager browsing and access to manager controls
- Switching auth state (sign-in -> sign-out and vice-versa)
- Direct navigation to protected routes (deep links)
- Empty and error states

High-level Acceptance Criteria
-----------------------------
The team has repeatable coverage that catches auth-visibility regressions before release. Specifically:

- Manager-only controls (Create/Edit/Delete) appear only for manager users and are not present for guests or non-manager users.
- Public pages are fully usable by guests (read-only), with no hidden failures or broken navigation when unauthenticated.
- Attempting to access protected routes while unauthenticated redirects to Login and never exposes admin-only content in DOM.
- Switching auth state properly updates UI without leaking admin content or stale controls.
- Empty and error states render appropriate messages and controls (e.g., managers can see Create on empty lists).

Manual Regression Checklist
-------------------------
Quick manual checks to run as a smoke test before release (can be executed locally or in a staging environment):

1) Signed-out (Guest) Browsing
   - Go to /events (public events list).
   - Verify event list loads and you can open individual event pages.
   - Confirm there is no "Create Event" button or any Edit/Delete controls.
   - Try to navigate to a known admin URL (e.g. /admin/events, /events/new, /events/<id>/edit).
     - Expectation: redirected to /login (or see login form). No admin UI content should be visible.

2) Signed-in Manager Browsing
   - Sign in as a manager user (use test manager account).
   - Visit /events and /events/<id>.
   - Confirm "Create Event" button is visible on event list and Edit/Delete controls are visible on event pages.
   - Verify Create, Edit, and Delete workflows functionally open the correct forms/confirmations (functional testing beyond visibility).

3) Switching Auth State
   - Start signed in as manager. Visit an event page with visible Edit control.
   - Sign out using the app's sign out control.
   - Verify Edit/Delete/Create controls immediately disappear and page does not show any admin-only content.
   - Sign back in as non-manager (or guest) and verify controls remain absent.

4) Direct Navigation to Protected Routes
   - As guest, open a protected deep link (/events/new, /admin/events, /events/<id>/edit).
   - Expectation: user lands on /login or receives a login prompt; the protected page should not render admin-only content in DOM before redirect.

5) Empty and Error States
   - With a cleaned/staged dataset showing no events, open /events.
     - Verify an empty-state message like "No events" is shown.
     - As manager, confirm a prominent Create button or link is present.
     - As guest, confirm Create is not present and there are helpful suggestions (e.g., "No events" copy).
   - For error states (e.g., 500 or 401), confirm UI shows appropriate error messaging and does not leak admin content.

Automated Coverage (Playwright)
-------------------------------
This repository includes an automated test suite (Playwright) that codifies the above checks into repeatable tests. Tests are written defensively and parameterized via environment variables so they can run against local, CI, or staging environments.

Key tests included
  - guest-sees-public-pages.spec.ts: Guest browsing of public events: list and detail pages are readable and manager controls absent.
  - manager-sees-admin-controls.spec.ts: Manager browsing sees Create/Edit/Delete controls and can reach admin flows.
  - auth-switching.spec.ts: Sign in as manager, confirm admin controls appear; sign out and confirm those controls go away immediately.
  - deep-link-protection.spec.ts: Direct navigation to protected routes as guest redirects to Login and does not expose admin UI.
  - empty-and-error-states.spec.ts: Empty list and error handling show proper messages; manager retains ability to Create.

Running the automated tests
--------------------------
Prerequisites:
- Playwright installed (the repository contains tests/playwright.config.ts)
- Environment variables set for test accounts and base URL. The tests read the following variables (defaults provided):
  - BASE_URL (default: http://localhost:3000)
  - TEST_MANAGER_EMAIL (default: manager@example.com)
  - TEST_MANAGER_PASSWORD (default: password123)
  - TEST_USER_EMAIL (default: user@example.com)
  - TEST_USER_PASSWORD (default: password123)

Run tests locally:

  npx playwright test --config=tests/playwright.config.ts

CI integration
--------------
Add Playwright test runs to your pipeline at a stage after deploy-to-staging and before release. Use the same env variables, pointed at the staging URL.

Selectors and Adaptation
------------------------
Tests use stable semantic selectors where possible. If your app uses data-testid attributes, map these in the test config. Example selectors checked:
- Create button: text /role=button/label contains "Create" or data-testid="create-event"
- Edit button: data-testid="edit-event" or role=button name containing "Edit"
- Delete button: data-testid="delete-event" or role=button name containing "Delete"
- Public content: main content area or event list container (data-testid="event-list")
- Login detection: presence of login form (data-testid="login-form") or URL includes /login

If your app uses different selectors, update tests under tests/ accordingly.

Maintenance
-----------
- Whenever the app changes routes or the DOM structure of event pages, update the selectors in tests to match the new structure.
- Keep test accounts (manager and standard user) maintained in your staging environment and ensure their credentials are rotated securely in CI secrets.

Summary
-------
This document plus the Playwright suite provides repeatable checks that catch auth-visibility regressions. The automated tests should be run in CI against a staging instance to prevent regressions from reaching production.
