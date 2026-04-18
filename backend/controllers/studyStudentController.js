const StudyStudent = require('../models/StudyStudent');
const SupportRequest = require('../models/SupportRequest');

// Register a new study student
exports.registerStudent = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const existingStudent = await StudyStudent.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this email' });
    }
    
    const student = new StudyStudent({ name, email });
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
      student = await StudyStudent.findOne({ email: req.query.email });
    } else {
      student = await StudyStudent.findById(req.params.id);
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
    const { studentName } = req.query;

    const query = studentName
      ? { $or: [{ student: studentId }, { studentName }] }
      : { student: studentId };

    const requests = await SupportRequest.find(query)
      .populate('volunteer', 'name subjects rating')
      .sort({ createdAt: -1 });
    
    const statusCounts = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length
    };
    
    const groupedRequests = {
      pending: requests.filter(r => r.status === 'pending'),
      accepted: requests.filter(r => r.status === 'accepted'),
      rejected: requests.filter(r => r.status === 'rejected'),
      completed: requests.filter(r => r.status === 'completed'),
      underReview: requests.filter(r => r.status === 'pending')
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
    const { studentName } = req.query;

    const query = studentName
      ? { $or: [{ student: studentId }, { studentName }] }
      : { student: studentId };

    const requests = await SupportRequest.find(query);
    
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
