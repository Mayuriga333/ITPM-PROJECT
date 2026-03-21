const mongoose = require('mongoose');
const User = require('./models/User');
const MONGO_URI = 'mongodb+srv://admin:7z4r6mUJr6fm2Dft@cluster0.cpz2rgf.mongodb.net/volunteer_system?retryWrites=true&w=majority';

async function checkAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('🔍 Checking for admin user...');
    
    const admin = await User.findOne({ email: 'admin@volunteerhub.com' });
    if (admin) {
      console.log('✅ Admin user found:');
      console.log('   Email:', admin.email);
      console.log('   Name:', admin.name);
      console.log('   Role:', admin.role);
      console.log('   Status:', admin.status);
    } else {
      console.log('❌ No admin user found');
    }
    
    const allUsers = await User.find({});
    console.log('📊 Total users in database:', allUsers.length);
    allUsers.forEach((user, i) => {
      console.log(`   ${i+1}. ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();
