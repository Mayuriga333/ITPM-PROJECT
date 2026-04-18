/**
 * Calculate Smart Matching Score
 *
 * Matching Score =
 *   (Subject Match × 40%) +
 *   (Availability Match × 25%) +
 *   (Experience Level Match × 15%) +
 *   (Rating Score × 10%) +
 *   (Reputation Score × 10%)
 */
exports.calculateMatchingScore = (volunteer, preferences) => {
  const { subject, preferredDay, preferredTime, experienceLevel } = preferences;

  // 1. Subject Match (0-100) × 40%
  let subjectScore = 0;
  if (subject) {
    const subjectLower = subject.toLowerCase();
    const matchingSubjects = volunteer.subjects.filter((s) =>
      s.toLowerCase().includes(subjectLower) || subjectLower.includes(s.toLowerCase())
    );
    if (matchingSubjects.length > 0) {
      // Exact match gives 100, partial gives 70
      const exactMatch = volunteer.subjects.some(
        (s) => s.toLowerCase() === subjectLower
      );
      subjectScore = exactMatch ? 100 : 70;
    }
  }

  // 2. Availability Match (0-100) × 25%
  let availabilityScore = 50; // Default if no preferred day
  if (preferredDay && volunteer.availability) {
    const dayAvail = volunteer.availability[preferredDay.toLowerCase()];
    if (dayAvail && dayAvail.available) {
      availabilityScore = 100;

      // Bonus check for time overlap
      if (preferredTime && dayAvail.from && dayAvail.to) {
        const prefHour = parseInt(preferredTime.split(":")[0]);
        const fromHour = parseInt(dayAvail.from.split(":")[0]);
        const toHour = parseInt(dayAvail.to.split(":")[0]);
        if (prefHour >= fromHour && prefHour < toHour) {
          availabilityScore = 100;
        } else {
          availabilityScore = 60; // Available that day but not at that time
        }
      }
    } else {
      availabilityScore = 0;
    }
  }

  // 3. Experience Level Match (0-100) × 15%
  let experienceScore = 50; // Default
  if (experienceLevel) {
    const levels = ["beginner", "intermediate", "advanced", "expert"];
    const prefIndex = levels.indexOf(experienceLevel.toLowerCase());
    const volIndex = levels.indexOf(volunteer.experienceLevel);

    if (prefIndex >= 0 && volIndex >= 0) {
      if (volIndex === prefIndex) {
        experienceScore = 100;
      } else if (volIndex > prefIndex) {
        // Volunteer is more experienced — good!
        experienceScore = 90;
      } else {
        // Volunteer is less experienced
        const diff = prefIndex - volIndex;
        experienceScore = Math.max(0, 100 - diff * 30);
      }
    }
  }

  // 4. Rating Score (0-100) × 10%
  const ratingScore = (volunteer.averageRating / 5) * 100;

  // 5. Reputation Score (0-100) × 10%
  const reputationScore = volunteer.reputationScore || 50;

  // Weighted total
  const total =
    subjectScore * 0.4 +
    availabilityScore * 0.25 +
    experienceScore * 0.15 +
    ratingScore * 0.1 +
    reputationScore * 0.1;

  return {
    total: Math.round(total * 10) / 10,
    breakdown: {
      subject: Math.round(subjectScore * 10) / 10,
      availability: Math.round(availabilityScore * 10) / 10,
      experience: Math.round(experienceScore * 10) / 10,
      rating: Math.round(ratingScore * 10) / 10,
      reputation: Math.round(reputationScore * 10) / 10,
    },
  };
};
