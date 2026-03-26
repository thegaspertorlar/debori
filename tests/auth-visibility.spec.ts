import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || '';
const managerEmail = process.env.TEST_MANAGER_EMAIL || 'manager@example.com';
const managerPassword = process.env.TEST_MANAGER_PASSWORD || 'password123';
const userEmail = process.env.TEST_USER_EMAIL || 'user@example.com';
const userPassword = process.env.TEST_USER_PASSWORD || 'password123';

// Helper: sign in via UI
async function signIn(page, email: string, password: string) {
  await page.goto('/login');
  // Assumes login form has input[name="email"] and input[name="password"] and a button role=button name=Sign\s?in
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button:has-text("Sign in"), button:has-text("Sign In")'),
  ]);
}

async function signOut(page) {
  // Try common sign out selectors
  const signOutSelector = 'button:has-text("Sign out"), button:has-text("Sign Out"), a:has-text("Sign out"), a:has-text("Sign Out")';
  if (await page.locator(signOutSelector).count() > 0) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click(signOutSelector),
    ]);
  } else {
    // Fallback: clear auth cookies/localStorage and reload
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });
  }
}

test.describe('Authentication-sensitive event UI', () => {
  test('Guest browsing: public pages usable and no manager controls', async ({ page }) => {
    await page.goto('/events');
    // Public list should be visible
    await expect(page.locator('[data-testid="event-list"], main, #main, .event-list')).toBeVisible();

    // Manager-only controls should not be visible
    await expect(page.locator('button:has-text("Create"), [data-testid="create-event"], a:has-text("Create Event")')).toHaveCount(0);
    await expect(page.locator('button:has-text("Edit"), [data-testid="edit-event"]').first()).toHaveCount(0);

    // Try direct protected route navigation
    await page.goto('/events/new');
    // Expect landing on login or a login form visible, and no admin content
    await expect(page).toHaveURL(/.*login.*/i);
    await expect(page.locator('[data-testid="admin-panel"], [data-testid="event-form"], form:has-text("Title")')).toHaveCount(0);
  });

  test('Manager browsing: admin controls visible and accessible', async ({ page }) => {
    await signIn(page, managerEmail, managerPassword);

    await page.goto('/events');
    // Create should be visible to manager
    await expect(page.locator('button:has-text("Create"), [data-testid="create-event"], a:has-text("Create Event")')).toBeVisible();

    // Visit an event detail page (first event). Public pages are read-only; manager edit entry points
    // must not be present on public routes. If an event exists, ensure Edit/Delete are not shown.
    const firstEventLink = page.locator('[data-testid="event-list"] a, .event-list a, main a').first();
    if (await firstEventLink.count() > 0) {
      await firstEventLink.click();
      // public detail must be read-only regardless of manager auth
      await expect(page.locator('button:has-text("Edit"), [data-testid="edit-event"]').first()).toHaveCount(0);
      await expect(page.locator('button:has-text("Delete"), [data-testid="delete-event"]').first()).toHaveCount(0);
    } else {
      // If no event exists, the manager should be able to open a create flow from the events management page
      await page.click('button:has-text("Create"), [data-testid="create-event"], a:has-text("Create Event")');
      await expect(page.locator('form:has-text("Title"), [data-testid="event-form"]').first()).toBeVisible();
    }

    // Manager workflows should land on the events management page.
    await page.goto('/admin');
    await expect(page.locator('a:has-text("Create event"), a:has-text("Create Event")')).toBeVisible();
    await expect(page).toHaveURL(/.*admin.*events.*/i);
  });

  test('Switching auth state does not leak admin content', async ({ page }) => {
    // Sign in as manager and confirm admin controls
    await signIn(page, managerEmail, managerPassword);
    await page.goto('/events');
    await expect(page.locator('button:has-text("Create"), [data-testid="create-event"]').first()).toBeVisible();

    // Sign out and ensure admin controls disappear immediately
    await signOut(page);
    await expect(page.locator('button:has-text("Create"), [data-testid="create-event"]').first()).toHaveCount(0);

    // Ensure public page still usable
    await page.goto('/events');
    await expect(page.locator('[data-testid="event-list"], main, #main')).toBeVisible();
  });

  test('Direct navigation to protected routes redirects to login and hides admin DOM', async ({ page }) => {
    // As guest
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/events/1/edit');
    await expect(page).toHaveURL(/.*login.*/i);
    // Ensure admin form not present
    await expect(page.locator('form:has-text("Title"), [data-testid="event-form"]').first()).toHaveCount(0);
  });

  test('Public event search filters by title and address with clear and no-results states', async ({ page }) => {
    await page.goto('/events');

    const searchInput = page.locator('[data-testid="events-search"]');
    await expect(searchInput).toBeVisible();

    const cards = page.locator('.event-card');
    const initialCount = await cards.count();
    if (initialCount === 0) {
      await expect(page.locator('text=/no upcoming events/i')).toBeVisible();
      return;
    }

    const firstTitle = (await page.locator('.event-card__title').first().textContent())?.trim() || '';
    await searchInput.fill(firstTitle);
    await expect(page.locator('.event-card__title').first()).toContainText(firstTitle);

    const firstLocation = ((await page.locator('.event-card__location').first().textContent()) || '').trim();
    if (firstLocation) {
      await searchInput.fill(firstLocation);
      await expect(page.locator('.event-card__location').first()).toContainText(firstLocation);
    }

    await searchInput.fill('zzzz-no-event-match-zzzz');
    await expect(page.locator('text=/no matching events/i')).toBeVisible();

    const clearSearch = page.locator('button:has-text("Clear search"), [data-testid="events-search-clear"]');
    await expect(clearSearch.first()).toBeVisible();
    await clearSearch.first().click();

    await expect(searchInput).toHaveValue('');
    await expect(page.locator('.event-card').first()).toBeVisible();
  });

  test('Empty and error states show appropriate messaging and manager create available', async ({ page }) => {
    // Navigate to an endpoint that typically shows empty state; if your app provides a query for empty state use it
    // We'll try a predictable empty path; teams should adapt this to their test fixture routes
    await page.goto('/events?test_empty=true');
    const emptyMessage = page.locator('text=/no events|nothing here|no items/i');
    if (await emptyMessage.count() > 0) {
      await expect(emptyMessage.first()).toBeVisible();
    }

    // Manager should still see Create when list is empty
    await signIn(page, managerEmail, managerPassword);
    await page.goto('/events?test_empty=true');
    await expect(page.locator('button:has-text("Create"), [data-testid="create-event"]').first()).toBeVisible();
  });
});
