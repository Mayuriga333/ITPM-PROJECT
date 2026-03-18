// ============================================
// Review Moderation Middleware
// Detects inappropriate words, flags suspicious
// reviews, and provides moderation scoring
// ============================================

// Severity levels for flagged content
const SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

// Inappropriate words categorized by severity
const INAPPROPRIATE_WORDS = {
  high: [
    "scam", "fraud", "kill", "die", "racist", "sexist",
  ],
  medium: [
    "idiot", "stupid", "dumb", "moron", "loser", "pathetic",
    "trash", "garbage", "useless", "hate", "disgusting",
  ],
  low: [
    "fake", "terrible", "awful", "worst", "sucks", "horrible",
    "waste", "boring", "lame", "annoying", "crap",
  ],
};

// Suspicious patterns with descriptions
const SUSPICIOUS_PATTERNS = [
  { pattern: /(.)\1{5,}/i, reason: "Excessive repeated characters", severity: SEVERITY.MEDIUM },
  { pattern: /buy\s*now|click\s*here|free\s*money|make\s*money|earn\s*cash/i, reason: "Spam content detected", severity: SEVERITY.HIGH },
  { pattern: /http[s]?:\/\/\S+/i, reason: "Contains external URL", severity: SEVERITY.MEDIUM },
  { pattern: /www\.\S+/i, reason: "Contains external URL", severity: SEVERITY.MEDIUM },
  { pattern: /[A-Z\s]{20,}/i, reason: "Excessive caps lock usage", severity: SEVERITY.LOW },
  { pattern: /(.{3,})\1{3,}/i, reason: "Repetitive text pattern detected", severity: SEVERITY.MEDIUM },
  { pattern: /[!]{4,}|[?]{4,}/i, reason: "Excessive punctuation", severity: SEVERITY.LOW },
  { pattern: /\b(\w+)\s+\1\s+\1\b/i, reason: "Repeated word spam", severity: SEVERITY.MEDIUM },
  { pattern: /(?:[\u{1F600}-\u{1F64F}][\s]*){6,}/u, reason: "Excessive emoji usage", severity: SEVERITY.LOW },
  { pattern: /\b(?:\d{10,})\b/, reason: "Contains phone number", severity: SEVERITY.MEDIUM },
  { pattern: /[\w.+-]+@[\w-]+\.[\w.]+/, reason: "Contains email address", severity: SEVERITY.LOW },
];

/**
 * Detect inappropriate content in review text
 * Returns detailed moderation analysis with flags, reasons, and severity
 * @param {string} text - The review text to check
 * @param {number} rating - The review rating (1-5)
 * @returns {{ flagged: boolean, reasons: string[], severity: string, autoReject: boolean, score: number }}
 */
exports.detectInappropriateContent = (text, rating) => {
  const result = {
    flagged: false,
    reasons: [],
    severity: null,
    autoReject: false,
    score: 0, // 0 = clean, higher = more suspicious
  };

  if (!text || text.trim().length === 0) {
    return result;
  }

  const lowerText = text.toLowerCase();

  // Check high-severity inappropriate words
  for (const word of INAPPROPRIATE_WORDS.high) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lowerText)) {
      result.flagged = true;
      result.reasons.push(`Contains severely inappropriate language: "${word}"`);
      result.score += 30;
    }
  }

  // Check medium-severity inappropriate words
  for (const word of INAPPROPRIATE_WORDS.medium) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lowerText)) {
      result.flagged = true;
      result.reasons.push(`Contains inappropriate language: "${word}"`);
      result.score += 15;
    }
  }

  // Check low-severity inappropriate words
  for (const word of INAPPROPRIATE_WORDS.low) {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    if (regex.test(lowerText)) {
      result.reasons.push(`Contains negative language: "${word}"`);
      result.score += 5;
    }
  }

  // Check suspicious patterns
  for (const { pattern, reason, severity } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(text)) {
      result.flagged = true;
      result.reasons.push(reason);
      result.score += severity === SEVERITY.HIGH ? 30 : severity === SEVERITY.MEDIUM ? 15 : 5;
    }
  }

  // Heuristic: Very short review with 1-star rating is suspicious
  if (rating === 1 && text.trim().length < 15) {
    result.reasons.push("Very short negative review — may be unconstructive");
    result.score += 10;
  }

  // Heuristic: ALL CAPS review
  const upperRatio = (text.replace(/[^A-Z]/g, "").length) / (text.replace(/[^a-zA-Z]/g, "").length || 1);
  if (text.length > 20 && upperRatio > 0.7) {
    result.reasons.push("Review is mostly in CAPS");
    result.score += 10;
    result.flagged = true;
  }

  // Determine final severity
  if (result.score >= 30) {
    result.severity = SEVERITY.HIGH;
    result.flagged = true;
  } else if (result.score >= 15) {
    result.severity = SEVERITY.MEDIUM;
    result.flagged = true;
  } else if (result.score >= 5) {
    result.severity = SEVERITY.LOW;
    // Low severity: flag only if score is 10+
    if (result.score >= 10) result.flagged = true;
  }

  // Auto-reject extremely inappropriate content (score 60+)
  if (result.score >= 60) {
    result.autoReject = true;
  }

  return result;
};

/**
 * Middleware version: attach moderation result to req
 */
exports.moderateReviewMiddleware = (req, res, next) => {
  const { reviewText, rating } = req.body;
  if (reviewText) {
    req.moderationResult = exports.detectInappropriateContent(reviewText, rating);
  } else {
    req.moderationResult = { flagged: false, reasons: [], severity: null, autoReject: false, score: 0 };
  }
  next();
};

