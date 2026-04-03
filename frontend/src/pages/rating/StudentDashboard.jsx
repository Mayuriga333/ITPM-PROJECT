import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import ReviewForm from "../../components/rating/ReviewForm";
import { toast } from "react-toastify";
import studentDashboardImage from "../../assets/student-dashboard.svg";

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "Student") {
      navigate("/login");
      return;
    }
    fetchSessions();
  }, [user, navigate]);

  const fetchSessions = async () => {
    try {
      const { data } = await API.get("/sessions");
      setSessions(data);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCompletion = async (sessionId) => {
    try {
      await API.put(`/sessions/${sessionId}/complete`);
      toast.success("Session completion confirmed!");
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to confirm");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: "badge-warning",
      accepted: "badge-primary",
      completed: "badge-success",
      rejected: "badge-danger",
      cancelled: "badge-danger",
    };
    return map[status] || "badge-primary";
  };

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const pendingSessions = sessions.filter((s) => s.status === "pending" || s.status === "accepted");
  const unreviewedSessions = sessions.filter(
    (s) => s.status === "completed" && !s.isReviewed
  );

  if (loading) {
    return (
      <div className="loading">
        <div>
          <div className="spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header-card student-dashboard-hero card">
        <div className="student-dashboard-hero-content">
          <h1>Student Dashboard</h1>
          <p className="student-dashboard-intro">
            Welcome back, {user?.name}! Here's your tutoring overview.
          </p>
          <div className="student-actions-row">
            <Link to="/rating/find-volunteer" className="btn btn-primary">
              Find a Volunteer
            </Link>
            <Link to="/rating/volunteers" className="btn btn-outline">
              Browse All Volunteers
            </Link>
          </div>
        </div>
        <div className="student-dashboard-hero-visual">
          <img src={studentDashboardImage} alt="Student dashboard analytics illustration" />
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card card">
          <div className="stat-number">{sessions.length}</div>
          <div className="stat-label">Total Sessions</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{completedSessions.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{pendingSessions.length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{unreviewedSessions.length}</div>
          <div className="stat-label">Needs Review</div>
        </div>
      </div>

      {/* Unreviewed Sessions */}
      {unreviewedSessions.length > 0 && (
        <>
          <h3 className="review-section-title dashboard-section-title">Pending Reviews</h3>
          {unreviewedSessions.map((session) => (
            <div key={session._id} className="card student-review-card student-review-item">
              <div className="student-review-card-head dashboard-row-gap">
                <strong>{session.subject}</strong> with{" "}
                {session.volunteer?.user?.name || "Volunteer"}
                <span className="student-review-date student-review-date-space">
                  {new Date(session.scheduledDate).toLocaleDateString()}
                </span>
              </div>
              <ReviewForm
                sessionId={session._id}
                onReviewSubmitted={() => fetchSessions()}
              />
            </div>
          ))}
        </>
      )}

      {/* All Sessions */}
      <h3 className="dashboard-section-title dashboard-section-title-spaced">All Sessions</h3>
      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <h3>No sessions yet</h3>
            <p>
              <Link to="/rating/find-volunteer" className="dashboard-inline-link">
                Find a volunteer
              </Link>{" "}
              to get started!
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session._id} className="session-item card">
              <div className="session-info">
                <h4>{session.subject}</h4>
                <p>
                  with {session.volunteer?.user?.name || "Volunteer"} •{" "}
                  {new Date(session.scheduledDate).toLocaleDateString()} at{" "}
                  {session.scheduledTime}
                </p>
              </div>
              <div className="session-actions">
                <span className={`badge ${getStatusBadge(session.status)}`}>
                  {session.status}
                </span>
                {session.status === "accepted" && !session.studentConfirmedCompletion && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleConfirmCompletion(session._id)}
                  >
                    Confirm Completed
                  </button>
                )}
                {session.status === "accepted" && session.studentConfirmedCompletion && (
                  <span className="badge badge-warning">Waiting for volunteer</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
