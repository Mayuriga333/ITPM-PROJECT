exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide email, password and role.' });
    }

    let user = null;

    if (role === 'Student') {
      const Student = require('../models/Student');
      user = await Student.findOne({ email });
    } else if (role === 'Volunteer') {
      const Volunteer = require('../models/Volunteer');
      user = await Volunteer.findOne({ email });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role selected.' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Manual plaintext password check (For dummy mock version. NOT for production)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Send back session details
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication.' });
  }
};
