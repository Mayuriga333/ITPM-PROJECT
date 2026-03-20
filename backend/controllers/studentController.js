const Student = require('../models/Student');
const SupportRequest = require('../models/SupportRequest');

// Register a new student
exports.registerStudent = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this email' });
    }
    
    // Create new student
    const student = new Student({
      name,
      email
    });
    
    await student.save();
    
    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student by email or ID
exports.getStudent = async (req, res) => {
  try {
    let student;
    
    if (req.query.email) {
      student = await Student.findOne({ email: req.query.email });
    } else {
      student = await Student.findById(req.params.id);
    }
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student's support requests with status counts
exports.getStudentRequests = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Get all requests for this student
    const requests = await SupportRequest.find({ student: studentId })
      .populate('volunteer', 'name subjects rating')
      .sort({ createdAt: -1 });
    
    // Calculate status counts
    const statusCounts = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length
    };
    
    // Group requests by status
    const groupedRequests = {
      pending: requests.filter(r => r.status === 'pending'),
      accepted: requests.filter(r => r.status === 'accepted'),
      rejected: requests.filter(r => r.status === 'rejected'),
      completed: requests.filter(r => r.status === 'completed'),
      underReview: requests.filter(r => r.status === 'pending') // For UI matching
    };
    
    res.json({
      success: true,
      counts: statusCounts,
      data: groupedRequests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student dashboard stats
exports.getStudentStats = async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const requests = await SupportRequest.find({ student: studentId });
    
    const stats = {
      totalSubmitted: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};