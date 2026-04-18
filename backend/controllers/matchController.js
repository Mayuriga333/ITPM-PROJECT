/**
 * controllers/matchController.js — Smart Matching Algorithm
 *
 * Only volunteers with:
 *   user.status === 'Approved'  AND
 *   profile.approvalStatus === 'Approved'
 * are included in matching results.
 *
 * Scoring:
 *   +50  Skill match
 *   +20  Availability match
 *   +10  Experience bonus (any experience > 0)
 *   +5×rating  Rating score (max 25)
 *   Total max: ~105 points
 */

const ChatSession        = require('../models/ChatSession');
const VolunteerProfile   = require('../models/VolunteerProfile');
const StudyVolunteer     = require('../models/StudyVolunteer');

const calculateScore = (profile, needs) => {
  let score = 0;
  const breakdown = { skill: 0, availability: 0, experience: 0, rating: 0 };

  const subjectLower = (needs.subject || '').toLowerCase();
  const skillMatch   = profile.skills.some(
    (s) => s.toLowerCase().includes(subjectLower) || subjectLower.includes(s.toLowerCase())
  );
  if (skillMatch) { breakdown.skill = 50; score += 50; }

  const timeLower       = (needs.preferredTime || '').toLowerCase();
  const availabilityMatch = profile.availability.some(
    (a) => a.toLowerCase().includes(timeLower) || timeLower.includes(a.toLowerCase())
  );
  if (availabilityMatch) { breakdown.availability = 20; score += 20; }

  if (profile.experienceLevel > 0) { breakdown.experience = 10; score += 10; }

  const ratingScore = Math.round(profile.rating * 5);
  breakdown.rating  = ratingScore;
  score            += ratingScore;

  return { score, breakdown };
};

/**
 * GET /api/match/volunteers  (Student only)
 * Reads the student's completed chat session and returns top 3 matches.
 * Only 'Approved' volunteers with 'Approved' profiles are considered.
 */
const getMatches = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ userId: req.user._id });
    if (!session || session.currentStep < 4) {
      return res.status(400).json({
        success: false,
        message: 'Please complete the chatbot conversation first to collect your requirements.',
      });
    }

    const { subject, topic, preferredTime } = session.collectedData;

    // Fetch only fully-approved volunteers
    const profiles = await VolunteerProfile.find({ approvalStatus: 'Approved' })
      .populate({
        path:   'userId',
        select: 'name email status',
        match:  { status: 'Approved' },  // Only include active user accounts
      });

    // Filter out any profiles whose userId didn't match (null after populate)
    const activeProfiles = profiles.filter((p) => p.userId !== null);

    if (activeProfiles.length === 0) {
      return res.json({
        success: true,
        matches: [],
        message: 'No approved volunteers are currently available.',
        needs:   { subject, topic, preferredTime },
      });
    }

    // Build a map of userId → StudyVolunteer._id for the "Request Support" button
    const userIds = activeProfiles.map((p) => p.userId._id);
    const studyVols = await StudyVolunteer.find({ user: { $in: userIds } }, '_id user');
    const studyVolMap = new Map(studyVols.map((sv) => [sv.user.toString(), sv._id.toString()]));

    const scored = activeProfiles
      .map((profile) => {
        const { score, breakdown } = calculateScore(profile, { subject, topic, preferredTime });
        return {
          score,
          breakdown,
          profile: {
            _id:               profile._id,
            userId:            profile.userId._id,
            name:              profile.userId.name,
            email:             profile.userId.email,
            skills:            profile.skills,
            availability:      profile.availability,
            experienceLevel:   profile.experienceLevel,
            rating:            profile.rating,
            bio:               profile.bio,
            approvalStatus:    profile.approvalStatus,
            studyVolunteerId:  studyVolMap.get(profile.userId._id.toString()) || null,
          },
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    res.json({ success: true, needs: { subject, topic, preferredTime }, matches: scored, total: activeProfiles.length });
  } catch (err) {
    console.error('[Match/getMatches]', err);
    res.status(500).json({ success: false, message: 'Matching service error.' });
  }
};

/**
 * POST /api/match/profile  (Volunteer only)
 * Upserts the volunteer's own profile.
 * Resets approvalStatus to 'Pending' when profile content changes.
 */
const upsertProfile = async (req, res) => {
  try {
    const { skills, availability, experienceLevel, rating, bio } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one skill is required.' });
    }
    if (!availability || !Array.isArray(availability) || availability.length === 0) {
      return res.status(400).json({ success: false, message: 'Availability is required.' });
    }

    // Reset to Pending when volunteer updates their profile (re-review required)
    const profile = await VolunteerProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        skills,
        availability,
        experienceLevel: experienceLevel || 0,
        rating:          rating           || 3.0,
        bio:             bio              || '',
        approvalStatus:  'Pending',        // Back to queue for admin review
        moderationNotes: '',
        moderatedBy:     null,
        moderatedAt:     null,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated. It will be reviewed by an admin before appearing in search results.',
      profile,
    });
  } catch (err) {
    console.error('[Match/upsertProfile]', err);
    res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

/**
 * GET /api/match/profile  (Volunteer only)
 */
const getMyProfile = async (req, res) => {
  try {
    const profile = await VolunteerProfile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
    res.json({ success: true, profile });
  } catch (err) {
    console.error('[Match/getMyProfile]', err);
    res.status(500).json({ success: false, message: 'Could not fetch profile.' });
  }
};

module.exports = { getMatches, upsertProfile, getMyProfile };