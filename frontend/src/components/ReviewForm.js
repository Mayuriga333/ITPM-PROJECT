import React, { useState } from "react";
import { FaStar, FaRegStar } from "react-icons/fa";
import API from "../api/axios";
import { toast } from "react-toastify";

const VALID_TAGS = ["positive", "neutral", "needs_improvement"];
const VALID_EXPERIENCE_TYPES = ["practice", "review", "new_learning"];
const TOPIC_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&]+$/;
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,!?\-_'"():;/&\n\r]*$/;

const ReviewForm = ({ sessionId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [topicStudied, setTopicStudied] = useState("");
  const [followUpMatchAgain, setFollowUpMatchAgain] = useState("");
  const [feedbackTags, setFeedbackTags] = useState([]);
  const [sessionDate, setSessionDate] = useState("");
  const [experienceType, setExperienceType] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState(null);

  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  const minDateObj = new Date();
  minDateObj.setFullYear(minDateObj.getFullYear() - 1);
  const minDate = minDateObj.toISOString().split("T")[0];

  const validateForm = () => {
    if (rating === 0) {
      return "Please select a rating";
    }

    const cleanTopic = topicStudied.trim();
    if (!cleanTopic) return "Topic/Subject studied is required";
    if (cleanTopic.length < 3 || cleanTopic.length > 200) {
      return "Topic/Subject studied must be 3-200 characters";
    }
    if (!TOPIC_REGEX.test(cleanTopic)) {
      return "Topic/Subject studied contains invalid characters";
    }

    if (!["yes", "no"].includes(followUpMatchAgain)) {
      return "Please select follow-up action (Yes or No)";
    }

    if (!Array.isArray(feedbackTags) || feedbackTags.length === 0) {
      return "Please select at least one feedback tag";
    }
    if (feedbackTags.length > 3) {
      return "You can select up to 3 feedback tags";
    }
    if (feedbackTags.some((tag) => !VALID_TAGS.includes(tag))) {
      return "Invalid feedback tag selected";
    }

    if (!sessionDate) return "Session date is required";
    const parsedDate = new Date(sessionDate);
    if (Number.isNaN(parsedDate.getTime())) return "Session date format is invalid";
    if (sessionDate > maxDate) return "Session date cannot be in the future";
    if (sessionDate < minDate) return "Session date cannot be older than 1 year";

    if (!VALID_EXPERIENCE_TYPES.includes(experienceType)) {
      return "Please select a valid experience type";
    }

    const cleanRecommendation = recommendation.trim();
    if (cleanRecommendation.length > 500) {
      return "Recommendation cannot exceed 500 characters";
    }
    if (cleanRecommendation && !SAFE_TEXT_REGEX.test(cleanRecommendation)) {
      return "Recommendation contains unsafe characters";
    }

    if (attachment) {
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(attachment.type)) {
        return "Only .jpg, .png, and .pdf files are allowed";
      }
      if (attachment.size > 5 * 1024 * 1024) {
        return "Attachment must be 5MB or less";
      }
    }

    return null;
  };

  const toggleTag = (tagValue) => {
    setFeedbackTags((prev) => {
      if (prev.includes(tagValue)) {
        return prev.filter((t) => t !== tagValue);
      }
      if (prev.length >= 3) {
        toast.error("You can select up to 3 tags");
        return prev;
      }
      return [...prev, tagValue];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationMessage = validateForm();
    if (validationMessage) {
      setModerationFeedback({ type: "error", message: validationMessage });
      toast.error(validationMessage);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("rating", String(rating));
      formData.append("reviewText", reviewText);
      formData.append("isAnonymous", String(isAnonymous));
      formData.append("topicStudied", topicStudied.trim());
      formData.append("followUpMatchAgain", String(followUpMatchAgain === "yes"));
      formData.append("feedbackTags", JSON.stringify(feedbackTags));
      formData.append("sessionDate", sessionDate);
      formData.append("experienceType", experienceType);
      formData.append("recommendation", recommendation.trim());
      if (attachment) {
        formData.append("attachment", attachment);
      }

      const { data } = await API.post("/reviews", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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
      setTopicStudied("");
      setFollowUpMatchAgain("");
      setFeedbackTags([]);
      setSessionDate("");
      setExperienceType("");
      setAttachment(null);
      setRecommendation("");
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
    <form className="review-form review-form-modern" onSubmit={handleSubmit}>
      <div className="review-form-header">
        <h4>Leave a Review</h4>
        <p>Share clear, constructive feedback about your session.</p>
      </div>

      <div className="star-input star-input-modern">
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
          <span className="star-input-score">
            {rating}/5
          </span>
        )}
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Your Review</label>
        <textarea
          className="form-textarea"
          placeholder="Share your experience with this volunteer..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          maxLength={1000}
          rows={4}
        />
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Topic/Subject Studied *</label>
        <input
          type="text"
          className="form-input"
          placeholder="Example: Algebra - Quadratic Equations"
          value={topicStudied}
          onChange={(e) => setTopicStudied(e.target.value)}
          minLength={3}
          maxLength={200}
          required
        />
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Follow-up Action *</label>
        <div className="review-radio-group">
          <label className="review-choice">
            <input
              type="radio"
              name="followUpMatchAgain"
              value="yes"
              checked={followUpMatchAgain === "yes"}
              onChange={(e) => setFollowUpMatchAgain(e.target.value)}
            />
            Would like to be matched again: Yes
          </label>
          <label className="review-choice">
            <input
              type="radio"
              name="followUpMatchAgain"
              value="no"
              checked={followUpMatchAgain === "no"}
              onChange={(e) => setFollowUpMatchAgain(e.target.value)}
            />
            Would like to be matched again: No
          </label>
        </div>
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Tags / Feedback Type * (max 3)</label>
        <div className="review-tag-grid">
          <label className="review-choice review-tag-option">
            <input
              type="checkbox"
              checked={feedbackTags.includes("positive")}
              onChange={() => toggleTag("positive")}
            />
            Positive
          </label>
          <label className="review-choice review-tag-option">
            <input
              type="checkbox"
              checked={feedbackTags.includes("neutral")}
              onChange={() => toggleTag("neutral")}
            />
            Neutral
          </label>
          <label className="review-choice review-tag-option">
            <input
              type="checkbox"
              checked={feedbackTags.includes("needs_improvement")}
              onChange={() => toggleTag("needs_improvement")}
            />
            Needs Improvement
          </label>
        </div>
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Session Date *</label>
        <input
          type="date"
          className="form-input"
          value={sessionDate}
          min={minDate}
          max={maxDate}
          onChange={(e) => setSessionDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Experience Type *</label>
        <select
          className="form-select"
          value={experienceType}
          onChange={(e) => setExperienceType(e.target.value)}
          required
        >
          <option value="">Select experience type</option>
          <option value="practice">Practice</option>
          <option value="review">Review</option>
          <option value="new_learning">New Learning</option>
        </select>
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Upload Screenshot or Notes (optional, .jpg/.png/.pdf, max 5MB)</label>
        <input
          type="file"
          className="form-input review-file-input"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => {
            const selectedFile = e.target.files && e.target.files[0] ? e.target.files[0] : null;
            setAttachment(selectedFile);
          }}
        />
      </div>

      <div className="form-group review-field-group">
        <label className="form-label">Recommendation (optional)</label>
        <textarea
          className="form-textarea"
          placeholder="Suggestions or comments (max 500 characters)"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          maxLength={500}
          rows={3}
        />
      </div>

      <div className="form-group review-field-group review-anon-toggle">
        <input
          type="checkbox"
          id="anonymous"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        <label htmlFor="anonymous">
          Submit anonymously
        </label>
      </div>

      <button type="submit" className="btn btn-primary review-submit-btn" disabled={submitting}>
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
