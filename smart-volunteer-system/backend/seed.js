/**
 * seed.js — Populates MongoDB with sample data including admin account
 *
 * Usage: node seed.js
 *
 * Creates:
 *   1 Admin account
 *   1 Student (auto-approved)
 *   6 Volunteers (mix of pending/approved/rejected)
 *   6 VolunteerProfiles (mix of approval statuses)
 */

require('dotenv').config();
const mongoose         = require('mongoose');
const bcrypt           = require('bcryptjs');
const User             = require('./models/User');
const VolunteerProfile = require('./models/VolunteerProfile');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/volunteer_system';

const sampleVolunteers = [
  {
    user: { name: 'Dr. Alice Chen',  email: 'alice@example.com',  role: 'Volunteer', status: 'Approved' },
    profile: { skills: ['Mathematics','Calculus','Statistics','Physics'], availability: ['Morning','Weekend'], experienceLevel: 8, rating: 4.9, bio: 'PhD in Applied Mathematics. Making complex topics accessible.', approvalStatus: 'Approved' },
  },
  {
    user: { name: 'Bob Martinez',    email: 'bob@example.com',    role: 'Volunteer', status: 'Approved' },
    profile: { skills: ['Computer Science','Python','Data Structures','Algorithms'], availability: ['Evening','Weekend','Afternoon'], experienceLevel: 5, rating: 4.7, bio: 'Senior software engineer and CS mentor.', approvalStatus: 'Approved' },
  },
  {
    user: { name: 'Sarah Johnson',   email: 'sarah@example.com',  role: 'Volunteer', status: 'Approved' },
    profile: { skills: ['Chemistry','Organic Chemistry','Biology','Biochemistry'], availability: ['Morning','Afternoon'], experienceLevel: 3, rating: 4.5, bio: 'MSc Chemistry student passionate about reactions.', approvalStatus: 'Approved' },
  },
  {
    user: { name: 'Prof. David Kim', email: 'david@example.com',  role: 'Volunteer', status: 'Approved' },
    profile: { skills: ['Physics','Quantum Mechanics','Thermodynamics','Mathematics'], availability: ['Weekend','Evening'], experienceLevel: 12, rating: 5.0, bio: 'Retired physics professor. Every student can succeed.', approvalStatus: 'Approved' },
  },
  {
    user: { name: 'Emma Wilson',     email: 'emma@example.com',   role: 'Volunteer', status: 'Pending' },
    profile: { skills: ['English','Essay Writing','Literature','History'], availability: ['Morning','Afternoon','Evening'], experienceLevel: 4, rating: 4.6, bio: 'English teacher and literature enthusiast.', approvalStatus: 'Pending' },
  },
  {
    user: { name: 'Ravi Patel',      email: 'ravi@example.com',   role: 'Volunteer', status: 'Rejected', statusReason: 'Provided credentials could not be verified.' },
    profile: { skills: ['Economics','Statistics','Mathematics','Finance'], availability: ['Weekday','Morning'], experienceLevel: 6, rating: 4.4, bio: 'Economist with data focus.', approvalStatus: 'Rejected', moderationNotes: 'Credentials not verified. Account rejected.' },
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await VolunteerProfile.deleteMany({});
    console.log('🗑  Cleared existing data');

    // ── Admin account ─────────────────────────────────────────────────────────
    const admin = await User.create({
      name:     'Platform Admin',
      email:    'admin@example.com',
      password: 'password123',
      role:     'Admin',
      status:   'Approved',
    });
    console.log('✅ Created admin: admin@example.com');

    // ── Student account ───────────────────────────────────────────────────────
    await User.create({
      name:     'Test Student',
      email:    'student@example.com',
      password: 'password123',
      role:     'Student',
      status:   'Approved',
    });
    console.log('✅ Created student: student@example.com');

    // ── Volunteers ────────────────────────────────────────────────────────────
    for (const v of sampleVolunteers) {
      const user = await User.create({
        ...v.user,
        password:        'password123',
        statusUpdatedBy: admin._id,
        statusUpdatedAt: new Date(),
      });
      await VolunteerProfile.create({
        userId:      user._id,
        ...v.profile,
        moderatedBy: admin._id,
        moderatedAt: new Date(),
      });
      console.log(`✅ Created volunteer: ${v.user.name} [${v.profile.approvalStatus}]`);
    }

    console.log('\n🎉 Seed complete!\n');
    console.log('── Login credentials ──────────────────────────────');
    console.log('Admin:     admin@example.com   / password123');
    console.log('Student:   student@example.com / password123');
    console.log('Volunteer: alice@example.com   / password123  [Approved]');
    console.log('Volunteer: emma@example.com    / password123  [Pending]');
    console.log('Volunteer: ravi@example.com    / password123  [Rejected]');
    console.log('───────────────────────────────────────────────────\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();