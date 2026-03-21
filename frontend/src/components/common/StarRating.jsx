import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const StarRating = ({ initialRating = 0, onRatingChange, readOnly = false }) => {
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);

  const starVariants = {
    hover: { scale: 1.2, transition: { type: 'spring', stiffness: 400, damping: 10 } },
    tap: { scale: 0.9 },
    initial: { scale: 1 },
  };

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          disabled={readOnly}
          variants={starVariants}
          initial="initial"
          whileHover={readOnly ? 'initial' : 'hover'}
          whileTap={readOnly ? 'initial' : 'tap'}
          onClick={() => {
            if (!readOnly) {
              setRating(star);
              if (onRatingChange) onRatingChange(star);
            }
          }}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
        >
          <Star
            size={24}
            strokeWidth={1.5}
            className={`transition-colors duration-150 ${
              star <= (hover || rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-neutral-300'
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

export default StarRating;
