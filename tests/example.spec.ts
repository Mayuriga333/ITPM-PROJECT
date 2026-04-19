import { test, expect } from '@playwright/test';

test.describe('Time Schedule pages', () => {
  test('open TimeScheduleCreate page', async ({ page }) => {
    await page.goto('http://localhost:5173/timeschedulecreate');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/timeschedulecreate/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('open TimeScheduleManage page', async ({ page }) => {
    await page.goto('http://localhost:5173/timeschedulemanage');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/timeschedulemanage/i);
    await expect(page.locator('body')).toBeVisible();
  });
});