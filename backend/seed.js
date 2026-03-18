/**
 * Seed script to populate the database with sample data
 * Run: npm run seed
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Volunteer = require("./models/Volunteer");
const Session = require("./models/Session");
const Review = require("./models/Review");
const { recalculateReputation } = require("./utils/reputationCalculator");

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Volunteer.deleteMany({});
    await Session.deleteMany({});
    await Review.deleteMany({});
    console.log("Cleared existing data");

    // Create students
    const students = await User.create([
      { name: "Alice Johnson", email: "alice@example.com", password: "password123", role: "student" },
      { name: "Bob Smith", email: "bob@example.com", password: "password123", role: "student" },
      { name: "Carol Williams", email: "carol@example.com", password: "password123", role: "student" },
      { name: "David Brown", email: "david@example.com", password: "password123", role: "student" },
      { name: "Emma Davis", email: "emma@example.com", password: "password123", role: "student" },
    ]);

    // Create volunteer users
    const volunteerUsers = await User.create([
      { name: "Sarah Chen", email: "sarah@example.com", password: "password123", role: "volunteer" },
      { name: "Michael Lee", email: "michael@example.com", password: "password123", role: "volunteer" },
      { name: "Priya Patel", email: "priya@example.com", password: "password123", role: "volunteer" },
      { name: "James Wilson", email: "james@example.com", password: "password123", role: "volunteer" },
      { name: "Luna Garcia", email: "luna@example.com", password: "password123", role: "volunteer" },
      { name: "Raj Kumar", email: "raj@example.com", password: "password123", role: "volunteer" },
    ]);

    // Create admin
    await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
    });

    // Create volunteer profiles
    const volunteers = await Volunteer.create([
      {
        user: volunteerUsers[0]._id,
        subjects: ["Python", "JavaScript", "Data Science"],
        experienceLevel: "expert",
        bio: "CS graduate with 3 years of tutoring experience. Passionate about making programming accessible to everyone.",
        availability: {
          monday: { from: "09:00", to: "17:00", available: true },
          tuesday: { from: "09:00", to: "17:00", available: true },
          wednesday: { from: "09:00", to: "12:00", available: true },
          thursday: { from: "14:00", to: "18:00", available: true },
          friday: { from: "09:00", to: "17:00", available: true },
          saturday: { from: "10:00", to: "14:00", available: true },
          sunday: { available: false },
        },
        averageRating: 4.8,
        totalReviews: 12,
        ratingBreakdown: { five: 10, four: 1, three: 1, two: 0, one: 0 },
        completedSessions: 25,
        totalSessionsAssigned: 27,
        responseRate: 96,
        totalResponses: 27,
        totalRequests: 28,
        badges: ["top_rated", "most_active"],
      },
      {
        user: volunteerUsers[1]._id,
        subjects: ["Mathematics", "Physics", "Calculus"],
        experienceLevel: "advanced",
        bio: "Math major who loves problem-solving. Specializing in calculus and linear algebra.",
        availability: {
          monday: { from: "16:00", to: "20:00", available: true },
          tuesday: { from: "16:00", to: "20:00", available: true },
          wednesday: { available: false },
          thursday: { from: "16:00", to: "20:00", available: true },
          friday: { available: false },
          saturday: { from: "09:00", to: "18:00", available: true },
          sunday: { from: "09:00", to: "18:00", available: true },
        },
        averageRating: 4.5,
        totalReviews: 8,
        ratingBreakdown: { five: 5, four: 2, three: 1, two: 0, one: 0 },
        completedSessions: 15,
        totalSessionsAssigned: 16,
        responseRate: 94,
        totalResponses: 15,
        totalRequests: 16,
        badges: ["top_rated"],
      },
      {
        user: volunteerUsers[2]._id,
        subjects: ["Chemistry", "Biology", "Organic Chemistry"],
        experienceLevel: "advanced",
        bio: "Pre-med student passionate about science education. Happy to help with lab concepts too!",
        availability: {
          monday: { from: "10:00", to: "14:00", available: true },
          tuesday: { available: false },
          wednesday: { from: "10:00", to: "14:00", available: true },
          thursday: { available: false },
          friday: { from: "10:00", to: "14:00", available: true },
          saturday: { from: "08:00", to: "12:00", available: true },
          sunday: { available: false },
        },
        averageRating: 4.6,
        totalReviews: 10,
        ratingBreakdown: { five: 7, four: 2, three: 1, two: 0, one: 0 },
        completedSessions: 18,
        totalSessionsAssigned: 19,
        responseRate: 95,
        totalResponses: 19,
        totalRequests: 20,
        badges: ["top_rated"],
      },
      {
        user: volunteerUsers[3]._id,
        subjects: ["English", "Essay Writing", "Literature"],
        experienceLevel: "intermediate",
        bio: "English literature enthusiast. Can help with essays, reports, and creative writing.",
        availability: {
          monday: { from: "18:00", to: "21:00", available: true },
          tuesday: { from: "18:00", to: "21:00", available: true },
          wednesday: { from: "18:00", to: "21:00", available: true },
          thursday: { from: "18:00", to: "21:00", available: true },
          friday: { from: "18:00", to: "21:00", available: true },
          saturday: { available: false },
          sunday: { from: "14:00", to: "20:00", available: true },
        },
        averageRating: 4.2,
        totalReviews: 5,
        ratingBreakdown: { five: 2, four: 2, three: 1, two: 0, one: 0 },
        completedSessions: 8,
        totalSessionsAssigned: 9,
        responseRate: 89,
        totalResponses: 8,
        totalRequests: 9,
      },
      {
        user: volunteerUsers[4]._id,
        subjects: ["Python", "Machine Learning", "Statistics"],
        experienceLevel: "expert",
        bio: "Data scientist at a tech startup. Offering free ML and stats tutoring sessions.",
        availability: {
          monday: { available: false },
          tuesday: { from: "19:00", to: "22:00", available: true },
          wednesday: { available: false },
          thursday: { from: "19:00", to: "22:00", available: true },
          friday: { available: false },
          saturday: { from: "10:00", to: "16:00", available: true },
          sunday: { from: "10:00", to: "16:00", available: true },
        },
        averageRating: 4.9,
        totalReviews: 7,
        ratingBreakdown: { five: 6, four: 1, three: 0, two: 0, one: 0 },
        completedSessions: 12,
        totalSessionsAssigned: 12,
        responseRate: 100,
        totalResponses: 12,
        totalRequests: 12,
        badges: ["top_rated", "rising_star"],
      },
      {
        user: volunteerUsers[5]._id,
        subjects: ["JavaScript", "React", "Web Development"],
        experienceLevel: "intermediate",
        bio: "Full-stack developer learning by teaching. Specialized in modern web technologies.",
        availability: {
          monday: { from: "17:00", to: "20:00", available: true },
          tuesday: { from: "17:00", to: "20:00", available: true },
          wednesday: { from: "17:00", to: "20:00", available: true },
          thursday: { available: false },
          friday: { from: "17:00", to: "20:00", available: true },
          saturday: { from: "09:00", to: "13:00", available: true },
          sunday: { available: false },
        },
        averageRating: 4.0,
        totalReviews: 3,
        ratingBreakdown: { five: 1, four: 1, three: 1, two: 0, one: 0 },
        completedSessions: 5,
        totalSessionsAssigned: 6,
        responseRate: 83,
        totalResponses: 5,
        totalRequests: 6,
        badges: ["rising_star"],
      },
    ]);

    // Recalculate reputation for all
    for (const vol of volunteers) {
      vol.reputationScore = recalculateReputation(vol);
      await vol.save();
    }

    // Create some completed sessions & reviews
    const sessionData = [
      { student: students[0]._id, volunteer: volunteers[0]._id, subject: "Python", scheduledDate: new Date("2026-01-10"), scheduledTime: "10:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      { student: students[1]._id, volunteer: volunteers[0]._id, subject: "JavaScript", scheduledDate: new Date("2026-01-15"), scheduledTime: "14:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      { student: students[2]._id, volunteer: volunteers[1]._id, subject: "Mathematics", scheduledDate: new Date("2026-01-20"), scheduledTime: "17:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      { student: students[0]._id, volunteer: volunteers[2]._id, subject: "Chemistry", scheduledDate: new Date("2026-02-01"), scheduledTime: "11:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      { student: students[3]._id, volunteer: volunteers[4]._id, subject: "Machine Learning", scheduledDate: new Date("2026-02-05"), scheduledTime: "20:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      { student: students[4]._id, volunteer: volunteers[3]._id, subject: "Essay Writing", scheduledDate: new Date("2026-02-10"), scheduledTime: "19:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      { student: students[1]._id, volunteer: volunteers[5]._id, subject: "React", scheduledDate: new Date("2026-02-12"), scheduledTime: "18:00", status: "completed", studentConfirmedCompletion: true, volunteerConfirmedCompletion: true, isReviewed: true },
      // Some pending/upcoming sessions
      { student: students[0]._id, volunteer: volunteers[0]._id, subject: "Data Science", scheduledDate: new Date("2026-03-10"), scheduledTime: "10:00", status: "accepted" },
      { student: students[2]._id, volunteer: volunteers[4]._id, subject: "Statistics", scheduledDate: new Date("2026-03-12"), scheduledTime: "19:00", status: "pending" },
    ];

    const sessions = await Session.create(sessionData);

    // Create reviews for completed sessions
    const reviewData = [
      { session: sessions[0]._id, student: students[0]._id, volunteer: volunteers[0]._id, rating: 5, reviewText: "Explained Python concepts clearly and was very patient. Highly recommend!", subject: "Python", status: "approved" },
      { session: sessions[1]._id, student: students[1]._id, volunteer: volunteers[0]._id, rating: 5, reviewText: "Amazing JavaScript session. Helped me understand closures and async/await perfectly.", subject: "JavaScript", status: "approved" },
      { session: sessions[2]._id, student: students[2]._id, volunteer: volunteers[1]._id, rating: 4, reviewText: "Good math session. Could have spent more time on practice problems but overall very helpful.", subject: "Mathematics", status: "approved" },
      { session: sessions[3]._id, student: students[0]._id, volunteer: volunteers[2]._id, rating: 5, reviewText: "Priya made organic chemistry so much easier to understand. Great visual explanations!", subject: "Chemistry", status: "approved" },
      { session: sessions[4]._id, student: students[3]._id, volunteer: volunteers[4]._id, rating: 5, reviewText: "Luna is an incredible ML tutor. She broke down complex algorithms into simple steps.", subject: "Machine Learning", status: "approved" },
      { session: sessions[5]._id, student: students[4]._id, volunteer: volunteers[3]._id, rating: 4, reviewText: "Helpful essay writing tips. James provided great feedback on my draft.", subject: "Essay Writing", status: "approved" },
      { session: sessions[6]._id, student: students[1]._id, volunteer: volunteers[5]._id, rating: 4, reviewText: "Good React fundamentals session. Raj helped me understand component lifecycle.", subject: "React", status: "approved" },
    ];

    await Review.create(reviewData);

    console.log("Database seeded successfully!");
    console.log(`Created ${students.length} students`);
    console.log(`Created ${volunteerUsers.length} volunteers`);
    console.log(`Created ${sessions.length} sessions`);
    console.log(`Created ${reviewData.length} reviews`);
    console.log("\nTest credentials:");
    console.log("  Student: alice@example.com / password123");
    console.log("  Volunteer: sarah@example.com / password123");
    console.log("  Admin: admin@example.com / admin123");

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedDB();
