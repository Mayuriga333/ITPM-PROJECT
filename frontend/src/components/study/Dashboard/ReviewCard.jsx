import React from 'react';
import Card from '../common/Card';
import StarRating from '../common/StarRating';
import { Textarea } from '../common/Textarea';
import { Input, Label } from '../common/Input';
import Button from '../common/Button';

const ReviewCard = () => {
  return (
    <Card className="max-w-4xl relative overflow-hidden" noPadding>
      {/* Decorative left border */}
      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary"></div>
      
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-white">Data Science with Sarah Chen</h2>
          <span className="text-[14px] text-indigo-200">3/25/2026</span>
        </div>

        <div className="bg-white/5 rounded-2xl p-6 border border-white/20">
          <h3 className="font-bold text-white mb-1">Leave a Review</h3>
          <p className="text-indigo-200 text-sm mb-4">Share clear, constructive feedback about your session.</p>

          <div className="mb-6 bg-white/10 inline-block p-2 rounded-xl border border-white/20 shadow-sm">
            <StarRating />
          </div>

          <div className="mb-6">
            <Label>Your Review</Label>
            <Textarea placeholder="Share your experience with this volunteer..." />
          </div>

          <div className="mb-6">
            <Label>Topic/Subject Studied *</Label>
            <Input placeholder="e.g. Data Science" />
          </div>

          <Button className="w-full bg-gradient-to-r from-primary to-primary-hover">
            Submit Review
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ReviewCard;
