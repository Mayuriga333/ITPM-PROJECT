import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { studentAPI, requestAPI } from '../../../services/api';
import { storage } from '../../../services/storage';
import RequestCard from '../Requests/RequestCard';
import StatsCard from './StatsCard';
import Button from '../common/Button';
import Card from '../common/Card';
import { Textarea } from '../common/Textarea';
import { Input, Label } from '../common/Input';
import { useAuth } from '../../../context/AuthContext';
import UserMenu from '../common/UserMenu';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeRequestForReview, setActiveRequestForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [topicStudied, setTopicStudied] = useState('');
  const [followUpMatchAgain, setFollowUpMatchAgain] = useState('');
  const [feedbackTags, setFeedbackTags] = useState([]);
  const [reviewSessionDate, setReviewSessionDate] = useState('');
  const [experienceType, setExperienceType] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [recommendation, setRecommendation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeRequestForEdit, setActiveRequestForEdit] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const navigate = useNavigate();

  const student = storage.getCurrentStudent();
  // Prefer StudyStudent._id stored at login; fall back to user._id
  const studentId = student?._id || user?._id;
  const studentName = student?.name || user?.name || 'Student';

  const TIME_SLOTS = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '01:00 PM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
    '05:00 PM',
    '06:00 PM',
    '07:00 PM',
    '08:00 PM',
  ];

  useEffect(() => {
    if (!studentId) {
      setStats({
        totalSubmitted: 4,
        completed: 4,
        active: 0,
        pending: 0,
        needsReview: 1,
      });
      setLoading(false);
      return;
    }

    fetchDashboardData().catch(e => {
      console.log("Using mock data since API might not be available yet", e);
      setStats({
        totalSubmitted: 4,
        completed: 4,
        active: 0,
        pending: 0,
        needsReview: 1,
      });
      setLoading(false);
    });
  }, [studentId]);

  const fetchDashboardData = async () => {
    try {
      const [requestsRes, statsRes] = await Promise.all([
        studentAPI.getRequests(studentId, studentName),
        studentAPI.getStats(studentId, studentName)
      ]);
      setRequests(requestsRes.data?.data || requestsRes.data || {});
      setStats(statsRes.data?.data || statsRes.data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const VALID_TAGS = ['positive', 'neutral', 'needs_improvement'];
  const VALID_EXPERIENCE_TYPES = ['practice', 'review', 'new_learning'];
  const TOPIC_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&]+$/;

  const todayStr = new Date().toISOString().split('T')[0];
  const minDateObj = new Date();
  minDateObj.setFullYear(minDateObj.getFullYear() - 1);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const openReviewModal = (request) => {
    setActiveRequestForReview(request);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewText('');
    setTopicStudied(request.subject || '');
    setFollowUpMatchAgain('');
    setFeedbackTags([]);
    // Pre-fill session date from the request date
    const d = request.date ? new Date(request.date) : null;
    setReviewSessionDate(d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '');
    setExperienceType('');
    setAttachment(null);
    setRecommendation('');
    setIsAnonymous(false);
    setModerationFeedback(null);
    setShowReviewModal(true);
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setActiveRequestForReview(null);
    setReviewRating(0);
    setReviewHoverRating(0);
    setReviewText('');
    setTopicStudied('');
    setFollowUpMatchAgain('');
    setFeedbackTags([]);
    setReviewSessionDate('');
    setExperienceType('');
    setAttachment(null);
    setRecommendation('');
    setIsAnonymous(false);
    setModerationFeedback(null);
  };

  const toggleTag = (tagValue) => {
    setFeedbackTags((prev) => {
      if (prev.includes(tagValue)) return prev.filter((t) => t !== tagValue);
      if (prev.length >= 3) { toast.error('You can select up to 3 tags'); return prev; }
      return [...prev, tagValue];
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeRequestForReview) return;

    // ── Client-side validation (matching ITPM) ──
    if (!reviewRating) { toast.error('Please select a star rating.'); return; }

    const cleanTopic = topicStudied.trim();
    if (!cleanTopic) { toast.error('Topic/Subject studied is required.'); return; }
    if (cleanTopic.length < 3 || cleanTopic.length > 200) { toast.error('Topic must be 3-200 characters.'); return; }
    if (!TOPIC_REGEX.test(cleanTopic)) { toast.error('Topic contains invalid characters.'); return; }

    if (!['yes', 'no'].includes(followUpMatchAgain)) { toast.error('Please select follow-up action (Yes or No).'); return; }

    if (!feedbackTags.length) { toast.error('Please select at least one feedback tag.'); return; }
    if (feedbackTags.length > 3) { toast.error('Maximum 3 feedback tags.'); return; }

    if (!reviewSessionDate) { toast.error('Session date is required.'); return; }
    if (reviewSessionDate > todayStr) { toast.error('Session date cannot be in the future.'); return; }
    if (reviewSessionDate < minDateStr) { toast.error('Session date cannot be older than 1 year.'); return; }

    if (!VALID_EXPERIENCE_TYPES.includes(experienceType)) { toast.error('Please select an experience type.'); return; }

    if (recommendation.trim().length > 500) { toast.error('Recommendation max 500 characters.'); return; }

    if (attachment) {
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(attachment.type)) { toast.error('Only .jpg, .png, .pdf allowed.'); return; }
      if (attachment.size > 5 * 1024 * 1024) { toast.error('Attachment must be 5MB or less.'); return; }
    }

    try {
      setSubmittingReview(true);
      const formData = new FormData();
      formData.append('rating', String(reviewRating));
      formData.append('reviewText', reviewText);
      formData.append('topicStudied', cleanTopic);
      formData.append('followUpMatchAgain', String(followUpMatchAgain === 'yes'));
      formData.append('feedbackTags', JSON.stringify(feedbackTags));
      formData.append('sessionDate', reviewSessionDate);
      formData.append('experienceType', experienceType);
      formData.append('recommendation', recommendation.trim());
      formData.append('isAnonymous', String(isAnonymous));
      if (attachment) formData.append('attachment', attachment);

      const { data } = await requestAPI.review(activeRequestForReview._id, formData);

      // Show moderation feedback
      if (data.moderationStatus === 'flagged') {
        setModerationFeedback({ type: 'warning', message: data.moderationMessage || 'Your review is under moderation.' });
        toast('Review submitted — under moderation', { icon: '⚠️' });
      } else if (data.moderationStatus === 'rejected') {
        setModerationFeedback({ type: 'error', message: data.moderationMessage || 'Review rejected due to policy violations.' });
        toast.error('Review rejected — please revise');
      } else {
        setModerationFeedback(null);
        toast.success('Review submitted successfully!');
        closeReviewModal();
      }

      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit review';
      if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('already')) {
        setModerationFeedback({ type: 'error', message: msg });
      }
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const openEditModal = (request) => {
    setActiveRequestForEdit(request);
    setEditStudentName(request.studentName || studentName);
    setEditSubject(request.subject || '');
    setEditMessage(request.message || '');
    // request.date is ISO; convert to yyyy-mm-dd for input[type=date]
    const d = request.date ? new Date(request.date) : null;
    setEditDate(d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '');
    setEditTimeSlot(request.timeSlot || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setActiveRequestForEdit(null);
    setEditStudentName('');
    setEditSubject('');
    setEditMessage('');
    setEditDate('');
    setEditTimeSlot('');
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!activeRequestForEdit) return;

    if (!editSubject.trim() || !editDate || !editTimeSlot) {
      toast.error('Please fill in subject, date, and time.');
      return;
    }

    try {
      setSubmittingEdit(true);
      await requestAPI.update(activeRequestForEdit._id, {
        subject: editSubject.trim(),
        date: editDate,
        timeSlot: editTimeSlot,
        message: editMessage,
        studentName: editStudentName.trim() || studentName,
      });
      toast.success('Request updated');
      closeEditModal();
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      // errors surfaced via interceptor
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteRequest = async (request) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;

    try {
      await requestAPI.remove(request._id);
      toast.success('Request deleted');
      setLoading(true);
      await fetchDashboardData();
    } catch (error) {
      // errors via interceptor
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Flatten requests into a single list for the submitted view
  const submittedRequests = [
    ...(requests.pending || []),
    ...(requests.accepted || []),
    ...(requests.rejected || []),
    ...(requests.completed || []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full h-screen flex bg-[#0A0D14] text-slate-300 font-sans overflow-hidden"
    >
      <div className="flex gap-8 w-full h-full">
        {/* Sidebar - match volunteer theme */}
        <aside className="w-[260px] bg-[#0F121C] border-r border-[#1C2033] flex flex-col p-6 shrink-0 h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 text-white font-semibold">
              {studentName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Student Portal</p>
              <p className="text-xs text-indigo-300 truncate w-[160px]">{studentName}</p>
            </div>
          </div>

          <nav className="space-y-2 mt-2">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-[#181D31] text-indigo-400"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">➤</span>
              <span>Submitted Requests</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/student')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:bg-[#181D31] hover:text-indigo-300"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">🏠</span>
              <span>Main Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/chat')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:bg-[#181D31] hover:text-indigo-300"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">💬</span>
              <span>AI Chatbot</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/student/matches')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:bg-[#181D31] hover:text-indigo-300"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">🧠</span>
              <span>My Matches</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-slate-400 hover:bg-[#181D31] hover:text-indigo-300"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10">📩</span>
              <span>Messages</span>
            </button>
          </nav>
        </aside>

        {/* Main content - match volunteer theme container */}
        <section className="flex-1 space-y-8 h-full bg-[#0B0F19] overflow-y-auto overflow-x-hidden p-8 pb-12">
          <header className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <h1 className="text-[32px] font-bold text-white tracking-tight">Submitted Requests</h1>
              <p className="text-indigo-200 text-[15px]">
                Track the status of your tutoring requests.
              </p>
            </div>
            <UserMenu />
          </header>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <StatsCard title="Total Submitted" value={stats.totalSubmitted || 4} />
              <StatsCard title="Pending" value={stats.pending || 1} />
              <StatsCard title="Rejected" value={stats.rejected || 0} />
            </div>
          )}

          <div className="space-y-4 mt-4">
            {submittedRequests.length === 0 ? (
              <div className="dark-card-container p-6 text-sm text-indigo-200">
                You haven't submitted any requests yet.
              </div>
            ) : (
              submittedRequests.map((req) => (
                <RequestCard
                  key={req._id}
                  request={req}
                  type="student"
                  onReview={openReviewModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteRequest}
                />
              ))
            )}
          </div>

          {/* Quick action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button onClick={() => navigate('/study/discovery')} className="sm:w-auto px-8">
              Find a Volunteer
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/study/discovery')}
              className="sm:w-auto px-8 bg-transparent"
            >
              Browse All Volunteers
            </Button>
          </div>

        </section>
      </div>

      {/* Review Modal — Full ITPM-style review form */}
      {showReviewModal && activeRequestForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="max-w-2xl w-full relative overflow-hidden max-h-[90vh] overflow-y-auto" noPadding>
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />

            <button
              type="button"
              onClick={closeReviewModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-sm z-10"
            >
              ✕ Close
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-bold text-white">
                  {activeRequestForReview.subject} with {activeRequestForReview.volunteerName}
                </h2>
                <span className="text-[14px] text-indigo-200">
                  {new Date(activeRequestForReview.date).toLocaleDateString()}
                </span>
              </div>

              <form onSubmit={handleSubmitReview} className="bg-white/5 rounded-2xl p-6 border border-white/20 space-y-5">
                <div>
                  <h3 className="font-bold text-white mb-1">Leave a Review</h3>
                  <p className="text-indigo-200 text-sm">
                    Share clear, constructive feedback about your session.
                  </p>
                </div>

                {/* Star Rating */}
                <div>
                  <Label>Rating *</Label>
                  <div className="flex items-center gap-1 mt-1 bg-white/10 inline-flex p-2 rounded-xl border border-white/20">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="text-2xl transition-transform hover:scale-110"
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        onClick={() => setReviewRating(star)}
                      >
                        {star <= (reviewHoverRating || reviewRating) ? (
                          <span className="text-yellow-400">★</span>
                        ) : (
                          <span className="text-slate-500">☆</span>
                        )}
                      </button>
                    ))}
                    {reviewRating > 0 && (
                      <span className="ml-2 text-sm text-indigo-200 font-medium">{reviewRating}/5</span>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <Label>Your Review</Label>
                  <Textarea
                    placeholder="Share your experience with this volunteer..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={1000}
                    rows={4}
                  />
                </div>

                {/* Topic / Subject Studied */}
                <div>
                  <Label>Topic/Subject Studied *</Label>
                  <Input
                    placeholder="Example: Algebra - Quadratic Equations"
                    value={topicStudied}
                    onChange={(e) => setTopicStudied(e.target.value)}
                    minLength={3}
                    maxLength={200}
                  />
                </div>

                {/* Follow-up Action */}
                <div>
                  <Label>Follow-up Action *</Label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 hover:border-indigo-400/50 transition-colors">
                      <input
                        type="radio"
                        name="followUpMatchAgain"
                        value="yes"
                        checked={followUpMatchAgain === 'yes'}
                        onChange={(e) => setFollowUpMatchAgain(e.target.value)}
                        className="accent-indigo-500"
                      />
                      Would like to match again: <span className="font-semibold text-emerald-400">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 bg-white/5 px-4 py-2.5 rounded-lg border border-white/10 hover:border-indigo-400/50 transition-colors">
                      <input
                        type="radio"
                        name="followUpMatchAgain"
                        value="no"
                        checked={followUpMatchAgain === 'no'}
                        onChange={(e) => setFollowUpMatchAgain(e.target.value)}
                        className="accent-indigo-500"
                      />
                      Would like to match again: <span className="font-semibold text-rose-400">No</span>
                    </label>
                  </div>
                </div>

                {/* Feedback Tags */}
                <div>
                  <Label>Tags / Feedback Type * (max 3)</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {[
                      { value: 'positive', label: 'Positive', color: 'emerald' },
                      { value: 'neutral', label: 'Neutral', color: 'amber' },
                      { value: 'needs_improvement', label: 'Needs Improvement', color: 'rose' },
                    ].map((tag) => (
                      <label
                        key={tag.value}
                        className={`flex items-center gap-2 cursor-pointer text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                          feedbackTags.includes(tag.value)
                            ? `bg-${tag.color}-500/20 border-${tag.color}-400/60 text-${tag.color}-300`
                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-indigo-400/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={feedbackTags.includes(tag.value)}
                          onChange={() => toggleTag(tag.value)}
                          className="accent-indigo-500"
                        />
                        {tag.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Session Date + Experience Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Session Date *</Label>
                    <Input
                      type="date"
                      value={reviewSessionDate}
                      min={minDateStr}
                      max={todayStr}
                      onChange={(e) => setReviewSessionDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Experience Type *</Label>
                    <select
                      className="input-field cursor-pointer"
                      value={experienceType}
                      onChange={(e) => setExperienceType(e.target.value)}
                    >
                      <option value="" disabled>Select experience type</option>
                      <option value="practice">Practice</option>
                      <option value="review">Review</option>
                      <option value="new_learning">New Learning</option>
                    </select>
                  </div>
                </div>

                {/* Attachment */}
                <div>
                  <Label>Upload Screenshot or Notes (optional, .jpg/.png/.pdf, max 5MB)</Label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      const selectedFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      setAttachment(selectedFile);
                    }}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer mt-1"
                  />
                </div>

                {/* Recommendation */}
                <div>
                  <Label>Recommendation (optional)</Label>
                  <Textarea
                    placeholder="Suggestions or comments (max 500 characters)"
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                {/* Anonymous toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  <label htmlFor="anonymous" className="text-sm text-slate-300 cursor-pointer">
                    Submit anonymously
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-gradient-to-r from-primary to-primary-hover disabled:opacity-70"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>

                {/* Moderation Feedback */}
                {moderationFeedback && (
                  <div
                    className={`mt-3 p-4 rounded-xl border text-sm flex items-start gap-2 ${
                      moderationFeedback.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-400/40 text-amber-300'
                        : 'bg-rose-500/10 border-rose-400/40 text-rose-300'
                    }`}
                  >
                    <span>{moderationFeedback.type === 'warning' ? '⚠️' : '❌'}</span>
                    <p className="m-0">{moderationFeedback.message}</p>
                  </div>
                )}
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditModal && activeRequestForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <Card className="max-w-2xl w-full relative overflow-hidden" noPadding>
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary" />

            <button
              type="button"
              onClick={closeEditModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-white text-sm"
            >
              Close
            </button>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-bold text-white">
                  Edit Request for {activeRequestForEdit.volunteerName}
                </h2>
              </div>

              <form onSubmit={handleSubmitEdit} className="space-y-5">
                <div>
                  <Label>Your name</Label>
                  <Input
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label>What do you need help with?</Label>
                  <Textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    placeholder="Describe the topics or homework questions..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <select
                      className="input-field cursor-pointer"
                      value={editTimeSlot}
                      onChange={(e) => setEditTimeSlot(e.target.value)}
                      required
                    >
                      <option value="" disabled>
                        Select a time
                      </option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submittingEdit}
                  className="w-full bg-gradient-to-r from-primary to-primary-hover disabled:opacity-70"
                >
                  {submittingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;