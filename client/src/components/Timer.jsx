import React from 'react';

const Timer = ({ secondsLeft, maxSeconds = 90 }) => {
  // Calculate percentage for an optional progress bar visual
  const percentage = maxSeconds > 0 ? (secondsLeft / maxSeconds) * 100 : 0;
  
  // Format MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  // Change color if time is running low
  const isUrgent = secondsLeft <= 15;

  return (
    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-4 shadow-clash-card 
      ${isUrgent ? 'bg-clash-red border-[#881337]' : 'bg-clash-woodlight border-clash-wood'} transition-colors duration-500`}>
      <span className="text-3xl font-clash text-white tracking-widest">{timeString}</span>
    </div>
  );
};

export default Timer;
