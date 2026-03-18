import React from "react";
import StarRating from "./StarRating";

const ReviewCard = ({ review, showStatus }) => {
  const date = new Date(review.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const studentName = review.isAnonymous
    ? "Anonymous"
    : review.student?.name || "Student";

  const getStatusStyle = (status) => {
    const map = {
      approved: { bg: "#10B98120", color: "#10B981", label: "Approved" },
      flagged: { bg: "#F59E0B20", color: "#F59E0B", label: "Under Review" },
      pending: { bg: "#3B82F620", color: "#3B82F6", label: "Pending" },
      rejected: { bg: "#EF444420", color: "#EF4444", label: "Rejected" },
    };
    return map[status] || map.pending;
  };

  return (
    <div className="review-card card">
      <div className="review-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StarRating rating={review.rating} size={14} showNumber={false} />
            {showStatus && review.status && review.status !== "approved" && (
              <span
                className="badge"
                style={{
                  background: getStatusStyle(review.status).bg,
                  color: getStatusStyle(review.status).color,
                  fontSize: "0.7rem",
                }}
              >
                {getStatusStyle(review.status).label}
              </span>
            )}
          </div>
          <div className="review-student" style={{ marginTop: 4 }}>
            {studentName}
          </div>
        </div>
        <div className="review-meta">{formattedDate}</div>
      </div>

      {review.reviewText && (
        <p className="review-text">"{review.reviewText}"</p>
      )}

      <div className="review-footer">
        <span>📚 {review.subject}</span>
      </div>
    </div>
  );
};

export default ReviewCard;
