import React from "react";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const StarRating = ({ rating, size = 16, showNumber = true }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3 && rating - fullStars <= 0.7;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} size={size} color="#FBBF24" />);
  }
  if (hasHalf) {
    stars.push(<FaStarHalfAlt key="half" size={size} color="#FBBF24" />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} size={size} color="#D1D5DB" />);
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {stars}
      {showNumber && (
        <span style={{ marginLeft: 4, fontWeight: 600, fontSize: size * 0.85 }}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
};

export default StarRating;
