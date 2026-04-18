/**
 * helpers.js — shared utilities for EduConnect Playwright tests
 *
 * Covers the volunteer matching & review system (P3 Study module).
 * Seed credentials (password: password123) come from seed.js.
 */

export const BASE = 'http://localhost:5173';

export const CREDENTIALS = {
  student:   { email: 'student@educonnect.com',   password: 'password123', name: 'Ava Perera' },
  student2:  { email: 'nimal.j@educonnect.com',   password: 'password123', name: 'Nimal Jayawardena' },
  volunteer: { email: 'kavindu@educonnect.com',   password: 'password123', name: 'Kavindu Hewa' },
};

/**
 * Log in as a student or volunteer via the login page.
 * Waits until redirected away from /login before resolving.
 */
export async function login(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  // Use the input element directly to avoid matching the "Show password" toggle button
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  // Wait until we leave the login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
}

/**
 * Navigate to the P3 discovery page (volunteer listing).
 */
export async function goToDiscovery(page) {
  await page.goto('/study/discovery');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to the student dashboard.
 */
export async function goToStudentDashboard(page) {
  await page.goto('/study/student-dashboard');
  await page.waitForLoadState('networkidle');
}
