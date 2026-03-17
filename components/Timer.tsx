import React from "react";

interface TimerProps {
  secondsLeft: number;
  maxSeconds?: number;
}

const Timer: React.FC<TimerProps> = ({ secondsLeft, maxSeconds = 90 }) => {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeString = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  const isUrgent = secondsLeft <= Math.floor(maxSeconds * 0.15);

  return (
    <div
      className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl border-4 shadow-clash-card ${
        isUrgent ? "bg-clash-red border-[#881337]" : "bg-clash-woodlight border-clash-wood"
      } transition-colors duration-500`}
    >
      <span className="text-3xl font-clash text-white tracking-widest">{timeString}</span>
    </div>
  );
};

export default Timer;
