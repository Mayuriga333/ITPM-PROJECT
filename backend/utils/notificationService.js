const Notification = require('../models/Notification');
const User = require('../models/User');

const resolveUserIdFromProfile = async (profile) => {
  if (!profile) return null;

  if (profile.user) {
    return profile.user;
  }

  if (!profile.email) {
    return null;
  }

  const user = await User.findOne({ email: profile.email }).select('_id');
  return user ? user._id : null;
};

const resolveStudyStudentUserId = async (studentProfile) => resolveUserIdFromProfile(studentProfile);

const resolveStudyVolunteerUserId = async (volunteerProfile) => resolveUserIdFromProfile(volunteerProfile);

const createNotification = async ({ recipientUser, actorUser = null, request = null, type, title, message }) => {
  if (!recipientUser) return null;

  return Notification.create({
    recipientUser,
    actorUser,
    request,
    type,
    title,
    message,
  });
};

module.exports = {
  createNotification,
  resolveStudyStudentUserId,
  resolveStudyVolunteerUserId,
};