import React from "react";

const RatingBreakdown = ({ ratingBreakdown, totalReviews, averageRating }) => {
  const bars = [
    { label: "5", count: ratingBreakdown?.five || 0 },
    { label: "4", count: ratingBreakdown?.four || 0 },
    { label: "3", count: ratingBreakdown?.three || 0 },
    { label: "2", count: ratingBreakdown?.two || 0 },
    { label: "1", count: ratingBreakdown?.one || 0 },
  ];

  return (
    <div className="rating-overview">
      <div className="rating-big">
        <div className="number">{averageRating?.toFixed(1) || "0.0"}</div>
        <div style={{ margin: "8px 0" }}>
          {"★".repeat(Math.round(averageRating || 0))}
          {"☆".repeat(5 - Math.round(averageRating || 0))}
        </div>
        <div className="label">{totalReviews || 0} reviews</div>
      </div>

      <div className="rating-bars">
        {bars.map((bar) => {
          const percentage = totalReviews > 0
            ? Math.round((bar.count / totalReviews) * 100)
            : 0;
          return (
            <div className="rating-bar-row" key={bar.label}>
              <span className="star-label">{bar.label}★</span>
              <div className="rating-bar-track">
                <div
                  className="rating-bar-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="count">{bar.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingBreakdown;
