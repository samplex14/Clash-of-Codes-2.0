import React from "react";
import LoadingRadar from "@/components/ui/loading-radar";

interface LoadingCardProps {
  message?: string;
  subMessage?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  message = "Preparing for Battle...",
  subMessage = "Sharpening swords, brewing spells..."
}) => {
  return (
    <div className="fixed inset-0 bg-[#3b1f0e]/95 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-[#4a2810] border-[6px] border-[#c9a84c] p-10 rounded-xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/wood-pattern.png')] opacity-10 pointer-events-none" />
        <div className="absolute top-2 left-2 w-4 h-4 bg-[#c9a84c] rounded-full border border-[#2a1506] shadow-inner" />
        <div className="absolute top-2 right-2 w-4 h-4 bg-[#c9a84c] rounded-full border border-[#2a1506] shadow-inner" />
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-[#c9a84c] rounded-full border border-[#2a1506] shadow-inner" />
        <div className="absolute bottom-2 right-2 w-4 h-4 bg-[#c9a84c] rounded-full border border-[#2a1506] shadow-inner" />

        <div className="mb-8 scale-125 transform">
          <LoadingRadar />
        </div>

        <h2 className="text-[#e8c96a] font-serif text-2xl font-bold tracking-widest uppercase mb-2 text-shadow-sm animate-pulse text-center font-clash">
          {message}
        </h2>
        <p className="text-[#9a8a68] text-sm text-center italic">{subMessage}</p>
      </div>
    </div>
  );
};

export default LoadingCard;
