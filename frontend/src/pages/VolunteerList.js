import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import StarRating from "../components/StarRating";
import LeaderboardBadge from "../components/LeaderboardBadge";

const VolunteerList = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: "",
    experienceLevel: "",
    minRating: "",
    sortBy: "",
  });
  const navigate = useNavigate();

  const fetchVolunteers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.subject) params.subject = filters.subject;
      if (filters.experienceLevel) params.experienceLevel = filters.experienceLevel;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const { data } = await API.get("/volunteers", { params });
      setVolunteers(data);
    } catch (err) {
      console.error("Failed to fetch volunteers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchVolunteers();
  };

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Browse Volunteers</h1>
        <p>Find peer tutors who can help you master your subjects</p>
      </div>

      {/* Filter Bar */}
      <form className="filter-bar" onSubmit={handleFilter}>
        <input
          type="text"
          name="subject"
          className="form-input"
          placeholder="Search by subject..."
          value={filters.subject}
          onChange={handleChange}
        />
        <select
          name="experienceLevel"
          className="form-select"
          value={filters.experienceLevel}
          onChange={handleChange}
        >
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
        <select
          name="minRating"
          className="form-select"
          value={filters.minRating}
          onChange={handleChange}
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
        <select
          name="sortBy"
          className="form-select"
          value={filters.sortBy}
          onChange={handleChange}
        >
          <option value="">Sort by Reputation</option>
          <option value="rating">Sort by Rating</option>
          <option value="sessions">Sort by Sessions</option>
          <option value="newest">Newest First</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {/* Volunteers Grid */}
      {loading ? (
        <div className="loading">
          <div>
            <div className="spinner" />
            <p>Loading volunteers...</p>
          </div>
        </div>
      ) : volunteers.length === 0 ? (
        <div className="empty-state">
          <h3>No volunteers found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="volunteers-grid">
          {volunteers.map((vol) => (
            <div
              key={vol._id}
              className="volunteer-card card"
              onClick={() => navigate(`/volunteers/${vol._id}`)}
            >
              <div className="volunteer-card-header">
                <div className="volunteer-avatar">
                  {getInitials(vol.user?.name)}
                </div>
                <div>
                  <div className="volunteer-name">{vol.user?.name}</div>
                  <StarRating rating={vol.averageRating || 0} size={14} />
                </div>
              </div>

              <div className="volunteer-subjects">
                {vol.subjects?.slice(0, 3).map((subj, i) => (
                  <span key={i} className="badge badge-primary">
                    {subj}
                  </span>
                ))}
                {vol.subjects?.length > 3 && (
                  <span className="badge badge-primary">
                    +{vol.subjects.length - 3}
                  </span>
                )}
              </div>

              {vol.badges?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  {vol.badges.map((badge, i) => (
                    <LeaderboardBadge key={i} badge={badge} />
                  ))}
                </div>
              )}

              <div className="volunteer-stats">
                <span>📚 {vol.completedSessions} sessions</span>
                <span>⭐ {vol.averageRating?.toFixed(1) || "N/A"}</span>
                <span>🎯 {vol.reputationScore}/100</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VolunteerList;
