import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import StarRating from "../components/StarRating";
import ReputationBadge from "../components/ReputationBadge";
import LeaderboardBadge from "../components/LeaderboardBadge";
import AvailabilityEditor from "../components/AvailabilityEditor";
import { toast } from "react-toastify";

const VolunteerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({
    subjects: "",
    experienceLevel: "intermediate",
    bio: "",
    availability: {},
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "volunteer") {
      navigate("/login");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, sessionsRes] = await Promise.all([
        API.get("/volunteers/me/profile"),
        API.get("/sessions"),
      ]);
      setProfile(profileRes.data);
      setSessions(sessionsRes.data);

      // Initialize edit form with current profile data
      const p = profileRes.data;
      setEditData({
        subjects: p.subjects?.join(", ") || "",
        experienceLevel: p.experienceLevel || "intermediate",
        bio: p.bio || "",
        availability: p.availability || {},
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const payload = {
        subjects: editData.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experienceLevel: editData.experienceLevel,
        bio: editData.bio,
        availability: editData.availability,
      };
      const { data } = await API.put(`/volunteers/${profile._id}`, payload);
      setProfile(data);
      toast.success("Profile updated successfully!");
      setShowEditProfile(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSessionAction = async (sessionId, status) => {
    try {
      await API.put(`/sessions/${sessionId}/status`, { status });
      toast.success(`Session ${status}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleConfirmCompletion = async (sessionId) => {
    try {
      await API.put(`/sessions/${sessionId}/complete`);
      toast.success("Completion confirmed!");
      fetchData();
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

  const pendingSessions = sessions.filter((s) => s.status === "pending");
  const activeSessions = sessions.filter((s) => s.status === "accepted");
  const completedSessions = sessions.filter((s) => s.status === "completed");

  return (
    <div className="dashboard">
      <h1>Volunteer Dashboard</h1>
      <p style={{ color: "var(--gray-500)", marginBottom: 32 }}>
        Welcome back, {user?.name}! Here's your teaching overview.
      </p>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card card">
          <div className="stat-number">{profile?.completedSessions || 0}</div>
          <div className="stat-label">Completed Sessions</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{profile?.averageRating?.toFixed(1) || "0.0"}</div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{profile?.reputationScore || 0}</div>
          <div className="stat-label">Reputation Score</div>
        </div>
        <div className="stat-card card">
          <div className="stat-number">{profile?.responseRate || 0}%</div>
          <div className="stat-label">Response Rate</div>
        </div>
      </div>

      {/* Profile Quick View */}
      {profile && (
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>Your Profile</h3>
              <div style={{ marginBottom: 8 }}>
                <StarRating rating={profile.averageRating || 0} size={16} />
                <span style={{ marginLeft: 8, color: "var(--gray-500)", fontSize: "0.9rem" }}>
                  ({profile.totalReviews} reviews)
                </span>
              </div>
              <ReputationBadge score={profile.reputationScore || 0} />
            </div>
            <div>
              {profile.badges?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {profile.badges.map((badge, i) => (
                    <LeaderboardBadge key={i} badge={badge} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Section */}
      <div className="card edit-profile-section" style={{ marginBottom: 32 }}>
        <div
          className="edit-profile-toggle"
          onClick={() => setShowEditProfile(!showEditProfile)}
        >
          <h3 style={{ margin: 0 }}>
            ⚙️ Edit Profile & Availability
          </h3>
          <span style={{ fontSize: "1.2rem", color: "var(--gray-400)" }}>
            {showEditProfile ? "▲" : "▼"}
          </span>
        </div>

        {showEditProfile && (
          <div className="edit-profile-body">
            <div className="form-group">
              <label className="form-label">Subjects (comma-separated)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Python, Mathematics, Physics"
                value={editData.subjects}
                onChange={(e) =>
                  setEditData({ ...editData, subjects: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">Experience Level</label>
              <select
                className="form-select"
                value={editData.experienceLevel}
                onChange={(e) =>
                  setEditData({ ...editData, experienceLevel: e.target.value })
                }
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                className="form-textarea"
                placeholder="Tell students about yourself..."
                value={editData.bio}
                onChange={(e) =>
                  setEditData({ ...editData, bio: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Weekly Availability</label>
              <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 12 }}>
                Toggle each day on/off and set your available hours
              </p>
              <AvailabilityEditor
                availability={editData.availability}
                onChange={(newAvail) =>
                  setEditData({ ...editData, availability: newAvail })
                }
              />
            </div>

            <div className="edit-profile-actions">
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowEditProfile(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingSessions.length > 0 && (
        <>
          <h3 style={{ marginBottom: 16 }}>📩 Pending Requests ({pendingSessions.length})</h3>
          {pendingSessions.map((session) => (
            <div key={session._id} className="session-item card" style={{ background: "var(--primary-50)", marginBottom: 12 }}>
              <div className="session-info">
                <h4>{session.subject}</h4>
                <p>
                  from {session.student?.name || "Student"} •{" "}
                  {new Date(session.scheduledDate).toLocaleDateString()} at{" "}
                  {session.scheduledTime}
                </p>
                {session.notes && (
                  <p style={{ fontStyle: "italic", marginTop: 4 }}>"{session.notes}"</p>
                )}
              </div>
              <div className="session-actions">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleSessionAction(session._id, "accepted")}
                >
                  Accept
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleSessionAction(session._id, "rejected")}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <>
          <h3 style={{ marginBottom: 16, marginTop: 32 }}>📚 Active Sessions ({activeSessions.length})</h3>
          {activeSessions.map((session) => (
            <div key={session._id} className="session-item card" style={{ marginBottom: 12 }}>
              <div className="session-info">
                <h4>{session.subject}</h4>
                <p>
                  with {session.student?.name || "Student"} •{" "}
                  {new Date(session.scheduledDate).toLocaleDateString()} at{" "}
                  {session.scheduledTime}
                </p>
              </div>
              <div className="session-actions">
                <span className="badge badge-primary">Active</span>
                {!session.volunteerConfirmedCompletion && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleConfirmCompletion(session._id)}
                  >
                    Mark Complete
                  </button>
                )}
                {session.volunteerConfirmedCompletion && !session.studentConfirmedCompletion && (
                  <span className="badge badge-warning">Waiting for student</span>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Completed Sessions */}
      <h3 style={{ marginBottom: 16, marginTop: 32 }}>
        ✅ Completed Sessions ({completedSessions.length})
      </h3>
      <div className="sessions-list">
        {completedSessions.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p>No completed sessions yet</p>
          </div>
        ) : (
          completedSessions.map((session) => (
            <div key={session._id} className="session-item card" style={{ marginBottom: 12 }}>
              <div className="session-info">
                <h4>{session.subject}</h4>
                <p>
                  with {session.student?.name || "Student"} •{" "}
                  {new Date(session.scheduledDate).toLocaleDateString()}
                </p>
              </div>
              <span className="badge badge-success">Completed</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;
