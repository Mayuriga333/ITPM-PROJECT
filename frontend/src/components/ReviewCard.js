import React from "react";
import StarRating from "./StarRating";

const ReviewCard = ({ review, showStatus }) => {
  const date = new Date(review.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  const formattedSessionDate = review.sessionDate
    ? new Date(review.sessionDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
    <div className="review-card card review-card-modern">
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
        <p className="review-text review-quote">"{review.reviewText}"</p>
      )}

      {review.topicStudied && (
        <div className="review-footer review-chip-row" style={{ marginTop: 8 }}>
          <span className="review-chip">Topic: {review.topicStudied}</span>
        </div>
      )}

      {Array.isArray(review.feedbackTags) && review.feedbackTags.length > 0 && (
        <div className="review-chip-row" style={{ marginTop: 8 }}>
          {review.feedbackTags.map((tag) => (
            <span key={tag} className="review-chip review-chip-soft">
              {tag.replace("_", " ")}
            </span>
          ))}
        </div>
      )}

      {(review.experienceType || formattedSessionDate || typeof review.followUpMatchAgain === "boolean") && (
        <div className="review-footer review-chip-row" style={{ marginTop: 8 }}>
          {formattedSessionDate && <span className="review-chip">Session: {formattedSessionDate}</span>}
          {review.experienceType && <span className="review-chip">Type: {review.experienceType.replace("_", " ")}</span>}
          {typeof review.followUpMatchAgain === "boolean" && (
            <span className="review-chip">Match again: {review.followUpMatchAgain ? "Yes" : "No"}</span>
          )}
        </div>
      )}

      {review.recommendation && (
        <p className="review-text" style={{ marginTop: 8 }}>
          Recommendation: {review.recommendation}
        </p>
      )}

      {review.attachment?.fileUrl && (
        <div className="review-footer" style={{ marginTop: 8 }}>
          <a
            className="review-link"
            href={`http://localhost:5000${review.attachment.fileUrl}`}
            target="_blank"
            rel="noreferrer"
          >
            View attachment
          </a>
        </div>
      )}

      <div className="review-footer">
        <span>📚 {review.subject}</span>
      </div>
    </div>
  );
};

export default ReviewCard;
