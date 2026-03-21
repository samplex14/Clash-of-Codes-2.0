import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ArenaLoadingCardProps {
  name: string;
  usn: string;
  year: "1ST YEAR" | "2ND YEAR";
}

export default function ArenaLoadingCard({ name, usn, year }: ArenaLoadingCardProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative z-10 w-full max-w-lg mx-auto p-8 rounded-3xl backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
      
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-black text-white tracking-wider mb-8 drop-shadow-md font-clash uppercase leading-tight">
        Entering the<br />Arena...
      </h1>

      {/* Radar Animation */}
      <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-white/10 animate-[spin_4s_linear_infinite]" />
        
        {/* Scanning Line */}
        <div className="absolute inset-0 rounded-full border-t-4 border-l-4 border-transparent border-t-green-400/50 border-l-green-400/20 rotate-45 animate-[spin_2s_linear_infinite]" />
        
        {/* Pulsing Core */}
        <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_15px_#4ade80] animate-pulse" />
        
        {/* Expanding Ring 1 */}
        <div className="absolute inset-4 rounded-full border-2 border-white/5 animate-ping opacity-20 duration-[2000ms]" />
        
        {/* Expanding Ring 2 */}
        <div className="absolute inset-8 rounded-full border-2 border-white/5 animate-ping opacity-40 delay-500 duration-[2000ms]" />
      </div>

      {/* Subtitle */}
      <h2 className="text-xl md:text-2xl font-bold text-white/90 tracking-wide mb-3 drop-shadow-sm font-clash">
        Summoning a worthy opponent...
      </h2>

      {/* Timer Status */}
      <p className="text-white/60 font-semibold tracking-wider text-sm mb-10 uppercase">
        Searching for {seconds} seconds...
      </p>

      {/* Player Badge */}
      <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-black/20 border border-white/10 backdrop-blur-sm shadow-inner transition-transform hover:scale-105">
        <span className="text-white font-bold tracking-widest text-sm uppercase">{name}</span>
        <div className="w-1 h-1 rounded-full bg-white/40" />
        {/* Year Label - dynamic based on prop */}
        <span className={cn(
          "font-black tracking-widest text-xs uppercase px-2 py-0.5 rounded",
          year === "1ST YEAR" ? "bg-blue-500/20 text-blue-200" : "bg-purple-500/20 text-purple-200"
        )}>
          {year}
        </span>
        <div className="w-1 h-1 rounded-full bg-white/40" />
        <span className="text-white/70 font-mono font-bold tracking-widest text-sm uppercase">{usn}</span>
      </div>

    </div>
  );
}
