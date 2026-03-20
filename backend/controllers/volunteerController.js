const Volunteer = require('../models/volunteer');
const SupportRequest = require('../models/SupportRequest');

// Register a new volunteer
exports.registerVolunteer = async (req, res) => {
  try {
    const { name, email, subjects, bio, availability } = req.body;
    
    // Check if volunteer already exists
    const existingVolunteer = await Volunteer.findOne({ email });
    if (existingVolunteer) {
      return res.status(400).json({ message: 'Volunteer already exists with this email' });
    }
    
    // Create new volunteer
    const volunteer = new Volunteer({
      name,
      email,
      subjects,
      bio,
      availability: availability || 'Any Time'
    });
    
    await volunteer.save();
    
    res.status(201).json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all volunteers with filters
exports.getVolunteers = async (req, res) => {
  try {
    const { subject, availability, search, limit = 10 } = req.query;

    // Base query: return all volunteers by default
    let query = {};
    
    // Filter by subject
    if (subject) {
      query.subjects = subject;
    }
    
    // Filter by availability
    if (availability && availability !== 'Any Time') {
      query.availability = availability;
    }
    
    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const volunteers = await Volunteer.find(query)
      .sort({ rating: -1, totalSessions: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: volunteers.length,
      data: volunteers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get volunteer by ID
exports.getVolunteerById = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    
    res.json({
      success: true,
      data: volunteer
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get volunteer's incoming requests
exports.getVolunteerRequests = async (req, res) => {
  try {
    const requests = await SupportRequest.find({
      volunteer: req.params.id,
      status: { $in: ['pending', 'accepted'] }
    })
    .populate('student', 'name email')
    .sort({ date: 1, timeSlot: 1 });
    
    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get volunteer dashboard stats
exports.getVolunteerStats = async (req, res) => {
  try {
    const volunteer = await Volunteer.findById(req.params.id);
    
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    
    // Reset daily count if needed
    volunteer.canAcceptMoreSessions();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's accepted sessions
    const todaysAccepted = await SupportRequest.countDocuments({
      volunteer: req.params.id,
      status: 'accepted',
      date: { $gte: today, $lt: tomorrow }
    });
    
    volunteer.todaysSessions = todaysAccepted;
    await volunteer.save();
    
    const stats = {
      dailyLimit: volunteer.dailySessionLimit,
      todaysSessions: volunteer.todaysSessions,
      remainingToday: volunteer.dailySessionLimit - volunteer.todaysSessions
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};