import React, { useState, useEffect } from "react";
import API from "../api/axios";
import StarRating from "../components/StarRating";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
  const [data, setData] = useState({ topRated: [], mostActive: [], risingStars: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("topRated");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data: res } = await API.get("/volunteers/leaderboard");
        setData(res);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const tabs = [
    { key: "topRated", label: "🏆 Top Rated", emoji: "🏆" },
    { key: "mostActive", label: "🔥 Most Active", emoji: "🔥" },
    { key: "risingStars", label: "⭐ Rising Stars", emoji: "⭐" },
  ];

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  const getRankClass = (index) => {
    if (index === 0) return "rank-1";
    if (index === 1) return "rank-2";
    if (index === 2) return "rank-3";
    return "rank-default";
  };

  const getStatLabel = (tab) => {
    if (tab === "topRated") return { key: "averageRating", label: "Rating", format: (v) => v?.toFixed(1) };
    if (tab === "mostActive") return { key: "completedSessions", label: "Sessions", format: (v) => v };
    return { key: "reputationScore", label: "Score", format: (v) => v };
  };

  if (loading) {
    return (
      <div className="loading">
        <div>
          <div className="spinner" />
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const currentList = data[activeTab] || [];
  const stat = getStatLabel(activeTab);

  return (
    <div className="page">
      <div className="section-header">
        <h1>Volunteer Leaderboard</h1>
        <p>Recognizing our top-performing volunteer tutors</p>
      </div>

      {/* Tabs */}
      <div className="leaderboard-tab">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? "active" : ""}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="leaderboard-list">
        {currentList.length === 0 ? (
          <div className="empty-state">
            <h3>No volunteers yet</h3>
          </div>
        ) : (
          currentList.map((vol, index) => (
            <div
              key={vol._id}
              className="leaderboard-item card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/volunteers/${vol._id}`)}
            >
              <div className={`leaderboard-rank ${getRankClass(index)}`}>
                {index + 1}
              </div>

              <div className="volunteer-avatar" style={{ width: 44, height: 44, fontSize: "1rem" }}>
                {getInitials(vol.user?.name)}
              </div>

              <div className="leaderboard-info">
                <div className="name">{vol.user?.name}</div>
                <div className="detail">
                  <StarRating rating={vol.averageRating || 0} size={12} showNumber={false} />
                  <span style={{ marginLeft: 8 }}>
                    {vol.completedSessions} sessions • Rep: {vol.reputationScore}
                  </span>
                </div>
              </div>

              <div className="leaderboard-value">
                <div className="number">{stat.format(vol[stat.key])}</div>
                <div className="label">{stat.label}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
