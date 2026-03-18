import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import StarRating from "../components/StarRating";
import LeaderboardBadge from "../components/LeaderboardBadge";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const FindVolunteer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [searchData, setSearchData] = useState({
    subject: "",
    preferredDay: "",
    preferredTime: "",
    experienceLevel: "",
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchData.subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!user) {
      toast.error("Please log in to use smart matching");
      navigate("/login");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const { data } = await API.post("/matching", searchData);
      setResults(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Matching failed");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="page">
      <div className="page-header">
        <h1>Find Your Perfect Volunteer</h1>
        <p>Our smart matching algorithm will rank the best tutors for you</p>
      </div>

      {/* Search Form */}
      <form className="card card-elevated" onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 20 }}>What do you need help with?</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div className="form-group">
            <label className="form-label">Subject *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Python, Mathematics, Chemistry"
              value={searchData.subject}
              onChange={(e) => setSearchData({ ...searchData, subject: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Day</label>
            <select
              className="form-select"
              value={searchData.preferredDay}
              onChange={(e) => setSearchData({ ...searchData, preferredDay: e.target.value })}
            >
              <option value="">Any Day</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Preferred Time</label>
            <input
              type="time"
              className="form-input"
              value={searchData.preferredTime}
              onChange={(e) => setSearchData({ ...searchData, preferredTime: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Experience Level</label>
            <select
              className="form-select"
              value={searchData.experienceLevel}
              onChange={(e) => setSearchData({ ...searchData, experienceLevel: e.target.value })}
            >
              <option value="">Any Level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? "Finding matches..." : "🔍 Find Best Matches"}
        </button>
      </form>

      {/* Matching Formula */}
      {!searched && (
        <div className="card" style={{ marginBottom: 32, background: "var(--primary-50)" }}>
          <h4 style={{ marginBottom: 12 }}>How Smart Matching Works</h4>
          <p style={{ color: "var(--gray-600)", fontSize: "0.9rem", lineHeight: 1.7 }}>
            Our algorithm calculates a weighted matching score based on:
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12,
              marginTop: 16,
            }}
          >
            {[
              { label: "Subject Match", weight: "40%" },
              { label: "Availability", weight: "25%" },
              { label: "Experience", weight: "15%" },
              { label: "Rating", weight: "10%" },
              { label: "Reputation", weight: "10%" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  textAlign: "center",
                  padding: "16px",
                  background: "var(--white)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--primary-lighter)",
                }}
              >
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)" }}>
                  {item.weight}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginTop: 4 }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="loading">
          <div>
            <div className="spinner" />
            <p>Finding the best matches for you...</p>
          </div>
        </div>
      ) : searched && results.length === 0 ? (
        <div className="empty-state">
          <h3>No matches found</h3>
          <p>Try broadening your search criteria</p>
        </div>
      ) : (
        <div className="volunteers-grid">
          {results.map((result, index) => (
            <div
              key={result.volunteer._id}
              className="volunteer-card match-card card"
              onClick={() => navigate(`/volunteers/${result.volunteer._id}`)}
            >
              <div className="match-score">
                {result.matchingScore.toFixed(0)}% match
              </div>

              <div className="volunteer-card-header">
                <div className="volunteer-avatar">
                  {getInitials(result.volunteer.user?.name)}
                </div>
                <div>
                  <div className="volunteer-name">{result.volunteer.user?.name}</div>
                  <StarRating rating={result.volunteer.averageRating || 0} size={14} />
                </div>
              </div>

              <div className="volunteer-subjects">
                {result.volunteer.subjects?.slice(0, 3).map((subj, i) => (
                  <span key={i} className="badge badge-primary">
                    {subj}
                  </span>
                ))}
              </div>

              {result.volunteer.badges?.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {result.volunteer.badges.map((badge, i) => (
                    <LeaderboardBadge key={i} badge={badge} />
                  ))}
                </div>
              )}

              {/* Score Breakdown */}
              <div className="match-breakdown">
                <div className="match-breakdown-item">
                  <span className="value">{result.breakdown.subject}</span>
                  Subject
                </div>
                <div className="match-breakdown-item">
                  <span className="value">{result.breakdown.availability}</span>
                  Avail.
                </div>
                <div className="match-breakdown-item">
                  <span className="value">{result.breakdown.experience}</span>
                  Exp.
                </div>
                <div className="match-breakdown-item">
                  <span className="value">{result.breakdown.rating}</span>
                  Rating
                </div>
                <div className="match-breakdown-item">
                  <span className="value">{result.breakdown.reputation}</span>
                  Rep.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindVolunteer;
