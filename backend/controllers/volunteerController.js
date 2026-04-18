const Volunteer = require("../models/Volunteer");
const Review = require("../models/Review");
const User = require("../models/User");

// @desc    Get all volunteers (with optional filters)
// @route   GET /api/volunteers
exports.getVolunteers = async (req, res) => {
  try {
    const { subject, experienceLevel, minRating, sortBy } = req.query;

    let filter = { isApproved: true };

    if (subject) {
      filter.subjects = { $regex: new RegExp(subject, "i") };
    }
    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }

    let sortOption = { reputationScore: -1 };
    if (sortBy === "rating") sortOption = { averageRating: -1 };
    if (sortBy === "sessions") sortOption = { completedSessions: -1 };
    if (sortBy === "newest") sortOption = { createdAt: -1 };

    const volunteers = await Volunteer.find(filter)
      .populate("user", "name email avatar")
      .sort(sortOption);

    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get volunteer profile by ID
// @route   GET /api/volunteers/:id
exports.getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id).populate(
      "user",
      "name email avatar createdAt"
    );

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    // Get reviews for this volunteer
    const reviews = await Review.find({
      volunteer: volunteer._id,
      status: "approved",
    })
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ volunteer, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update volunteer profile
// @route   PUT /api/volunteers/:id
exports.updateVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    // Ensure only the owner can update
    if (volunteer.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { subjects, experienceLevel, bio, availability } = req.body;

    if (subjects) volunteer.subjects = subjects;
    if (experienceLevel) volunteer.experienceLevel = experienceLevel;
    if (bio !== undefined) volunteer.bio = bio;
    if (availability) volunteer.availability = availability;

    await volunteer.save();

    const updated = await Volunteer.findById(volunteer._id).populate(
      "user",
      "name email avatar"
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/volunteers/leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const topRated = await Volunteer.find({ isApproved: true, totalReviews: { $gte: 1 } })
      .populate("user", "name avatar")
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(10);

    const mostActive = await Volunteer.find({ isApproved: true })
      .populate("user", "name avatar")
      .sort({ completedSessions: -1 })
      .limit(10);

    const risingStars = await Volunteer.find({
      isApproved: true,
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    })
      .populate("user", "name avatar")
      .sort({ reputationScore: -1 })
      .limit(10);

    res.json({ topRated, mostActive, risingStars });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get volunteer profile for the logged-in volunteer user
// @route   GET /api/volunteers/me/profile
exports.getMyVolunteerProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ user: req.user._id }).populate(
      "user",
      "name email avatar"
    );

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer profile not found" });
    }

    res.json(volunteer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
