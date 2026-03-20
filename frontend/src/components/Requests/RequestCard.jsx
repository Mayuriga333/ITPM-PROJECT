import React from 'react';
import { Calendar, Clock, BookOpen, Check, X } from 'lucide-react';
import { format } from 'date-fns';

const RequestCard = ({ request, type = 'student', onAccept, onReject }) => {
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

  return (
    <div className="card-soft p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {type === 'student' ? request.volunteerName : request.studentName}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-200">{request.subject}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-slate-300">
          <Calendar className="h-4 w-4" />
          <span className="text-sm">
            {format(new Date(request.date), 'MMM dd, yyyy')}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{request.timeSlot}</span>
        </div>
      </div>

      {request.message && (
        <p className="text-sm text-slate-200 bg-slate-900/60 border border-slate-700 rounded-lg p-3 mb-4">
          "{request.message}"
        </p>
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