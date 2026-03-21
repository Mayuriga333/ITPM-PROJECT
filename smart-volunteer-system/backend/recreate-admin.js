const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MONGO_URI = 'mongodb+srv://admin:7z4r6mUJr6fm2Dft@cluster0.cpz2rgf.mongodb.net/volunteer_system?retryWrites=true&w=majority';

async function recreateAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin user
    await User.deleteOne({ email: 'admin@volunteerhub.com' });
    console.log('🗑️ Deleted existing admin user');

    // Create new admin user using the same process as registration
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@volunteerhub.com',
      password: 'admin123', // This will be hashed by the pre-save hook
      role: 'Admin',
      status: 'Approved'
    });

    await admin.save();
    console.log('✅ New admin user created successfully!');
    
    // Test the password immediately
    const savedAdmin = await User.findOne({ email: 'admin@volunteerhub.com' }).select('+password');
    const isMatch = await savedAdmin.comparePassword('admin123');
    console.log('🔐 Password verification test:', isMatch ? '✅ PASSED' : '❌ FAILED');
    
    console.log('📧 Email: admin@volunteerhub.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change password after first login!');

  } catch (error) {
    console.error('❌ Error recreating admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

recreateAdmin();
