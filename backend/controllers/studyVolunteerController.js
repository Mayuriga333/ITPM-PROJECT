const StudyVolunteer = require('../models/StudyVolunteer');
const SupportRequest = require('../models/SupportRequest');

// Register a new study volunteer
exports.registerVolunteer = async (req, res) => {
  try {
    const { name, email, subjects, bio, availability } = req.body;
    
    const existingVolunteer = await StudyVolunteer.findOne({ email });
    if (existingVolunteer) {
      return res.status(400).json({ message: 'Volunteer already exists with this email' });
    }
    
    const volunteer = new StudyVolunteer({
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

// Get all study volunteers with filters
exports.getVolunteers = async (req, res) => {
  try {
    const { subject, availability, search, limit = 50 } = req.query;

    let query = {};
    
    if (subject) {
      query.subjects = subject;
    }
    
    if (availability && availability !== 'Any Time') {
      query.availability = availability;
    }
    
    if (search) {
      const re = { $regex: search, $options: 'i' };
      query.$or = [{ name: re }, { subjects: re }, { bio: re }];
    }
    
    const volunteers = await StudyVolunteer.find(query)
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

// Get study volunteer by ID
exports.getVolunteerById = async (req, res) => {
  try {
    const volunteer = await StudyVolunteer.findById(req.params.id);
    
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

// Get study volunteer's incoming requests
exports.getVolunteerRequests = async (req, res) => {
  try {
    const requests = await SupportRequest.find({
      volunteer: req.params.id,
      status: { $in: ['pending', 'accepted', 'rejected', 'completed'] }
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

// Get study volunteer dashboard stats
exports.getVolunteerStats = async (req, res) => {
  try {
    const volunteer = await StudyVolunteer.findById(req.params.id);
    
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }
    
    volunteer.canAcceptMoreSessions();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
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
