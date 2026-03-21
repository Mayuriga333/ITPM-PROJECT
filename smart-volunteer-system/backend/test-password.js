const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const MONGO_URI = 'mongodb+srv://admin:7z4r6mUJr6fm2Dft@cluster0.cpz2rgf.mongodb.net/volunteer_system?retryWrites=true&w=majority';

async function testPassword() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔍 Testing admin password...');
    
    const admin = await User.findOne({ email: 'admin@volunteerhub.com' }).select('+password');
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('📧 Email:', admin.email);
    console.log('🔐 Stored password hash length:', admin.password.length);
    
    // Test password comparison
    const isMatch = await admin.comparePassword('admin123');
    console.log('✅ Password match result:', isMatch);
    
    // Test manual bcrypt comparison
    const manualMatch = await bcrypt.compare('admin123', admin.password);
    console.log('🔧 Manual bcrypt match:', manualMatch);
    
    // Test with wrong password
    const wrongMatch = await admin.comparePassword('wrongpassword');
    console.log('❌ Wrong password match:', wrongMatch);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testPassword();
