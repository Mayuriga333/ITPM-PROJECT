import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Star, Tag, RotateCcw, Target, ChevronDown, ChevronUp,
  BookOpen, MessageSquare, HeartHandshake,
} from 'lucide-react';
import { studyVolunteerAPI } from '../../services/api';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────────────

function computeGoalScore(rating, followUpMatchAgain, feedbackTags = []) {
  const tagScore = feedbackTags.includes('positive') ? 20
    : feedbackTags.includes('neutral') ? 10 : 0;
  return Math.min(100, Math.round((rating / 5) * 60 + (followUpMatchAgain ? 20 : 0) + tagScore));
}

// ── GoalScoreWithFormula ──────────────────────────────────────────────────────

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
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
          bg-${color}-500/15 text-${color}-300 border border-${color}-500/30`}>
          <Target className="h-3 w-3" />
          {score}% goal matched
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
        >
          How is this calculated?
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {open && (
        <div className="bg-[#0d1117] border border-indigo-500/20 rounded-xl p-4 space-y-3 text-xs mt-1">
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
            <div className={`h-1.5 rounded-full bg-${color}-400`} style={{ width: `${score}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({ review }) {
  const score = review.goalAlignmentScore != null
    ? review.goalAlignmentScore
    : computeGoalScore(review.rating, review.followUpMatchAgain, review.feedbackTags);

  return (
    <div className="bg-[#0F121C] border border-[#1C2033] rounded-2xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-white font-semibold text-sm">{review.studentName}</p>
          {review.reviewSessionDate && (
            <p className="text-slate-500 text-[11px] mt-0.5">
              Session: {format(new Date(review.reviewSessionDate), 'MMM dd, yyyy')}
            </p>
          )}
        </div>
        {/* Stars */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={s <= review.rating ? 'text-yellow-400' : 'text-slate-600'}>★</span>
          ))}
          <span className="text-slate-400 text-xs ml-1">{review.rating}/5</span>
        </div>
      </div>

      {/* Review text */}
      {review.reviewText && (
        <p className="text-sm text-slate-300 italic bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-700/30">
          "{review.reviewText}"
        </p>
      )}

      {/* Topic chip */}
      {review.reviewSubject && (
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-full">
            Topic: {review.reviewSubject}
          </span>
        </div>
      )}

      {/* Tags */}
      {Array.isArray(review.feedbackTags) && review.feedbackTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.feedbackTags.map((tag) => (
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
          {typeof review.followUpMatchAgain === 'boolean' && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${
              review.followUpMatchAgain
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              <RotateCcw className="h-3 w-3" />
              Match again: {review.followUpMatchAgain ? 'Yes' : 'No'}
            </span>
          )}
        </div>
      )}

      {/* Goal score with formula */}
      <GoalScoreWithFormula
        score={score}
        rating={review.rating}
        followUpMatchAgain={review.followUpMatchAgain}
        feedbackTags={review.feedbackTags}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const VolunteerProfilePage = () => {
  const { volunteerId } = useParams();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studyVolunteerAPI.getById(volunteerId),
      studyVolunteerAPI.getReviews(volunteerId),
    ])
      .then(([volRes, revRes]) => {
        setVolunteer(volRes.data?.data || volRes.data);
        setReviews(revRes.data?.data || []);
      })
      .catch(() => toast.error('Failed to load volunteer profile'))
      .finally(() => setLoading(false));
  }, [volunteerId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0A0D14]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!volunteer) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#0A0D14] text-slate-400">
        Volunteer not found.
      </div>
    );
  }

  const initials = volunteer.name
    ? volunteer.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const avgGoalScore = reviews.length
    ? Math.round(reviews.reduce((sum, r) => {
        const s = r.goalAlignmentScore != null
          ? r.goalAlignmentScore
          : computeGoalScore(r.rating, r.followUpMatchAgain, r.feedbackTags);
        return sum + s;
      }, 0) / reviews.length)
    : null;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-slate-300 font-sans pb-16">
      {/* Nav bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-[#1C2033]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2 text-white font-bold">
          <HeartHandshake className="h-5 w-5" />
          EduConnect
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-10 space-y-8">

        {/* Profile header */}
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl font-bold text-white">{volunteer.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-semibold text-sm">
                  {(volunteer.rating || 0).toFixed(1)}
                </span>
                <span className="text-slate-500 text-xs">({volunteer.ratingCount || 0} reviews)</span>
              </div>
              {avgGoalScore !== null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Target className="h-3 w-3" />
                  Avg goal score: {avgGoalScore}%
                </span>
              )}
            </div>
            {volunteer.bio && (
              <p className="text-slate-400 text-sm leading-relaxed">{volunteer.bio}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {(volunteer.subjects || []).map((s) => (
                <span key={s} className="px-3 py-1 bg-[#151928] border border-[#21273B] text-slate-300 rounded-lg text-[11px] uppercase font-bold tracking-widest">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Request support button */}
        <button
          type="button"
          onClick={() => navigate(`/study/request/${volunteerId}`)}
          className="w-full bg-[#c4b5fd] hover:bg-[#a78bfa] text-[#1e1b4b] font-bold py-3.5 rounded-2xl transition-all shadow-lg"
        >
          Request Support
        </button>

        {/* Reviews section */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              Student Reviews
              <span className="ml-2 text-sm font-normal text-slate-500">({volunteer.ratingCount || reviews.length})</span>
            </h2>
          </div>

          {reviews.length === 0 ? (
            <div className="bg-[#0F121C] border border-[#1C2033] rounded-2xl p-6 space-y-4">
              {/* Show aggregate stats from the volunteer doc when no detailed review documents exist */}
              {(volunteer.ratingCount || 0) > 0 ? (
                <>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-bold text-lg">{(volunteer.rating || 0).toFixed(1)}</span>
                      <span className="text-slate-400 text-sm">average rating</span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      Based on <span className="text-white font-semibold">{volunteer.ratingCount}</span> student reviews
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs">Detailed review cards will appear here as students submit written feedback.</p>
                </>
              ) : (
                <p className="text-center text-slate-500 text-sm">No reviews yet.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfilePage;
