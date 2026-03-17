import React from "react";

const LoadingRadar: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <div className="absolute inset-0 border-4 border-t-[#c9a84c] border-r-transparent border-b-[#c9a84c] border-l-transparent rounded-full animate-spin" />
      <div className="absolute inset-2 border-4 border-t-transparent border-r-[#8b6914] border-b-transparent border-l-[#8b6914] rounded-full animate-spin-slow-reverse" />
      <div className="absolute inset-8 bg-[#4a7c3f] rounded-full animate-pulse border-2 border-[#c9a84c]" />
      <div className="absolute inset-0 rounded-full border border-[#c9a84c]/20 animate-ping-slow" />
    </div>
  );
};

export default LoadingRadar;
