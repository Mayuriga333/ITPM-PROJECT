import React, { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import API from "../api/axios";
import { toast } from "react-toastify";

const ReviewForm = ({ sessionId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await API.post("/reviews", {
        sessionId,
        rating,
        reviewText,
        isAnonymous,
      });

      // Show moderation feedback
      if (data.moderationStatus === "flagged") {
        setModerationFeedback({
          type: "warning",
          message: data.moderationMessage || "Your review is under moderation.",
        });
        toast.warn("Review submitted — under moderation");
      } else if (data.moderationStatus === "rejected") {
        setModerationFeedback({
          type: "error",
          message: data.moderationMessage || "Review rejected due to policy violations.",
        });
        toast.error("Review rejected — please revise");
      } else {
        setModerationFeedback(null);
        toast.success("Review submitted successfully!");
      }

      if (onReviewSubmitted) onReviewSubmitted(data.review || data);
      setRating(0);
      setReviewText("");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit review";
      // Check for duplicate review error
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already")) {
        setModerationFeedback({
          type: "error",
          message: msg,
        });
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h4 style={{ marginBottom: 12 }}>Leave a Review</h4>

      <div className="star-input">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={star <= (hoverRating || rating) ? "active" : ""}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            {star <= (hoverRating || rating) ? (
              <FaStar />
            ) : (
              <FaRegStar />
            )}
          </button>
        ))}
        {rating > 0 && (
          <span style={{ fontSize: "0.9rem", color: "var(--gray-500)", alignSelf: "center" }}>
            {rating}/5
          </span>
        )}
      </div>

      <div className="form-group">
        <textarea
          className="form-textarea"
          placeholder="Share your experience with this volunteer..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={1000}
          rows={4}
        />
      </div>

      <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        <label htmlFor="anonymous" style={{ fontWeight: 500, fontSize: "0.9rem", cursor: "pointer" }}>
          Submit anonymously
        </label>
      </div>

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>

      {moderationFeedback && (
        <div
          className={`moderation-feedback ${
            moderationFeedback.type === "warning" ? "feedback-warning" : "feedback-error"
          }`}
          style={{ marginTop: 12 }}
        >
          <span>{moderationFeedback.type === "warning" ? "⚠️" : "❌"}</span>
          <p style={{ margin: 0 }}>{moderationFeedback.message}</p>
        </div>
      )}
    </form>
  );
};

export default ReviewForm;
