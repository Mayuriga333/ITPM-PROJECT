const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://admin:7z4r6mUJr6fm2Dft@cluster0.cpz2rgf.mongodb.net/volunteer_system?retryWrites=true&w=majority';

async function testAdminLogin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ email: 'admin@volunteerhub.com' }).select('+password');
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
    console.log('   Status:', admin.status);
    console.log('   Password hash exists:', !!admin.password);

    // Test password comparison
    const testPassword = 'admin123';
    const isMatch = await admin.comparePassword(testPassword);
    console.log('   Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('❌ Password does not match!');
      console.log('   Testing with plain password...');
      
      // Check if password is stored as plain text
      const plainMatch = admin.password === testPassword;
      console.log('   Plain text match:', plainMatch);
      
      if (plainMatch) {
        console.log('⚠️  Password is stored as plain text! Hashing it now...');
        const salt = await bcrypt.genSalt(12);
        admin.password = await bcrypt.hash(testPassword, salt);
        await admin.save();
        console.log('✅ Password hashed and saved');
      }
    } else {
      console.log('✅ Password matches!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAdminLogin();
