import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import StarRating from "../../components/rating/StarRating";
import { toast } from "react-toastify";
import adminModerationImage from "../../assets/admin-moderation.svg";

const AdminModeration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [moderatingId, setModeratingId] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [checkText, setCheckText] = useState("");
  const [checkRating, setCheckRating] = useState(3);
  const [checkResult, setCheckResult] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      let data;
      if (activeTab === "flagged") {
        const res = await API.get("/reviews/flagged");
        data = { reviews: res.data, total: res.data.length };
      } else {
        const res = await API.get(
          `/reviews/admin/all?status=${filterStatus}&sortBy=${sortBy}&page=${currentPage}&limit=15`
        );
        data = res.data;
        setTotalPages(res.data.totalPages);
      }
      setReviews(Array.isArray(data.reviews) ? data.reviews : Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterStatus, sortBy, currentPage]);

  useEffect(() => {
    if (!user || user.role !== "Admin") {
      navigate("/login");
      return;
    }
    fetchStats();
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.role === "Admin") {
      fetchReviews();
    }
  }, [fetchReviews, user]);

  const fetchStats = async () => {
    try {
      const { data } = await API.get("/reviews/admin/stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleModerate = async (reviewId, status) => {
    try {
      setModeratingId(reviewId);
      await API.put(`/reviews/${reviewId}/moderate`, {
        status,
        adminNote: adminNote || undefined,
      });
      toast.success(`Review ${status} successfully`);
      setAdminNote("");
      setModeratingId(null);
      fetchReviews();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Moderation failed");
      setModeratingId(null);
    }
  };

  const handleBulkModerate = async (status) => {
    if (selectedReviews.length === 0) {
      toast.error("No reviews selected");
      return;
    }
    try {
      await API.put("/reviews/admin/bulk-moderate", {
        reviewIds: selectedReviews,
        status,
      });
      toast.success(`${selectedReviews.length} reviews ${status}`);
      setSelectedReviews([]);
      fetchReviews();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Bulk moderation failed");
    }
  };

  const handleCheckContent = async () => {
    if (!checkText.trim()) {
      toast.error("Enter some text to check");
      return;
    }
    try {
      const { data } = await API.post("/reviews/admin/check-content", {
        text: checkText,
        rating: checkRating,
      });
      setCheckResult(data);
    } catch (err) {
      toast.error("Content check failed");
    }
  };

  const toggleSelectReview = (id) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map((r) => r._id));
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      approved: "badge-success",
      flagged: "badge-warning",
      pending: "badge-primary",
      rejected: "badge-danger",
    };
    return map[status] || "badge-primary";
  };

  const getSeverityColor = (severity) => {
    const map = {
      high: "#EF4444",
      medium: "#F59E0B",
      low: "#6B7280",
    };
    return map[severity] || "var(--gray-400)";
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard admin-moderation">
      <div className="moderation-hero">
        <div className="moderation-hero-content">
          <h1>Review Moderation</h1>
          <p>
            Monitor, approve, and manage student reviews
          </p>
        </div>
        <div className="moderation-hero-visual">
          <img src={adminModerationImage} alt="Admin moderation analytics illustration" />
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="dashboard-stats moderation-stats-grid">
          <div className="stat-card card">
            <div className="stat-number">{stats.totalReviews}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
          <div className="stat-card card">
            <div className="stat-number stat-success">
              {stats.approved}
            </div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card card">
            <div className="stat-number stat-warning">
              {stats.flagged}
            </div>
            <div className="stat-label">Flagged</div>
          </div>
          <div className="stat-card card">
            <div className="stat-number stat-danger">
              {stats.rejected}
            </div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      )}

      {/* Needs Action Banner */}
      {stats && stats.needsAction > 0 && (
        <div className="moderation-alert card moderation-gap-bottom-md">
          <div className="alert-content">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>{stats.needsAction} review{stats.needsAction !== 1 ? "s" : ""} need{stats.needsAction === 1 ? "s" : ""} attention</strong>
              <p className="moderation-alert-text">
                Flagged or pending reviews require admin action
              </p>
            </div>
          </div>
          <button
            className="btn btn-warning btn-sm"
            onClick={() => setActiveTab("flagged")}
          >
            Review Now
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="moderation-tabs moderation-gap-bottom-md">
        <button
          className={`mod-tab ${activeTab === "flagged" ? "active" : ""}`}
          onClick={() => { setActiveTab("flagged"); setCurrentPage(1); }}
        >
          🚩 Flagged / Pending
          {stats && stats.needsAction > 0 && (
            <span className="tab-badge">{stats.needsAction}</span>
          )}
        </button>
        <button
          className={`mod-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
        >
          📋 All Reviews
        </button>
        <button
          className={`mod-tab ${activeTab === "checker" ? "active" : ""}`}
          onClick={() => setActiveTab("checker")}
        >
          🔍 Content Checker
        </button>
      </div>

      {/* Content Checker Tab */}
      {activeTab === "checker" && (
        <div className="card moderation-checker" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Content Moderation Tester</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginBottom: 16 }}>
            Test how the moderation system analyzes review text
          </p>
          <div className="form-group">
            <label className="form-label">Review Text</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Type review text to analyze..."
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label className="form-label">Rating (1-5)</label>
            <select
              className="form-select"
              value={checkRating}
              onChange={(e) => setCheckRating(parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>{r} Star{r !== 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCheckContent}>
            Analyze Content
          </button>

          {checkResult && (
            <div className="check-result moderation-check-result" style={{ marginTop: 20 }}>
              <div
                className="card moderation-check-result-card"
                style={{
                  background: checkResult.flagged ? "#EF444415" : "#10B98115",
                  border: `1px solid ${checkResult.flagged ? "#EF444430" : "#10B98130"}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: "1.5rem" }}>
                    {checkResult.flagged ? "🚩" : "✅"}
                  </span>
                  <div>
                    <strong style={{ color: checkResult.flagged ? "#EF4444" : "#10B981" }}>
                      {checkResult.flagged ? "Content Flagged" : "Content Clean"}
                    </strong>
                    {checkResult.severity && (
                      <span
                        className="badge"
                        style={{
                          marginLeft: 8,
                          background: getSeverityColor(checkResult.severity) + "20",
                          color: getSeverityColor(checkResult.severity),
                        }}
                      >
                        {checkResult.severity} severity
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: "0.9rem" }}>
                  <p><strong>Moderation Score:</strong> {checkResult.score}/100</p>
                  <p><strong>Auto-reject:</strong> {checkResult.autoReject ? "Yes" : "No"}</p>
                  {checkResult.reasons.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <strong>Reasons:</strong>
                      <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
                        {checkResult.reasons.map((r, i) => (
                          <li key={i} style={{ color: "var(--gray-600)" }}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Reviews Filters */}
      {activeTab === "all" && (
        <div className="moderation-filters card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
              <select
                className="form-select"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: 150 }}>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
                <option value="severity">Severity Score</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {(activeTab === "flagged" || activeTab === "all") && selectedReviews.length > 0 && (
        <div className="bulk-actions card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              {selectedReviews.length} selected
            </span>
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleBulkModerate("approved")}
            >
              ✓ Approve All
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleBulkModerate("rejected")}
            >
              ✕ Reject All
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedReviews([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {activeTab !== "checker" && (
        <>
          {loading ? (
            <div className="loading">
              <div>
                <div className="spinner" />
                <p>Loading reviews...</p>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="empty-state card moderation-empty" style={{ padding: 48, textAlign: "center" }}>
              <span style={{ fontSize: "3rem" }}>
                {activeTab === "flagged" ? "🎉" : "📭"}
              </span>
              <h3 style={{ marginTop: 12 }}>
                {activeTab === "flagged"
                  ? "No flagged reviews!"
                  : "No reviews found"}
              </h3>
              <p style={{ color: "var(--gray-500)" }}>
                {activeTab === "flagged"
                  ? "All reviews are currently clean. Great community!"
                  : "Try changing the filters to see more reviews."}
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                    onChange={toggleSelectAll}
                  />
                  Select all ({reviews.length})
                </label>
              </div>

              {reviews.map((review) => (
                <div
                  key={review._id}
                  className={`moderation-review-card card ${
                    selectedReviews.includes(review._id) ? "selected" : ""
                  }`}
                  style={{ marginBottom: 12 }}
                >
                  <div className="mod-review-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review._id)}
                        onChange={() => toggleSelectReview(review._id)}
                      />
                      <div>
                        <div className="mod-review-meta-row" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <StarRating rating={review.rating} size={14} showNumber={false} />
                          <span className={`badge ${getStatusBadge(review.status)}`}>
                            {review.status}
                          </span>
                          {review.moderationSeverity && (
                            <span
                              className="badge"
                              style={{
                                background: getSeverityColor(review.moderationSeverity) + "20",
                                color: getSeverityColor(review.moderationSeverity),
                                fontSize: "0.75rem",
                              }}
                            >
                              {review.moderationSeverity} severity
                            </span>
                          )}
                          {review.moderationScore > 0 && (
                            <span style={{ fontSize: "0.8rem", color: "var(--gray-400)" }}>
                              Score: {review.moderationScore}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--gray-500)", marginTop: 4 }}>
                          By {review.isAnonymous ? "Anonymous" : review.student?.name || "Unknown"}{" "}
                          ({review.student?.email || "—"})
                          {" → "}
                          {review.volunteer?.user?.name || "Volunteer"}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-400)", textAlign: "right" }}>
                      {formatDate(review.createdAt)}
                      <div style={{ marginTop: 2 }}>📚 {review.subject}</div>
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.reviewText && (
                    <div className="mod-review-text">
                      "{review.reviewText}"
                    </div>
                  )}

                  {/* Flag Reason */}
                  {review.flagReason && (
                    <div className="mod-flag-reason">
                      <strong>🚩 Flag Reason:</strong> {review.flagReason}
                    </div>
                  )}

                  {/* Admin Note */}
                  {review.adminNote && (
                    <div className="mod-admin-note">
                      <strong>📝 Admin Note:</strong> {review.adminNote}
                    </div>
                  )}

                  {/* Moderation Info */}
                  {review.moderatedAt && (
                    <div style={{ fontSize: "0.8rem", color: "var(--gray-400)", marginTop: 8 }}>
                      Moderated on {formatDate(review.moderatedAt)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(review.status === "flagged" || review.status === "pending") && (
                    <div className="mod-review-actions">
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Admin note (optional)..."
                          style={{ fontSize: "0.85rem", padding: "6px 10px" }}
                          value={moderatingId === review._id ? adminNote : ""}
                          onFocus={() => setModeratingId(review._id)}
                          onChange={(e) => {
                            setModeratingId(review._id);
                            setAdminNote(e.target.value);
                          }}
                        />
                      </div>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleModerate(review._id, "approved")}
                        disabled={moderatingId === review._id && moderatingId === null}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleModerate(review._id, "rejected")}
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}

                  {/* Already moderated — allow re-moderation */}
                  {(review.status === "approved" || review.status === "rejected") && (
                    <div className="mod-review-actions" style={{ justifyContent: "flex-end" }}>
                      {review.status === "approved" && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleModerate(review._id, "rejected")}
                        >
                          Revoke → Reject
                        </button>
                      )}
                      {review.status === "rejected" && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleModerate(review._id, "approved")}
                        >
                          Reinstate → Approve
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {activeTab === "all" && totalPages > 1 && (
                <div className="pagination" style={{ marginTop: 20 }}>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ← Previous
                  </button>
                  <span style={{ fontSize: "0.9rem", color: "var(--gray-500)" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AdminModeration;
