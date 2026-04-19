import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5174'; // change if Vite shows another port
const LOGIN_EMAIL = 'test@gmail.com';
const LOGIN_PASSWORD = 'Test123';

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

async function loginAsStudent(page: Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });

  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();

  await page.fill('input[name="email"]', LOGIN_EMAIL);
  await page.fill('input[name="password"]', LOGIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL('**/student', { timeout: 15000 });
  await expect(page).toHaveURL(/\/student$/);
}

async function openCreatePage(page: Page) {
  await page.goto(`${BASE_URL}/schedule/create`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/schedule\/create/);
  await expect(page.locator('form')).toBeVisible();
}

async function waitForSubjectOptions(page: Page) {
  await expect
    .poll(
      async () => await page.locator('select[name="title"] option').count(),
      { timeout: 15000 }
    )
    .toBeGreaterThan(1);
}

async function fillBasicScheduleForm(
  page: Page,
  description: string,
  date: string,
  startTime: string,
  endTime: string
) {
  await waitForSubjectOptions(page);

  const subjectSelect = page.locator('select[name="title"]');
  await expect(subjectSelect).toBeVisible();
  await subjectSelect.selectOption({ index: 1 });

  await page.fill('textarea[name="description"]', description);
  await page.fill('input[name="date"]', date);
  await page.selectOption('select[name="category"]', 'study');
  await page.fill('input[name="startTime"]', startTime);
  await page.fill('input[name="endTime"]', endTime);

  const locationInput = page.locator('input[name="location"]');
  if (await locationInput.count()) {
    await locationInput.fill('Library');
  }

  const prioritySelect = page.locator('select[name="priority"]');
  if (await prioritySelect.count()) {
    await prioritySelect.selectOption('high');
  }

  const reminderTimeSelect = page.locator('select[name="reminderTime"]');
  if (await reminderTimeSelect.count()) {
    await reminderTimeSelect.selectOption('15');
  }
}

test.describe('Time Scheduling Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);

    await page.evaluate(() => {
      localStorage.removeItem('timeSchedules');
      localStorage.removeItem('volunteerAssignments');
      localStorage.removeItem('activeMeetings');
    });

    await loginAsStudent(page);
  });

  test('1. login works and redirects to student page', async ({ page }) => {
    await expect(page).toHaveURL(/\/student$/);
  });

  test('2. schedule create page opens correctly', async ({ page }) => {
    await openCreatePage(page);

    await expect(page.locator('select[name="title"]')).toBeVisible();
    await expect(page.locator('textarea[name="description"]')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
    await expect(page.locator('input[name="startTime"]')).toBeVisible();
    await expect(page.locator('input[name="endTime"]')).toBeVisible();

    await waitForSubjectOptions(page);
  });

  test('3. create page required fields are present', async ({ page }) => {
    await openCreatePage(page);

    await expect(page.locator('select[name="title"]')).toHaveAttribute('name', 'title');
    await expect(page.locator('input[name="date"]')).toHaveAttribute('type', 'date');
    await expect(page.locator('input[name="startTime"]')).toHaveAttribute('type', 'time');
    await expect(page.locator('input[name="endTime"]')).toHaveAttribute('type', 'time');

    const formValidity = await page.locator('form').evaluate((form: HTMLFormElement) => form.checkValidity());
    expect(formValidity).toBeFalsy();
  });

  test('4. create a new schedule successfully', async ({ page }) => {
    const description = 'Playwright created schedule';
    const scheduleDate = getTomorrowDate();

    await openCreatePage(page);
    await fillBasicScheduleForm(page, description, scheduleDate, '10:00', '11:00');

    await page.click('button[type="submit"]');
    await page.waitForURL('**/schedule/manage', { timeout: 15000 });

    await expect(page).toHaveURL(/schedule\/manage/);
    await expect(page.locator('body')).toContainText(description);
  });

  test('5. created schedule is saved in localStorage', async ({ page }) => {
    const description = 'Playwright localStorage test';
    const scheduleDate = getTomorrowDate();

    await openCreatePage(page);
    await fillBasicScheduleForm(page, description, scheduleDate, '12:00', '13:00');

    await page.click('button[type="submit"]');
    await page.waitForURL('**/schedule/manage', { timeout: 15000 });

    const schedules = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('timeSchedules') || '[]')
    );

    expect(schedules.length).toBeGreaterThan(0);
    expect(schedules.some((s: any) => s.description === description)).toBeTruthy();
  });

  test('6. manage page opens correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/schedule/manage`, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/schedule\/manage/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('7. overlapping time should block creating second schedule', async ({ page }) => {
    const scheduleDate = getTomorrowDate();

    await openCreatePage(page);
    await fillBasicScheduleForm(page, 'First schedule', scheduleDate, '14:00', '15:00');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/schedule/manage', { timeout: 15000 });

    await openCreatePage(page);
    await fillBasicScheduleForm(page, 'Overlapping schedule', scheduleDate, '14:30', '15:30');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText(
      /conflicts with an existing schedule|Please choose a different time slot/i
    );
  });

  test('8. end time before start time should show validation error', async ({ page }) => {
    const scheduleDate = getTomorrowDate();

    await openCreatePage(page);
    await fillBasicScheduleForm(page, 'Invalid time test', scheduleDate, '16:00', '15:00');
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText(/End time must be after start time/i);
  });
});