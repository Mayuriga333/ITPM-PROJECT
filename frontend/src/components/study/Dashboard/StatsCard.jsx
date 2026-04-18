import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import Card from '../common/Card';

const StatsCard = ({ title, value, icon: Icon }) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
      });

      // Simple count up animation
      let start = 0;
      const end = parseInt(value) || 0;
      if (start === end) {
        setCount(end);
        return;
      }
      
      const duration = 1000;
      let startTimestamp = null;
      
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        setCount(Math.floor(progress * (end - start) + start));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      
      window.requestAnimationFrame(step);
    }
  }, [inView, value, controls]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
    >
      <div className="card-container flex flex-col items-center justify-center py-8 relative text-center">
        <div className="text-[36px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-1">
          {count}
        </div>
        <div className="text-[14px] text-neutral-500 font-medium">
          {title}
        </div>
        {Icon && (
          <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center opacity-0">
             <Icon size={20} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatsCard;
