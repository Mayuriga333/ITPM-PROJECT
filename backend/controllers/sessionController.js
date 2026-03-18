const Session = require("../models/Session");
const Volunteer = require("../models/Volunteer");
const { recalculateReputation } = require("../utils/reputationCalculator");

// @desc    Create a new session request
// @route   POST /api/sessions
exports.createSession = async (req, res) => {
  try {
    const { volunteerId, subject, scheduledDate, scheduledTime, duration, notes } = req.body;

    const volunteer = await Volunteer.findById(volunteerId);
    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found" });
    }

    // Track request for response rate
    volunteer.totalRequests += 1;
    await volunteer.save();

    const session = await Session.create({
      student: req.user._id,
      volunteer: volunteerId,
      subject,
      scheduledDate,
      scheduledTime,
      duration: duration || 60,
      notes: notes || "",
    });

    const populated = await Session.findById(session._id)
      .populate("student", "name email")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name email" },
      });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sessions for current user
// @route   GET /api/sessions
exports.getMySessions = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (req.user.role === "student") {
      filter.student = req.user._id;
    } else if (req.user.role === "volunteer") {
      const volunteer = await Volunteer.findOne({ user: req.user._id });
      if (volunteer) {
        filter.volunteer = volunteer._id;
      }
    }

    if (status) {
      filter.status = status;
    }

    const sessions = await Session.find(filter)
      .populate("student", "name email avatar")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name email avatar" },
      })
      .sort({ scheduledDate: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session status (accept/reject)
// @route   PUT /api/sessions/:id/status
exports.updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const volunteer = await Volunteer.findById(session.volunteer);

    // Track response for response rate
    if (status === "accepted" || status === "rejected") {
      if (volunteer) {
        volunteer.totalResponses += 1;
        volunteer.responseRate = Math.round(
          (volunteer.totalResponses / volunteer.totalRequests) * 100
        );

        if (status === "accepted") {
          volunteer.totalSessionsAssigned += 1;
        }

        await volunteer.save();
      }
    }

    session.status = status;
    await session.save();

    const populated = await Session.findById(session._id)
      .populate("student", "name email avatar")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name email avatar" },
      });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Confirm session completion
// @route   PUT /api/sessions/:id/complete
exports.confirmCompletion = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "accepted") {
      return res.status(400).json({ message: "Session must be accepted first" });
    }

    const volunteer = await Volunteer.findById(session.volunteer);

    if (req.user.role === "student" && session.student.toString() === req.user._id.toString()) {
      session.studentConfirmedCompletion = true;
    } else if (req.user.role === "volunteer") {
      if (volunteer && volunteer.user.toString() === req.user._id.toString()) {
        session.volunteerConfirmedCompletion = true;
      }
    }

    // If both confirmed, mark as completed
    if (session.studentConfirmedCompletion && session.volunteerConfirmedCompletion) {
      session.status = "completed";

      if (volunteer) {
        volunteer.completedSessions += 1;
        volunteer.reputationScore = recalculateReputation(volunteer);
        await volunteer.save();
      }
    }

    await session.save();

    const populated = await Session.findById(session._id)
      .populate("student", "name email avatar")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name email avatar" },
      });

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get session by ID
// @route   GET /api/sessions/:id
exports.getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("student", "name email avatar")
      .populate({
        path: "volunteer",
        populate: { path: "user", select: "name email avatar" },
      });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
