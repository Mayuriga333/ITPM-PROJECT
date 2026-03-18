import React from "react";

const getReputationLevel = (score) => {
  if (score >= 85) return { label: "Excellent", className: "excellent" };
  if (score >= 70) return { label: "Good", className: "good" };
  if (score >= 50) return { label: "Average", className: "average" };
  return { label: "Needs Improvement", className: "below" };
};

const ReputationBadge = ({ score }) => {
  const level = getReputationLevel(score);

  return (
    <div className="reputation-card">
      <div className={`reputation-circle ${level.className}`}>
        {score}
      </div>
      <div className="reputation-details">
        <h4>Reputation Score</h4>
        <span className={`reputation-level`} style={{ color: "var(--gray-700)" }}>
          {score}/100 ({level.label})
        </span>
        <p>Based on ratings, sessions, response rate & consistency</p>
      </div>
    </div>
  );
};

export default ReputationBadge;
