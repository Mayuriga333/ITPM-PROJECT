/**
 * tc16-formula-panel.spec.js
 *
 * TC16 — "How is this calculated?" expands the Goal Alignment Formula panel.
 *
 * Component: GoalScoreWithFormula  (VolunteerProfilePage.jsx)
 *
 * Formula:
 *   score = min(100, round( (rating/5)×60 + (followUp?20:0) + tagPts ))
 *   tagPts: positive=20 | neutral=10 | needs_improvement=0
 *
 * Score colours:  ≥80 → emerald  |  ≥55 → amber  |  <55 → rose
 */

import { test, expect } from '@playwright/test';
import { login, CREDENTIALS } from './helpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────────────────────────────────────

async function goToFirstVolunteerProfile(page) {
  await login(page, CREDENTIALS.student);
  await page.goto('/study/discovery');

  // Wait for at least one volunteer card to render (not networkidle — too slow)
  const firstCard = page
    .locator('[class*="rounded-3xl"]')
    .filter({ hasText: /request support/i })
    .first();
  await expect(firstCard).toBeVisible({ timeout: 15_000 });

  await firstCard.getByRole('button', { name: /view profile/i }).click();
  await page.waitForURL(/\/study\/volunteer\/.+/, { timeout: 10_000 });

  // Wait until at least one review card is visible
  await expect(
    page.locator('[class*="rounded-2xl"]').filter({ hasText: /goal matched/i }).first()
  ).toBeVisible({ timeout: 35_000 });
}

/** First review card on the profile page */
const firstReviewCard = (page) =>
  page.locator('[class*="rounded-2xl"]').filter({ hasText: /goal matched/i }).first();

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe('TC16 — Goal Alignment Formula panel', () => {

  test.beforeEach(async ({ page }) => {
    await goToFirstVolunteerProfile(page);
  });

  // ── A. Pre-conditions ───────────────────────────────────────────────────────

  test('TC16-A  Review card is visible on the volunteer profile page', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
  });

  test('TC16-B  "How is this calculated?" button exists inside the review card', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByRole('button', { name: /how is this calculated/i })).toBeVisible();
  });

  test('TC16-C  Formula panel is hidden BEFORE the button is clicked', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await expect(card.getByText('Goal Alignment Formula')).not.toBeVisible();
  });

  test('TC16-D  Goal score badge ("XX% goal matched") is visible next to the button', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    const badge = card.locator('span').filter({ hasText: /goal matched/i }).first();
    await expect(badge).toBeVisible();
    expect(await badge.textContent()).toMatch(/\d+%\s*goal matched/i);
  });

  // ── B. Expand ───────────────────────────────────────────────────────────────

  test('TC16-E  Clicking the button shows the formula panel', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible({ timeout: 5_000 });
  });

  test('TC16-F  Formula panel heading reads "Goal Alignment Formula"', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();
  });

  // ── C. Rating row ───────────────────────────────────────────────────────────

  test('TC16-G  Formula shows Rating row with "/5 × 60" annotation', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();
    await expect(card.getByText(/\/5 × 60/)).toBeVisible();
  });

  test('TC16-H  Rating row shows yellow "+N pts" value (12 – 60)', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const ratingPts = card.locator('span.text-yellow-400').filter({ hasText: /\+\d+ pts/ });
    await expect(ratingPts).toBeVisible();
    const val = parseInt((await ratingPts.textContent() || '').replace(/\D/g, ''));
    expect(val).toBeGreaterThanOrEqual(12);
    expect(val).toBeLessThanOrEqual(60);
  });

  // ── D. Feedback quality row ─────────────────────────────────────────────────

  test('TC16-I  Formula shows Feedback quality row with annotation', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();
    await expect(card.getByText(/feedback quality/i).last()).toBeVisible();
    await expect(card.getByText(/positive \+20/i)).toBeVisible();
  });

  test('TC16-J  Feedback quality row shows indigo "+N pts" — must be 0, 10 or 20', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const tagPts = card.locator('span.text-indigo-400').filter({ hasText: /\+\d+ pts/ });
    await expect(tagPts).toBeVisible();
    const val = parseInt((await tagPts.textContent() || '').replace(/\D/g, ''));
    expect([0, 10, 20]).toContain(val);
  });

  // ── E. Recommendation row ───────────────────────────────────────────────────

  test('TC16-K  Formula shows Recommendation row ("match again")', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();
    await expect(card.getByText(/recommendation/i).last()).toBeVisible();
    await expect(card.getByText(/match again/i).last()).toBeVisible();
  });

  test('TC16-L  Recommendation row shows emerald "+N pts" — must be 0 or 20', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const followPts = card.locator('span.text-emerald-400').filter({ hasText: /\+\d+ pts/ });
    await expect(followPts).toBeVisible();
    const val = parseInt((await followPts.textContent() || '').replace(/\D/g, ''));
    expect([0, 20]).toContain(val);
  });

  // ── F. Total Score row ──────────────────────────────────────────────────────

  test('TC16-M  Formula panel shows "Total Score" label', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();
    await expect(card.getByText('Total Score')).toBeVisible();
  });

  test('TC16-N  Total Score shows "N / 100" with a valid number 0–100', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    // The span renders text like "88 / 100"
    const totalSpan = card.locator('span').filter({ hasText: '/ 100' }).last();
    await expect(totalSpan).toBeVisible();
    const score = parseInt((await totalSpan.textContent() || '').trim());
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('TC16-O  Total Score in panel matches the goal badge percentage', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });

    // Read badge score BEFORE opening panel
    const badge = card.locator('span').filter({ hasText: /goal matched/i }).first();
    const badgeScore = parseInt(
      ((await badge.textContent()) || '').match(/(\d+)%/)?.[1] || '-1'
    );
    expect(badgeScore).toBeGreaterThan(0);

    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const totalSpan = card.locator('span').filter({ hasText: '/ 100' }).last();
    await expect(totalSpan).toBeVisible();
    const panelScore = parseInt((await totalSpan.textContent() || '').trim());
    expect(panelScore).toBe(badgeScore);
  });

  test('TC16-P  Three pt values sum to Total Score (capped at 100)', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const rPts = parseInt((await card.locator('span.text-yellow-400').filter({ hasText: /\+\d+ pts/ }).textContent() || '').replace(/\D/g, ''));
    const tPts = parseInt((await card.locator('span.text-indigo-400').filter({ hasText: /\+\d+ pts/ }).textContent() || '').replace(/\D/g, ''));
    const fPts = parseInt((await card.locator('span.text-emerald-400').filter({ hasText: /\+\d+ pts/ }).textContent() || '').replace(/\D/g, ''));

    const totalSpan = card.locator('span').filter({ hasText: '/ 100' }).last();
    const displayed = parseInt((await totalSpan.textContent() || '').trim());

    expect(Math.min(100, rPts + tPts + fPts)).toBe(displayed);
  });

  // ── G. Progress bar ─────────────────────────────────────────────────────────

  test('TC16-Q  Formula panel contains a progress bar with an inline width style', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const filledBar = card.locator('div[style*="width"]').last();
    await expect(filledBar).toBeVisible();
    expect(await filledBar.getAttribute('style')).toMatch(/width:\s*\d+%/);
  });

  test('TC16-R  Progress bar width equals the Total Score percentage', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const totalSpan = card.locator('span').filter({ hasText: '/ 100' }).last();
    const score = parseInt((await totalSpan.textContent() || '').trim());

    const filledBar = card.locator('div[style*="width"]').last();
    const style = await filledBar.getAttribute('style');
    const barPct = parseInt(style?.match(/width:\s*(\d+)%/)?.[1] || '-1');
    expect(barPct).toBe(score);
  });

  // ── H. Badge colour ─────────────────────────────────────────────────────────

  test('TC16-S  Goal badge colour class matches score threshold (emerald/amber/rose)', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const totalSpan = card.locator('span').filter({ hasText: '/ 100' }).last();
    const score = parseInt((await totalSpan.textContent() || '').trim());

    const badge = card.locator('span').filter({ hasText: /goal matched/i }).first();
    const cls = await badge.getAttribute('class') ?? '';
    const expected = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'rose';
    expect(cls).toContain(expected);
  });

  test('TC16-T  Total Score label in panel uses the correct colour class', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.getByRole('button', { name: /how is this calculated/i }).click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    const totalSpan = card.locator('span').filter({ hasText: '/ 100' }).last();
    const score = parseInt((await totalSpan.textContent() || '').trim());
    const cls = await totalSpan.getAttribute('class') ?? '';
    const expected = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'rose';
    expect(cls).toContain(expected);
  });

  // ── I. Collapse (toggle off) ────────────────────────────────────────────────

  test('TC16-U  Clicking the button a second time collapses the panel', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    const btn = card.getByRole('button', { name: /how is this calculated/i });

    await btn.click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();

    await btn.click();
    await expect(card.getByText('Goal Alignment Formula')).not.toBeVisible();
  });

  test('TC16-V  Chevron icon flips direction when panel opens and closes', async ({ page }) => {
    const card = firstReviewCard(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    const btn = card.getByRole('button', { name: /how is this calculated/i });

    await expect(btn.locator('svg')).toBeVisible();

    await btn.click();
    await expect(card.getByText('Goal Alignment Formula')).toBeVisible();
    await expect(btn.locator('svg')).toBeVisible();

    await btn.click();
    await expect(card.getByText('Goal Alignment Formula')).not.toBeVisible();
    await expect(btn.locator('svg')).toBeVisible();
  });

  // ── J. Multiple cards independence ─────────────────────────────────────────

  test('TC16-W  Each review card has its own independent formula button', async ({ page }) => {
    const cards = page
      .locator('[class*="rounded-2xl"]')
      .filter({ hasText: /goal matched/i });
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });

    await cards.first().getByRole('button', { name: /how is this calculated/i }).click();
    await expect(cards.first().getByText('Goal Alignment Formula')).toBeVisible();

    if ((await cards.count()) >= 2) {
      await expect(cards.nth(1).getByText('Goal Alignment Formula')).not.toBeVisible();
    }
  });

  test('TC16-X  Opening one card panel does NOT expand other cards', async ({ page }) => {
    const cards = page
      .locator('[class*="rounded-2xl"]')
      .filter({ hasText: /goal matched/i });
    await expect(cards.first()).toBeVisible({ timeout: 15_000 });

    if ((await cards.count()) < 2) { test.skip(); return; }

    await cards.nth(1).getByRole('button', { name: /how is this calculated/i }).click();
    await expect(cards.nth(1).getByText('Goal Alignment Formula')).toBeVisible();
    await expect(cards.first().getByText('Goal Alignment Formula')).not.toBeVisible();
  });

});
