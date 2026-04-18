import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Tag, RotateCcw, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { requestAPI } from '../../../services/api';
import toast from 'react-hot-toast';

/**
 * Computes the goal alignment score from review fields.
 * Formula: (rating/5)*60 + (followUp?20:0) + (positive?20:neutral?10:0)
 */
function computeGoalScore(rating, followUpMatchAgain, feedbackTags = []) {
  const tagScore = feedbackTags.includes('positive') ? 20
    : feedbackTags.includes('neutral') ? 10 : 0;
  return Math.min(100, Math.round((rating / 5) * 60 + (followUpMatchAgain ? 20 : 0) + tagScore));
}

function GoalScoreBadge({ score }) {
  const color = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'rose';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
        bg-${color}-500/15 text-${color}-300 border border-${color}-500/30`}
    >
      <Target className="h-3 w-3" />
      {score}% goal matched
    </span>
  );
}

function GoalScoreWithFormula({ score, rating, followUpMatchAgain, feedbackTags = [] }) {
  const [open, setOpen] = useState(false);
  const color = score >= 80 ? 'emerald' : score >= 55 ? 'amber' : 'rose';

  const ratingPts = Math.round((rating / 5) * 60);
  const followUpPts = followUpMatchAgain ? 20 : 0;
  const tagPts = feedbackTags.includes('positive') ? 20
    : feedbackTags.includes('neutral') ? 10 : 0;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 flex-wrap">
        <GoalScoreBadge score={score} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20"
        >
          How is this calculated?
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {open && (
        <div className="bg-[#0d1117] border border-indigo-500/20 rounded-xl p-4 mt-1 space-y-3 text-xs">
          <p className="text-indigo-300 font-semibold">Goal Alignment Formula</p>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">★ Rating <span className="text-slate-500">({rating}/5 × 60)</span></span>
            <span className="font-bold text-yellow-400">+{ratingPts} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">
              <Tag className="h-3 w-3 inline mr-1 text-indigo-400" />
              Feedback quality <span className="text-slate-500">(positive +20, neutral +10)</span>
            </span>
            <span className="font-bold text-indigo-400">+{tagPts} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">
              <RotateCcw className="h-3 w-3 inline mr-1 text-emerald-400" />
              Recommendation <span className="text-slate-500">(match again: yes +20)</span>
            </span>
            <span className="font-bold text-emerald-400">+{followUpPts} pts</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-slate-400 font-semibold">Total Score</span>
            <span className={`font-bold text-${color}-300 text-sm`}>{score} / 100</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full bg-${color}-400 transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function VisibilityBadge({ visibility }) {
  return visibility === 'private' ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-600/40 text-slate-400 border border-slate-600/50">
      🔒 Private
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30">
      🌐 Public
    </span>
  );
}

function ReviewHistoryCard({ item }) {
  const score = item.goalAlignmentScore != null
    ? item.goalAlignmentScore
    : computeGoalScore(item.rating, item.followUpMatchAgain, item.feedbackTags);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">{item.volunteerName}</p>
          <p className="text-indigo-300 text-xs mt-0.5">{item.subject}</p>
        </div>
        <VisibilityBadge visibility={item.feedbackVisibility} />
      </div>

      {/* Goal score with formula */}
      <GoalScoreWithFormula
        score={score}
        rating={item.rating}
        followUpMatchAgain={item.followUpMatchAgain}
        feedbackTags={item.feedbackTags}
      />

      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <span key={s} className={s <= item.rating ? 'text-yellow-400 text-base' : 'text-slate-600 text-base'}>★</span>
        ))}
        <span className="text-slate-400 text-xs ml-1">{item.rating}/5</span>
      </div>

      {/* Review text */}
      {item.reviewText && (
        <p className="text-sm text-slate-300 italic bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-700/40">
          "{item.reviewText}"
        </p>
      )}

      {/* Tags + follow-up */}
      <div className="flex flex-wrap gap-2">
        {Array.isArray(item.feedbackTags) && item.feedbackTags.map((tag) => (
          <span
            key={tag}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              tag === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : tag === 'needs_improvement' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            {tag.replace('_', ' ')}
          </span>
        ))}
        {typeof item.followUpMatchAgain === 'boolean' && (
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${
            item.followUpMatchAgain
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            <RotateCcw className="h-3 w-3" />
            Match again: {item.followUpMatchAgain ? 'Yes' : 'No'}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        {item.reviewCreatedAt && (
          <span>Submitted: {format(new Date(item.reviewCreatedAt), 'MMM dd, yyyy')}</span>
        )}
        {item.experienceType && (
          <span>Type: {item.experienceType.replace('_', ' ')}</span>
        )}
        {item.moderationStatus && item.moderationStatus !== 'approved' && (
          <span className={item.moderationStatus === 'flagged' ? 'text-amber-400' : 'text-rose-400'}>
            Status: {item.moderationStatus}
          </span>
        )}
        {item.isAnonymous && <span className="italic">Anonymous</span>}
      </div>

      {/* Recommendation */}
      {item.recommendation && (
        <p className="text-xs text-slate-400 bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-700/30">
          <span className="font-semibold text-slate-500">Recommendation: </span>{item.recommendation}
        </p>
      )}
    </div>
  );
}

const FeedbackHistoryModal = ({ studentId, studentName, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId && !studentName) { setLoading(false); return; }
    requestAPI.getFeedbackHistory(studentId, studentName)
      .then((res) => setData(res.data?.data || { given: [] }))
      .catch(() => toast.error('Could not load feedback history'))
      .finally(() => setLoading(false));
  }, [studentId, studentName]);

  const given = data?.given || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="max-w-2xl w-full bg-[#0F121C] border border-[#1C2033] rounded-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1C2033]">
          <div>
            <h2 className="text-white font-bold text-lg">Feedback History</h2>
            <p className="text-indigo-300 text-sm mt-0.5">All feedback you have submitted</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
          ) : given.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">
              You haven't submitted any feedback yet.
            </p>
          ) : (
            given.map((item) => <ReviewHistoryCard key={item._id} item={item} />)
          )}
        </div>

        {/* Footer summary */}
        {!loading && given.length > 0 && (
          <div className="px-6 py-4 border-t border-[#1C2033] flex items-center gap-6 text-xs text-slate-400">
            <span>{given.length} review{given.length !== 1 ? 's' : ''} submitted</span>
            <span>{given.filter((r) => r.feedbackVisibility === 'public').length} public</span>
            <span>{given.filter((r) => r.feedbackVisibility === 'private').length} private</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackHistoryModal;
