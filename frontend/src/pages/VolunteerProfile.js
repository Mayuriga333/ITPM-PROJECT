import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import API from "../api/axios";
import StarRating from "../components/StarRating";
import RatingBreakdown from "../components/RatingBreakdown";
import ReputationBadge from "../components/ReputationBadge";
import LeaderboardBadge from "../components/LeaderboardBadge";
import ReviewCard from "../components/ReviewCard";
import ReviewForm from "../components/ReviewForm";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const VolunteerProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [volunteer, setVolunteer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingData, setBookingData] = useState({
    subject: "",
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await API.get(`/volunteers/${id}`);
        setVolunteer(data.volunteer);
        setReviews(data.reviews);

        // Fetch completed-but-unreviewed sessions if student
        if (user?.role === "student") {
          try {
            const sessRes = await API.get("/sessions?status=completed");
            const unreviewed = sessRes.data.filter(
              (s) =>
                s.volunteer?._id === id &&
                !s.isReviewed &&
                s.student?._id === user._id
            );
            setSessions(unreviewed);
          } catch (e) {
            // Not logged in or no sessions
          }
        }
      } catch (err) {
        console.error("Failed to load volunteer profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  const handleBook = async (e) => {
    e.preventDefault();
    try {
      await API.post("/sessions", {
        volunteerId: id,
        ...bookingData,
      });
      toast.success("Session request sent!");
      setShowBooking(false);
      setBookingData({ subject: "", scheduledDate: "", scheduledTime: "", notes: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to book session");
    }
  };

  const handleReviewSubmitted = (newReview) => {
    setReviews([newReview, ...reviews]);
    setSessions(sessions.filter((s) => s._id !== newReview.session));
  };

  if (loading) {
    return (
      <div className="loading">
        <div>
          <div className="spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="empty-state">
        <h3>Volunteer not found</h3>
      </div>
    );
  }

  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {getInitials(volunteer.user?.name)}
        </div>
        <div className="profile-info">
          <h1>{volunteer.user?.name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <StarRating rating={volunteer.averageRating || 0} size={18} />
            <span style={{ color: "var(--gray-500)", fontSize: "0.9rem" }}>
              ({volunteer.totalReviews} reviews)
            </span>
            <span className="badge badge-primary" style={{ textTransform: "capitalize" }}>
              {volunteer.experienceLevel}
            </span>
          </div>

          {volunteer.badges?.length > 0 && (
            <div className="profile-badges">
              {volunteer.badges.map((badge, i) => (
                <LeaderboardBadge key={i} badge={badge} />
              ))}
            </div>
          )}

          {volunteer.bio && <p className="profile-bio">{volunteer.bio}</p>}

          <div className="volunteer-subjects" style={{ marginTop: 12 }}>
            {volunteer.subjects?.map((subj, i) => (
              <span key={i} className="badge badge-primary">
                {subj}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Rating */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Overall Rating</h3>
        <RatingBreakdown
          ratingBreakdown={volunteer.ratingBreakdown}
          totalReviews={volunteer.totalReviews}
          averageRating={volunteer.averageRating}
        />
      </div>

      {/* Reputation Score */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Reputation</h3>
        <ReputationBadge score={volunteer.reputationScore || 0} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 16,
            marginTop: 20,
            paddingTop: 20,
            borderTop: "1px solid var(--gray-100)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
              {volunteer.completedSessions}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
              Completed Sessions
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
              {volunteer.responseRate}%
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
              Response Rate
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--primary)" }}>
              {volunteer.sessionCompletionRate || 100}%
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--gray-500)" }}>
              Completion Rate
            </div>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Availability</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {dayNames.map((day) => {
            const avail = volunteer.availability?.[day];
            return (
              <div
                key={day}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--radius)",
                  background: avail?.available ? "var(--primary-50)" : "var(--gray-50)",
                  border: `1px solid ${avail?.available ? "var(--primary-lighter)" : "var(--gray-200)"}`,
                  textAlign: "center",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ fontWeight: 600, textTransform: "capitalize", marginBottom: 2 }}>
                  {day.slice(0, 3)}
                </div>
                {avail?.available ? (
                  <div style={{ color: "var(--primary)", fontWeight: 500 }}>
                    {avail.from} - {avail.to}
                  </div>
                ) : (
                  <div style={{ color: "var(--gray-400)" }}>Unavailable</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Book Session */}
      {user?.role === "student" && (
        <div className="card" style={{ marginBottom: 24 }}>
          {!showBooking ? (
            <button className="btn btn-primary" onClick={() => setShowBooking(true)}>
              Book a Session
            </button>
          ) : (
            <form onSubmit={handleBook}>
              <h3 style={{ marginBottom: 16 }}>Request a Session</h3>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={bookingData.subject}
                  onChange={(e) => setBookingData({ ...bookingData, subject: e.target.value })}
                  required
                >
                  <option value="">Select a subject</option>
                  {volunteer.subjects?.map((s, i) => (
                    <option key={i} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingData.scheduledDate}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, scheduledDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={bookingData.scheduledTime}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, scheduledTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="What would you like help with?"
                  value={bookingData.notes}
                  onChange={(e) =>
                    setBookingData({ ...bookingData, notes: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="btn btn-primary">
                  Send Request
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBooking(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Unreviewed Sessions */}
      {sessions.length > 0 && (
        <div className="card profile-review-card" style={{ marginBottom: 24 }}>
          <h3 className="review-section-title" style={{ marginBottom: 16 }}>Leave a Review</h3>
          {sessions.map((session) => (
            <div key={session._id} className="profile-review-session" style={{ marginBottom: 24 }}>
              <p className="profile-review-session-meta" style={{ marginBottom: 8 }}>
                Session: {session.subject} on{" "}
                {new Date(session.scheduledDate).toLocaleDateString()}
              </p>
              <ReviewForm
                sessionId={session._id}
                onReviewSubmitted={handleReviewSubmitted}
              />
            </div>
          ))}
        </div>
      )}

      {/* Reviews Section */}
      <div className="reviews-section reviews-section-modern">
        <h3 className="review-section-title" style={{ marginBottom: 20 }}>
          Reviews ({reviews.length})
        </h3>
        {reviews.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px" }}>
            <p>No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};

export default VolunteerProfile;
