const Volunteer = require("../models/Volunteer");
const { calculateMatchingScore } = require("../utils/matchingScore");

// @desc    Get smart matched volunteers for a student
// @route   POST /api/matching
exports.getMatchedVolunteers = async (req, res) => {
  try {
    const { subject, preferredDay, preferredTime, experienceLevel } = req.body;

    if (!subject) {
      return res.status(400).json({ message: "Subject is required for matching" });
    }

    const volunteers = await Volunteer.find({ isApproved: true }).populate(
      "user",
      "name email avatar"
    );

    // Calculate weighted matching score for each volunteer
    const scoredVolunteers = volunteers.map((volunteer) => {
      const score = calculateMatchingScore(volunteer, {
        subject,
        preferredDay,
        preferredTime,
        experienceLevel,
      });

      return {
        volunteer,
        matchingScore: score.total,
        breakdown: score.breakdown,
      };
    });

    // Sort by matching score (highest first), filter out zero-score
    const ranked = scoredVolunteers
      .filter((sv) => sv.matchingScore > 0)
      .sort((a, b) => b.matchingScore - a.matchingScore);

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
