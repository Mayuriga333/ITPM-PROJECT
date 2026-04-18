import React from "react";

const badgeConfig = {
  top_rated: { emoji: "🏆", label: "Top Rated Volunteer", color: "#92400E", bg: "#FEF3C7" },
  most_active: { emoji: "🔥", label: "Most Active This Month", color: "#9A3412", bg: "#FED7AA" },
  rising_star: { emoji: "⭐", label: "Rising Star", color: "#1E40AF", bg: "#DBEAFE" },
};

const LeaderboardBadge = ({ badge }) => {
  const config = badgeConfig[badge];
  if (!config) return null;

  return (
    <span
      className="badge"
      style={{
        background: config.bg,
        color: config.color,
        fontSize: "0.8rem",
      }}
    >
      {config.emoji} {config.label}
    </span>
  );
};

export default LeaderboardBadge;
