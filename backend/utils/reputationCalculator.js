/**
 * Recalculate volunteer reputation score (0-100)
 *
 * Based on:
 *  - Average rating (30%)
 *  - Number of completed sessions (25%)
 *  - Response rate (20%)
 *  - Review consistency (15%)
 *  - Session completion reliability (10%)
 */
exports.recalculateReputation = (volunteer) => {
  // 1. Average Rating Score (0-100) — 30%
  const ratingScore = (volunteer.averageRating / 5) * 100;

  // 2. Sessions Score (0-100) — 25%
  // Scale: 0 sessions = 0, 50+ sessions = 100
  const sessionsScore = Math.min(100, (volunteer.completedSessions / 50) * 100);

  // 3. Response Rate Score (0-100) — 20%
  const responseScore = volunteer.responseRate || 0;

  // 4. Review Consistency Score (0-100) — 15%
  // Higher if ratings are consistently high (low standard deviation)
  let consistencyScore = 50; // default
  if (volunteer.totalReviews > 0) {
    const breakdown = volunteer.ratingBreakdown;
    const total = volunteer.totalReviews;
    const mean = volunteer.averageRating;

    // Calculate variance
    const variance =
      ((breakdown.five * Math.pow(5 - mean, 2) +
        breakdown.four * Math.pow(4 - mean, 2) +
        breakdown.three * Math.pow(3 - mean, 2) +
        breakdown.two * Math.pow(2 - mean, 2) +
        breakdown.one * Math.pow(1 - mean, 2)) /
        total);

    const stdDev = Math.sqrt(variance);
    // Lower std dev = higher consistency (max std dev for 1-5 scale is ~2)
    consistencyScore = Math.max(0, 100 - stdDev * 50);
  }

  // 5. Session Completion Reliability (0-100) — 10%
  let completionRate = 100;
  if (volunteer.totalSessionsAssigned > 0) {
    completionRate = (volunteer.completedSessions / volunteer.totalSessionsAssigned) * 100;
  }

  // Weighted calculation
  const reputation =
    ratingScore * 0.3 +
    sessionsScore * 0.25 +
    responseScore * 0.2 +
    consistencyScore * 0.15 +
    completionRate * 0.1;

  return Math.round(Math.min(100, Math.max(0, reputation)));
};
