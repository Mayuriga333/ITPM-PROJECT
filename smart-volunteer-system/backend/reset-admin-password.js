const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://admin:7z4r6mUJr6fm2Dft@cluster0.cpz2rgf.mongodb.net/volunteer_system?retryWrites=true&w=majority';

async function resetAdminPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find and update admin user
    const admin = await User.findOne({ email: 'admin@volunteerhub.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found, resetting password...');

    // Set the password directly (it will be hashed by the pre-save hook)
    admin.password = 'admin123';
    await admin.save();

    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email: admin@volunteerhub.com');
    console.log('🔑 Password: admin123');

    // Test the login
    const testAdmin = await User.findOne({ email: 'admin@volunteerhub.com' }).select('+password');
    const isMatch = await testAdmin.comparePassword('admin123');
    console.log('🧪 Password test result:', isMatch ? '✅ PASS' : '❌ FAIL');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

resetAdminPassword();
