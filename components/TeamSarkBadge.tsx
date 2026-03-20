"use client";

import React from "react";
import { cn } from "@/lib/utils";

export default function TeamSarkBadge() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end font-sans group">
      <div 
        className={cn(
          "flex items-center h-12 bg-[#1e1a17] border-2 border-[#5e3a21] rounded-full shadow-[0_4px_0_0_#3b2414] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden hover:pr-6 cursor-pointer hover:bg-[#2a221b] hover:shadow-[0_6px_0_0_#3b2414] hover:-translate-y-0.5"
        )}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#1e1a17] rounded-full transition-colors group-hover:border-[#fcd32a]">
          <span 
            className="font-clash text-2xl font-bold text-[#fcd32a] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] pt-1" 
            style={{ WebkitTextStroke: "1.5px #5e3a21" }}
          >
            S
          </span>
        </div>
        
        <div className="max-w-0 group-hover:max-w-[200px] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap overflow-hidden flex flex-col justify-center opacity-0 group-hover:opacity-100 pl-1">
            <span className="text-[10px] text-[#dacab5] leading-none uppercase tracking-widest font-semibold mb-0.5">
              Built By
            </span>
            <span className="text-sm font-clash text-white tracking-wide leading-none">
               TEAM <span className="text-[#fcd32a] drop-shadow-sm">SARK</span>
            </span>
        </div>
      </div>
    </div>
  );
}
