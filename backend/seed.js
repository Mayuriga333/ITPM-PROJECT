/**
 * seed.js — Comprehensive seed for the merged Smart Volunteer Platform
 *
 * Covers ALL 11 models:
 *   User, VolunteerProfile, Volunteer, Session, Review,
 *   ChatSession, Conversation, Message,
 *   StudyStudent, StudyVolunteer, SupportRequest
 *
 * Usage: node seed.js
 */

require('dotenv').config();
const mongoose           = require('mongoose');
const User               = require('./models/User');
const VolunteerProfile   = require('./models/VolunteerProfile');
const Volunteer          = require('./models/Volunteer');
const Session            = require('./models/Session');
const Review             = require('./models/Review');
const ChatSession        = require('./models/ChatSession');
const Conversation       = require('./models/Conversation');
const Message            = require('./models/Message');
const StudyStudent       = require('./models/StudyStudent');
const StudyVolunteer     = require('./models/StudyVolunteer');
const SupportRequest     = require('./models/SupportRequest');
const { recalculateReputation } = require('./utils/reputationCalculator');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/volunteer_system';
const PWD = 'password123';

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // ── Clear ALL collections ─────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      VolunteerProfile.deleteMany({}),
      Volunteer.deleteMany({}),
      Session.deleteMany({}),
      Review.deleteMany({}),
      ChatSession.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
      StudyStudent.deleteMany({}),
      StudyVolunteer.deleteMany({}),
      SupportRequest.deleteMany({}),
    ]);
    console.log('🗑  Cleared all 11 collections');

    // ══════════════════════════════════════════════════════════════════════════
    //  1. USERS  (Admin, Students, Volunteers — P1 Auth)
    // ══════════════════════════════════════════════════════════════════════════

    const admin = await User.create({
      name: 'Platform Admin', email: 'admin@educonnect.com',
      password: PWD, role: 'Admin', status: 'Approved',
    });

    const studentA = await User.create({
      name: 'Ava Perera', email: 'student@educonnect.com',
      password: PWD, role: 'Student', status: 'Approved',
    });

    const studentB = await User.create({
      name: 'Nimal Jayawardena', email: 'nimal.j@educonnect.com',
      password: PWD, role: 'Student', status: 'Approved',
    });

    const studentC = await User.create({
      name: 'Pending Student', email: 'pending.student@educonnect.com',
      password: PWD, role: 'Student', status: 'Pending',
    });

    console.log('✅ Admin + 3 Students created');

    // ── P1 Volunteers (with VolunteerProfile for matching) ────────────────────
    const p1VolData = [
      {
        user: { name: 'Dr. Alice Chen',  email: 'alice.chen@educonnect.com',  role: 'Volunteer', status: 'Approved' },
        profile: { skills: ['Mathematics','Calculus','Statistics','Physics'], availability: ['Morning','Weekend'], experienceLevel: 8, rating: 4.9, bio: 'PhD in Applied Mathematics with 8 years of teaching experience.', approvalStatus: 'Approved' },
      },
      {
        user: { name: 'Bob Martinez',    email: 'bob.m@educonnect.com',       role: 'Volunteer', status: 'Approved' },
        profile: { skills: ['Computer Science','Python','Data Structures','Algorithms'], availability: ['Evening','Weekend','Afternoon'], experienceLevel: 5, rating: 4.7, bio: 'Senior software engineer and CS mentor.', approvalStatus: 'Approved' },
      },
      {
        user: { name: 'Sarah Johnson',   email: 'sarah.j@educonnect.com',     role: 'Volunteer', status: 'Approved' },
        profile: { skills: ['Chemistry','Organic Chemistry','Biology','Biochemistry'], availability: ['Morning','Afternoon'], experienceLevel: 3, rating: 4.5, bio: 'MSc Chemistry student passionate about teaching.', approvalStatus: 'Approved' },
      },
      {
        user: { name: 'Prof. David Kim', email: 'david.k@educonnect.com',     role: 'Volunteer', status: 'Approved' },
        profile: { skills: ['Physics','Quantum Mechanics','Thermodynamics','Mathematics'], availability: ['Weekend','Evening'], experienceLevel: 12, rating: 5.0, bio: 'Retired physics professor with 12 yrs experience.', approvalStatus: 'Approved' },
      },
      {
        user: { name: 'Pending Volunteer', email: 'pending.vol@educonnect.com', role: 'Volunteer', status: 'Pending' },
        profile: { skills: ['English','Literature'], availability: ['Morning'], experienceLevel: 1, rating: 3.0, bio: 'New tutor awaiting approval.', approvalStatus: 'Pending' },
      },
    ];

    const p1Users = {};
    for (const v of p1VolData) {
      const user = await User.create({ ...v.user, password: PWD, statusUpdatedBy: admin._id, statusUpdatedAt: new Date() });
      await VolunteerProfile.create({ userId: user._id, ...v.profile, moderatedBy: admin._id, moderatedAt: new Date() });
      p1Users[v.user.email] = user;
      console.log(`✅ P1 Volunteer: ${v.user.name} [${v.profile.approvalStatus}]`);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  2. P2 — Volunteer Rating Profiles, Sessions, Reviews
    // ══════════════════════════════════════════════════════════════════════════

    // --- P2 Volunteers (with Volunteer model for ratings) ---
    const p2VolData = [
      {
        user: { name: 'Sarah Chen',   email: 'sarah.chen@educonnect.com', role: 'Volunteer', status: 'Approved' },
        volunteer: {
          subjects: ['Python', 'JavaScript', 'Data Science'], experienceLevel: 'expert',
          bio: 'CS graduate with 3 years of tutoring experience.',
          averageRating: 4.8, totalReviews: 12,
          ratingBreakdown: { five: 10, four: 1, three: 1, two: 0, one: 0 },
          completedSessions: 25, totalSessionsAssigned: 27,
          responseRate: 96, totalResponses: 27, totalRequests: 28,
          badges: ['top_rated', 'most_active'],
          availability: {
            monday:    { from: '09:00', to: '17:00', available: true },
            tuesday:   { from: '09:00', to: '17:00', available: true },
            wednesday: { from: '09:00', to: '12:00', available: true },
            thursday:  { from: '09:00', to: '17:00', available: true },
            friday:    { from: '09:00', to: '15:00', available: true },
            saturday:  { from: '10:00', to: '14:00', available: true },
            sunday:    { from: '', to: '', available: false },
          },
        },
      },
      {
        user: { name: 'Michael Lee', email: 'michael.lee@educonnect.com', role: 'Volunteer', status: 'Approved' },
        volunteer: {
          subjects: ['Mathematics', 'Physics', 'Calculus'], experienceLevel: 'advanced',
          bio: 'Math major who loves problem-solving.',
          averageRating: 4.5, totalReviews: 8,
          ratingBreakdown: { five: 5, four: 2, three: 1, two: 0, one: 0 },
          completedSessions: 15, totalSessionsAssigned: 16,
          responseRate: 94, totalResponses: 15, totalRequests: 16,
          badges: ['top_rated'],
          availability: {
            monday:    { from: '14:00', to: '20:00', available: true },
            tuesday:   { from: '14:00', to: '20:00', available: true },
            wednesday: { from: '', to: '', available: false },
            thursday:  { from: '14:00', to: '20:00', available: true },
            friday:    { from: '14:00', to: '20:00', available: true },
            saturday:  { from: '09:00', to: '18:00', available: true },
            sunday:    { from: '09:00', to: '13:00', available: true },
          },
        },
      },
      {
        user: { name: 'Emily Davis', email: 'emily.d@educonnect.com', role: 'Volunteer', status: 'Approved' },
        volunteer: {
          subjects: ['Biology', 'Chemistry', 'Biochemistry'], experienceLevel: 'intermediate',
          bio: 'Pre-med student happy to help with science courses.',
          averageRating: 4.2, totalReviews: 5,
          ratingBreakdown: { five: 3, four: 1, three: 1, two: 0, one: 0 },
          completedSessions: 8, totalSessionsAssigned: 10,
          responseRate: 90, totalResponses: 9, totalRequests: 10,
          badges: ['rising_star'],
          availability: {
            monday:    { from: '18:00', to: '21:00', available: true },
            tuesday:   { from: '', to: '', available: false },
            wednesday: { from: '18:00', to: '21:00', available: true },
            thursday:  { from: '', to: '', available: false },
            friday:    { from: '18:00', to: '21:00', available: true },
            saturday:  { from: '10:00', to: '16:00', available: true },
            sunday:    { from: '10:00', to: '16:00', available: true },
          },
        },
      },
    ];

    const p2Vols = {};
    const p2UserRefs = {};
    for (const v of p2VolData) {
      const user = await User.create({ ...v.user, password: PWD });
      const vol = await Volunteer.create({ user: user._id, ...v.volunteer });
      vol.reputationScore = recalculateReputation(vol);
      await vol.save();
      p2Vols[v.user.email] = vol;
      p2UserRefs[v.user.email] = user;
      console.log(`✅ P2 Volunteer: ${v.user.name} [Rating: ${v.volunteer.averageRating}, Rep: ${vol.reputationScore}]`);
    }

    // --- P2 Sessions (completed, pending, accepted) ---
    const sarahVol = p2Vols['sarah.chen@educonnect.com'];
    const michaelVol = p2Vols['michael.lee@educonnect.com'];
    const emilyVol = p2Vols['emily.d@educonnect.com'];

    const sessions = await Session.insertMany([
      { student: studentA._id, volunteer: sarahVol._id, subject: 'Python', scheduledDate: new Date('2026-03-20'), scheduledTime: '10:00 AM', duration: 60, status: 'completed', isReviewed: true, studentConfirmedCompletion: true, volunteerConfirmedCompletion: true },
      { student: studentA._id, volunteer: sarahVol._id, subject: 'JavaScript', scheduledDate: new Date('2026-03-25'), scheduledTime: '2:00 PM', duration: 90, status: 'completed', isReviewed: true, studentConfirmedCompletion: true, volunteerConfirmedCompletion: true },
      { student: studentB._id, volunteer: sarahVol._id, subject: 'Data Science', scheduledDate: new Date('2026-03-28'), scheduledTime: '11:00 AM', duration: 60, status: 'completed', isReviewed: false, studentConfirmedCompletion: true, volunteerConfirmedCompletion: true },
      { student: studentA._id, volunteer: michaelVol._id, subject: 'Calculus', scheduledDate: new Date('2026-03-22'), scheduledTime: '3:00 PM', duration: 60, status: 'completed', isReviewed: true, studentConfirmedCompletion: true, volunteerConfirmedCompletion: true },
      { student: studentB._id, volunteer: michaelVol._id, subject: 'Physics', scheduledDate: new Date('2026-04-05'), scheduledTime: '4:00 PM', duration: 60, status: 'accepted', notes: 'Focus on mechanics and energy' },
      { student: studentA._id, volunteer: emilyVol._id, subject: 'Biology', scheduledDate: new Date('2026-04-08'), scheduledTime: '6:00 PM', duration: 60, status: 'pending', notes: 'Need help with molecular biology' },
      { student: studentB._id, volunteer: emilyVol._id, subject: 'Chemistry', scheduledDate: new Date('2026-03-15'), scheduledTime: '7:00 PM', duration: 60, status: 'completed', isReviewed: true, studentConfirmedCompletion: true, volunteerConfirmedCompletion: true },
    ]);
    console.log(`✅ ${sessions.length} P2 Sessions created (4 completed, 1 accepted, 1 pending, 1 completed)`);

    // --- P2 Reviews (for completed+reviewed sessions) ---
    const reviews = await Review.insertMany([
      {
        session: sessions[0]._id, student: studentA._id, volunteer: sarahVol._id,
        rating: 5, reviewText: 'Sarah explained Python decorators perfectly! Very patient and clear.', topicStudied: 'Python Decorators & Closures',
        followUpMatchAgain: true, feedbackTags: ['positive'], sessionDate: sessions[0].scheduledDate,
        experienceType: 'new_learning', subject: 'Python', status: 'approved',
      },
      {
        session: sessions[1]._id, student: studentA._id, volunteer: sarahVol._id,
        rating: 5, reviewText: 'Great session on async/await. Sarah is an excellent tutor.', topicStudied: 'JavaScript Async Programming',
        followUpMatchAgain: true, feedbackTags: ['positive'], sessionDate: sessions[1].scheduledDate,
        experienceType: 'new_learning', subject: 'JavaScript', status: 'approved',
      },
      {
        session: sessions[3]._id, student: studentA._id, volunteer: michaelVol._id,
        rating: 4, reviewText: 'Michael helped me understand integration by parts. Good explanations.', topicStudied: 'Integration Techniques',
        followUpMatchAgain: true, feedbackTags: ['positive'], sessionDate: sessions[3].scheduledDate,
        experienceType: 'review', subject: 'Calculus', status: 'approved',
      },
      {
        session: sessions[6]._id, student: studentB._id, volunteer: emilyVol._id,
        rating: 4, reviewText: 'Emily was knowledgeable about organic chemistry reactions.', topicStudied: 'Organic Chemistry — SN1/SN2 Reactions',
        followUpMatchAgain: true, feedbackTags: ['positive', 'neutral'], sessionDate: sessions[6].scheduledDate,
        experienceType: 'practice', subject: 'Chemistry', status: 'approved',
      },
    ]);
    console.log(`✅ ${reviews.length} P2 Reviews created`);

    // ══════════════════════════════════════════════════════════════════════════
    //  3. P1 — ChatSessions (Chatbot)
    // ══════════════════════════════════════════════════════════════════════════

    await ChatSession.create({
      userId: studentA._id,
      currentStep: 4,
      collectedData: { subject: 'Mathematics', topic: 'Calculus Integration', preferredTime: 'Morning' },
      messages: [
        { sender: 'bot',  text: 'Hi Ava! I\'m your EduConnect assistant. What subject do you need help with?' },
        { sender: 'user', text: 'Mathematics' },
        { sender: 'bot',  text: 'Great! What specific topic in Mathematics?' },
        { sender: 'user', text: 'Calculus Integration' },
        { sender: 'bot',  text: 'When would you prefer to study? (Morning, Afternoon, Evening, Weekend)' },
        { sender: 'user', text: 'Morning' },
        { sender: 'bot',  text: 'Perfect! I found 2 volunteers matching your criteria. Check your matches page!' },
      ],
    });

    await ChatSession.create({
      userId: studentB._id,
      currentStep: 2,
      collectedData: { subject: 'Computer Science', topic: '', preferredTime: '' },
      messages: [
        { sender: 'bot',  text: 'Hi Nimal! I\'m your EduConnect assistant. What subject do you need help with?' },
        { sender: 'user', text: 'Computer Science' },
        { sender: 'bot',  text: 'What specific topic in Computer Science do you need help with?' },
      ],
    });
    console.log('✅ 2 ChatSessions created (1 completed, 1 in-progress)');

    // ══════════════════════════════════════════════════════════════════════════
    //  4. P1 — Conversations & Messages
    // ══════════════════════════════════════════════════════════════════════════

    const aliceUser = p1Users['alice.chen@educonnect.com'];
    const bobUser   = p1Users['bob.m@educonnect.com'];

    // Conversation 1: Ava ↔ Alice
    const conv1 = await Conversation.create({
      studentId: studentA._id,
      volunteerId: aliceUser._id,
      matchContext: { subject: 'Mathematics', topic: 'Calculus Integration', preferredTime: 'Morning' },
      status: 'active',
      lastMessage: { content: 'See you Saturday morning!', senderId: aliceUser._id, timestamp: new Date('2026-03-30T10:15:00') },
      unreadCounts: { student: 1, volunteer: 0 },
    });

    const msgs1 = await Message.insertMany([
      { conversationId: conv1._id, senderId: studentA._id, content: 'Hi Dr. Chen! I was matched with you for Calculus. When can we meet?', isRead: true, readAt: new Date('2026-03-29T09:05:00') },
      { conversationId: conv1._id, senderId: aliceUser._id, content: 'Hello Ava! I\'m free Saturday mornings. Would 10 AM work?', isRead: true, readAt: new Date('2026-03-29T10:00:00') },
      { conversationId: conv1._id, senderId: studentA._id, content: 'Perfect! 10 AM Saturday works great.', isRead: true, readAt: new Date('2026-03-29T10:05:00') },
      { conversationId: conv1._id, senderId: aliceUser._id, content: 'See you Saturday morning!', isRead: false },
    ]);

    // Conversation 2: Nimal ↔ Bob
    const conv2 = await Conversation.create({
      studentId: studentB._id,
      volunteerId: bobUser._id,
      matchContext: { subject: 'Computer Science', topic: 'Data Structures', preferredTime: 'Evening' },
      status: 'active',
      lastMessage: { content: 'Can you help me with binary trees?', senderId: studentB._id, timestamp: new Date('2026-04-01T18:30:00') },
      unreadCounts: { student: 0, volunteer: 1 },
    });

    await Message.insertMany([
      { conversationId: conv2._id, senderId: studentB._id, content: 'Hi Bob! I need help understanding data structures.', isRead: true, readAt: new Date('2026-04-01T18:01:00') },
      { conversationId: conv2._id, senderId: bobUser._id, content: 'Hey Nimal! Sure, which data structure are you stuck on?', isRead: true, readAt: new Date('2026-04-01T18:10:00') },
      { conversationId: conv2._id, senderId: studentB._id, content: 'Can you help me with binary trees?', isRead: false },
    ]);

    // Conversation 3: Ava ↔ Bob (archived)
    await Conversation.create({
      studentId: studentA._id,
      volunteerId: bobUser._id,
      matchContext: { subject: 'Python', topic: 'OOP Patterns', preferredTime: 'Afternoon' },
      status: 'archived',
      archivedBy: studentA._id,
      lastMessage: { content: 'Thanks for the help with OOP!', senderId: studentA._id, timestamp: new Date('2026-03-15T14:00:00') },
      unreadCounts: { student: 0, volunteer: 0 },
    });

    console.log(`✅ 3 Conversations + ${msgs1.length + 3} Messages created`);

    // ══════════════════════════════════════════════════════════════════════════
    //  5. P3 — Study Students, Study Volunteers, Support Requests
    //
    //  Each P3 volunteer/student has a corresponding User account so they can
    //  log in with the unified auth system.
    // ══════════════════════════════════════════════════════════════════════════

    // --- P3 Study Students (linked to existing P1 student users) ---
    const studyStudents = [
      await StudyStudent.create({ user: studentA._id, name: 'Ava Perera',         email: 'student@educonnect.com' }),
      await StudyStudent.create({ user: studentB._id, name: 'Nimal Jayawardena',  email: 'nimal.j@educonnect.com' }),
    ];

    // Extra study-only student (with her own User account)
    const tharushiUser = await User.create({
      name: 'Tharushi Fernando', email: 'tharushi@educonnect.com',
      password: PWD, role: 'Student', status: 'Approved',
    });
    studyStudents.push(
      await StudyStudent.create({ user: tharushiUser._id, name: 'Tharushi Fernando', email: 'tharushi@educonnect.com' })
    );
    console.log(`✅ ${studyStudents.length} Study Students created (all linked to User accounts)`);

    // --- P3 Study Volunteers (each gets a new User account) ---
    const p3VolData = [
      { user: { name: 'Kavindu Hewa',   email: 'kavindu@educonnect.com'  }, vol: { subjects: ['Java','Python','MERN'],            rating: 4.5, ratingCount: 10, totalSessions: 20, availability: 'Any Time',     bio: 'Full-stack developer with 2 yrs tutoring.',   dailySessionLimit: 6, todaysSessions: 2 }},
      { user: { name: 'Nimali Perera',   email: 'nimali@educonnect.com'   }, vol: { subjects: ['DSA','OOP','C++'],                 rating: 4.2, ratingCount: 8,  totalSessions: 15, availability: 'This Week',    bio: 'CS tutor specializing in algorithms.',         dailySessionLimit: 5, todaysSessions: 0 }},
      { user: { name: 'Ravindu Silva',   email: 'ravindu@educonnect.com'  }, vol: { subjects: ['Java','Springboot','OOP'],         rating: 4.7, ratingCount: 14, totalSessions: 30, availability: 'Available Now', bio: 'Java/Spring Boot expert, backend specialist.', dailySessionLimit: 8, todaysSessions: 1 }},
      { user: { name: 'Hashini Kumari',  email: 'hashini@educonnect.com'  }, vol: { subjects: ['Python','Statistics','CS'],        rating: 4.0, ratingCount: 6,  totalSessions: 10, availability: 'Any Time',     bio: 'Data science enthusiast and Python mentor.',   dailySessionLimit: 4, todaysSessions: 0 }},
      { user: { name: 'Lakshan Bandara', email: 'lakshan@educonnect.com'  }, vol: { subjects: ['Networking','Project Management'], rating: 3.8, ratingCount: 4,  totalSessions: 8,  availability: 'This Week',    bio: 'IT professional helping with networking basics.', dailySessionLimit: 3, todaysSessions: 0 }},
    ];

    const studyVols = [];
    const p3Users = {};
    for (const v of p3VolData) {
      const u = await User.create({ ...v.user, password: PWD, role: 'Volunteer', status: 'Approved' });
      const vol = await StudyVolunteer.create({ user: u._id, name: v.user.name, email: v.user.email, ...v.vol });
      studyVols.push(vol);
      p3Users[v.user.email] = u;
      console.log(`✅ P3 Volunteer: ${v.user.name} → User _id: ${u._id}, StudyVolunteer _id: ${vol._id}`);
    }
    console.log(`✅ ${studyVols.length} Study Volunteers created (all linked to User accounts)`);

    // --- P3 Support Requests (timeSlot format must match controller validation) ---
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const lastWeek = new Date(); lastWeek.setDate(lastWeek.getDate() - 7);
    const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const requests = await SupportRequest.insertMany([
      // Completed with review (Ava already reviewed this one)
      {
        student: studyStudents[0]._id, studentName: 'Ava Perera',
        volunteer: studyVols[0]._id,  volunteerName: 'Kavindu Hewa',
        subject: 'Python', date: lastWeek, timeSlot: '10:00 AM',
        message: 'Need help with Python list comprehensions and generators.', status: 'completed',
        rating: 5, reviewText: 'Kavindu explained generators brilliantly!', reviewSubject: 'Python Generators', reviewCreatedAt: new Date(),
      },
      // Completed WITHOUT review — Ava can review this ★
      {
        student: studyStudents[0]._id, studentName: 'Ava Perera',
        volunteer: studyVols[2]._id,  volunteerName: 'Ravindu Silva',
        subject: 'Java', date: twoDaysAgo, timeSlot: '11:00 AM',
        message: 'Help with Java OOP concepts and design patterns.', status: 'completed',
      },
      // Completed WITHOUT review — Ava can review this ★
      {
        student: studyStudents[0]._id, studentName: 'Ava Perera',
        volunteer: studyVols[3]._id,  volunteerName: 'Hashini Kumari',
        subject: 'Statistics', date: threeDaysAgo, timeSlot: '02:00 PM',
        message: 'Need help understanding regression analysis.', status: 'completed',
      },
      // Completed without review — Nimal can review this ★
      {
        student: studyStudents[1]._id, studentName: 'Nimal Jayawardena',
        volunteer: studyVols[2]._id,  volunteerName: 'Ravindu Silva',
        subject: 'Java', date: lastWeek, timeSlot: '02:00 PM',
        message: 'Help with Spring Boot REST APIs.', status: 'completed',
      },
      // Accepted (past — review enabled) — Ava ★
      {
        student: studyStudents[0]._id, studentName: 'Ava Perera',
        volunteer: studyVols[1]._id,  volunteerName: 'Nimali Perera',
        subject: 'DSA', date: twoDaysAgo, timeSlot: '03:00 PM',
        message: 'Want to practice linked list problems before my exam.', status: 'accepted',
      },
      // Accepted (upcoming — review disabled until session passes)
      {
        student: studyStudents[0]._id, studentName: 'Ava Perera',
        volunteer: studyVols[0]._id,  volunteerName: 'Kavindu Hewa',
        subject: 'MERN', date: tomorrow, timeSlot: '10:00 AM',
        message: 'Need help building a React dashboard component.', status: 'accepted',
      },
      // Pending
      {
        student: studyStudents[2]._id, studentName: 'Tharushi Fernando',
        volunteer: studyVols[0]._id,  volunteerName: 'Kavindu Hewa',
        subject: 'MERN', date: nextWeek, timeSlot: '11:00 AM',
        message: 'Need help setting up a MERN project with authentication.', status: 'pending',
      },
      // Rejected
      {
        student: studyStudents[1]._id, studentName: 'Nimal Jayawardena',
        volunteer: studyVols[4]._id,  volunteerName: 'Lakshan Bandara',
        subject: 'Networking', date: tomorrow, timeSlot: '09:00 AM',
        message: 'Need help with subnetting.', status: 'rejected',
        rejectReason: 'Sorry, I have a conflicting schedule that day. Please try next week.',
      },
      // Another pending
      {
        student: studyStudents[2]._id, studentName: 'Tharushi Fernando',
        volunteer: studyVols[3]._id,  volunteerName: 'Hashini Kumari',
        subject: 'Statistics', date: nextWeek, timeSlot: '04:00 PM',
        message: 'Need help understanding hypothesis testing and p-values.', status: 'pending',
      },
    ]);
    console.log(`✅ ${requests.length} Support Requests created (4 completed, 2 accepted, 2 pending, 1 rejected)`);

    // ══════════════════════════════════════════════════════════════════════════
    //  DONE
    // ══════════════════════════════════════════════════════════════════════════

    console.log('\n🎉 Seed complete! All 11 models populated.\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  LOGIN CREDENTIALS  (password for ALL accounts: password123)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  ADMIN');
    console.log('  ─────');
    console.log('  admin@educonnect.com             Platform Admin');
    console.log('');
    console.log('  STUDENTS (can log in → /study/discovery, /study/student-dashboard)');
    console.log('  ────────');
    console.log('  student@educonnect.com           Ava Perera          [Approved]');
    console.log('  nimal.j@educonnect.com           Nimal Jayawardena   [Approved]');
    console.log('  tharushi@educonnect.com          Tharushi Fernando   [Approved]');
    console.log('  pending.student@educonnect.com   Pending Student     [Pending]');
    console.log('');
    console.log('  VOLUNTEERS (P1 — Auth/Chat/Matching)');
    console.log('  ─────────────────────────────────────');
    console.log('  alice.chen@educonnect.com        Dr. Alice Chen      [Approved]');
    console.log('  bob.m@educonnect.com             Bob Martinez        [Approved]');
    console.log('  sarah.j@educonnect.com           Sarah Johnson       [Approved]');
    console.log('  david.k@educonnect.com           Prof. David Kim     [Approved]');
    console.log('  pending.vol@educonnect.com       Pending Volunteer   [Pending]');
    console.log('');
    console.log('  VOLUNTEERS (P2 — Ratings/Reviews)');
    console.log('  ─────────────────────────────────');
    console.log('  sarah.chen@educonnect.com        Sarah Chen          [Rating: 4.8]');
    console.log('  michael.lee@educonnect.com       Michael Lee         [Rating: 4.5]');
    console.log('  emily.d@educonnect.com           Emily Davis         [Rating: 4.2]');
    console.log('');
    console.log('  STUDY VOLUNTEERS (P3 — can log in → /study/volunteer-dashboard)');
    console.log('  ────────────────────────────────────────────────────────────────');
    console.log('  kavindu@educonnect.com           Kavindu Hewa    | Java, Python, MERN      | ★ 4.5');
    console.log('  nimali@educonnect.com            Nimali Perera   | DSA, OOP, C++           | ★ 4.2');
    console.log('  ravindu@educonnect.com           Ravindu Silva   | Java, Springboot, OOP   | ★ 4.7');
    console.log('  hashini@educonnect.com           Hashini Kumari  | Python, Statistics, CS  | ★ 4.0');
    console.log('  lakshan@educonnect.com           Lakshan Bandara | Networking, PM          | ★ 3.8');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

seed();
