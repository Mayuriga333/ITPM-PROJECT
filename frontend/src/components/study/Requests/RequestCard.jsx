import React from 'react';
import { Calendar, Clock, BookOpen, Check, X, Star, Paperclip, MessageSquare, Tag, RotateCcw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import StarRating from '../common/StarRating';

const RequestCard = ({ request, type = 'student', onAccept, onReject, onReview, onEdit, onDelete }) => {
  const getStatusColor = () => {
    switch (request.status) {
      case 'pending':
        return 'bg-yellow-500/15 text-yellow-300 border border-yellow-400/60';
      case 'accepted':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/60';
      case 'rejected':
        return 'bg-rose-500/15 text-rose-300 border border-rose-400/60';
      case 'completed':
        return 'bg-sky-500/15 text-sky-300 border border-sky-400/60';
      default:
        return 'bg-slate-500/10 text-slate-200 border border-slate-500/40';
    }
  };

  const getSessionDateTime = () => {
    if (!request?.date) return null;

    const baseDate = new Date(request.date);
    if (Number.isNaN(baseDate.getTime())) return null;

    if (request.timeSlot) {
      const [time, meridian] = request.timeSlot.split(' ');
      if (time && meridian) {
        const [hoursStr, minutesStr] = time.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10) || 0;

        if (meridian.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (meridian.toUpperCase() === 'AM' && hours === 12) hours = 0;

        baseDate.setHours(hours, minutes, 0, 0);
      }
    }

    return baseDate;
  };

  const sessionDateTime = getSessionDateTime();
  const now = new Date();
  const isPastSession = sessionDateTime ? sessionDateTime <= now : false;

  const showReviewButton =
    type === 'student' &&
    onReview &&
    ['accepted', 'completed'].includes(request.status) &&
    (!request.rating || request.rating === 0);

  const reviewEnabled =
    showReviewButton &&
    (request.status === 'completed' || (request.status === 'accepted' && isPastSession));

  return (
    <div className="card-soft p-6 bg-slate-800/80 border border-slate-700/50 hover:bg-slate-800 transition-colors shadow-lg shadow-black/20 rounded-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-xl text-white">
            {type === 'student' ? request.volunteerName : request.studentName}
          </h3>
          <div className="flex items-center space-x-2 mt-2">
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-slate-300">{request.subject}</span>   
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center space-x-3 text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
          <Calendar className="h-4 w-4 text-sky-400" />
          <span className="text-sm font-medium">
            {format(new Date(request.date), 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300 bg-slate-900/40 p-2.5 rounded-lg border border-slate-700/50">
          <Clock className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-medium">{request.timeSlot}</span>
        </div>
      </div>

      {request.message && (
        <div className="mb-6 space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</h4>
          <div className="text-sm text-slate-200 bg-slate-900/80 border border-slate-700 rounded-lg p-4 shadow-inner">
            <p className="italic">"{request.message}"</p>
          </div>
        </div>
      )}
      
      {request.status === 'rejected' && request.rejectReason && (
        <div className="mb-6 space-y-3">
          <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Rejection Reason</h4>
          <div className="text-sm text-rose-200 bg-rose-950/30 border border-rose-900/50 rounded-lg p-4 shadow-inner">
            <p>{request.rejectReason}</p>
          </div>
        </div>
      )}

      {/* Student-side actions / review */}
      {type === 'student' && (
        <>
          {/* ── Submitted Review Details (ITPM-style) ── */}
          {typeof request.rating === 'number' && request.rating > 0 && (
            <div className="mt-4 bg-slate-900/60 border border-slate-700/60 rounded-xl p-5 space-y-3">
              {/* Header row: stars + moderation badge + date */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StarRating initialRating={request.rating} readOnly />
                  {request.moderationStatus && request.moderationStatus !== 'approved' && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                      request.moderationStatus === 'flagged'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : request.moderationStatus === 'rejected'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}>
                      {request.moderationStatus === 'flagged' ? 'Under Review' : request.moderationStatus}
                    </span>
                  )}
                </div>
                {request.reviewCreatedAt && (
                  <span className="text-xs text-slate-500">
                    {format(new Date(request.reviewCreatedAt), 'MMM dd, yyyy')}
                  </span>
                )}
              </div>

              {/* Review text */}
              {request.reviewText && (
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-lg p-3">
                  <p className="text-sm text-slate-200 italic leading-relaxed">"{request.reviewText}"</p>
                </div>
              )}

              {/* Topic chip */}
              {request.reviewSubject && (
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-full">
                    Topic: {request.reviewSubject}
                  </span>
                </div>
              )}

              {/* Feedback tags */}
              {Array.isArray(request.feedbackTags) && request.feedbackTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Tag className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                  {request.feedbackTags.map((tag) => (
                    <span
                      key={tag}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        tag === 'positive'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : tag === 'needs_improvement'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}

              {/* Session date, experience type, follow-up */}
              {(request.reviewSessionDate || request.experienceType || typeof request.followUpMatchAgain === 'boolean') && (
                <div className="flex flex-wrap gap-2">
                  {request.reviewSessionDate && (
                    <span className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 rounded-full">
                      Session: {format(new Date(request.reviewSessionDate), 'MMM dd, yyyy')}
                    </span>
                  )}
                  {request.experienceType && (
                    <span className="text-xs text-slate-400 bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 rounded-full">
                      Type: {request.experienceType.replace('_', ' ')}
                    </span>
                  )}
                  {typeof request.followUpMatchAgain === 'boolean' && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      request.followUpMatchAgain
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      <RotateCcw className="h-3 w-3 inline mr-1" />
                      Match again: {request.followUpMatchAgain ? 'Yes' : 'No'}
                    </span>
                  )}
                </div>
              )}

              {/* Recommendation */}
              {request.recommendation && (
                <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recommendation</span>
                  </div>
                  <p className="text-sm text-slate-300">{request.recommendation}</p>
                </div>
              )}

              {/* Attachment */}
              {request.attachment?.fileUrl && (
                <div className="flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-indigo-400" />
                  <a
                    href={request.attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
                  >
                    {request.attachment.fileName || 'View attachment'}
                  </a>
                  {request.attachment.size > 0 && (
                    <span className="text-[10px] text-slate-500">
                      ({(request.attachment.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
              )}

              {/* Anonymous indicator */}
              {request.isAnonymous && (
                <span className="text-[11px] text-slate-500 italic">Submitted anonymously</span>
              )}
            </div>
          )}

          {/* Action buttons row */}
          <div className="flex items-center justify-end mt-4 gap-2">
            {request.status === 'pending' && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(request)}
                className="px-3 py-1.5 text-xs rounded-md bg-slate-700/80 text-slate-50 hover:bg-slate-600 transition-colors"
              >
                Edit
              </button>
            )}
            {['pending', 'rejected'].includes(request.status) && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(request)}
                className="px-3 py-1.5 text-xs rounded-md bg-rose-600/80 text-white hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            )}

            {showReviewButton && (
              <button
                type="button"
                onClick={
                  reviewEnabled
                    ? () => onReview(request)
                    : () => toast('Session hasn\'t occurred yet. You can review after the scheduled time.', { icon: '⏰' })
                }
                className={`px-4 py-2 text-sm rounded-lg font-medium shadow-md transition-colors ${
                  reviewEnabled
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                    : 'bg-slate-600/40 text-slate-300 hover:bg-slate-600/60'
                }`}
              >
                Leave a Review
              </button>
            )}
          </div>
        </>
      )}

      {type === 'volunteer' && request.status === 'pending' && (
        <div className="flex space-x-3">
          <button
            onClick={() => onAccept(request._id)}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Check className="h-4 w-4" />
            <span>Accept</span>
          </button>
          <button
            onClick={() => onReject(request._id)}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <X className="h-4 w-4" />
            <span>Reject</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestCard;