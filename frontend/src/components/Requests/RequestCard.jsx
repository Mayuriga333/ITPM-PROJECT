import React from 'react';
import { Calendar, Clock, BookOpen, Check, X } from 'lucide-react';
import { format } from 'date-fns';
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
        <div className="flex items-center justify-between mt-4 gap-4">
          {typeof request.rating === 'number' && request.rating > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Your Rating
              </span>
              <StarRating initialRating={request.rating} readOnly />
            </div>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
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
                onClick={reviewEnabled ? () => onReview(request) : undefined}
                disabled={!reviewEnabled}
                className={`px-4 py-2 text-sm rounded-lg font-medium shadow-md transition-colors ${
                  reviewEnabled
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
                    : 'bg-slate-600/40 text-slate-300 cursor-not-allowed'
                }`}
              >
                Leave a Review
              </button>
            )}
          </div>
        </div>
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