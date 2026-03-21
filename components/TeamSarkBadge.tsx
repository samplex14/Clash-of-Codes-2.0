"use client";

import React from "react";
import { cn } from "@/lib/utils";

export default function TeamSarkBadge() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-end font-sans group">
      <style>{`
        @keyframes rollSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateX(-12px); }
          100% { opacity: 1; transform: translateX(0px); }
        }
        .group:hover .s-letter {
          animation: rollSpin 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .group:hover .sark-text {
          animation: fadeSlideIn 0.5s ease forwards;
          animation-delay: 0.6s;
        }
        .badge-container {
          width: 60px;
          transition: width 0.7s cubic-bezier(0.34,1.56,0.64,1);
        }
        .group:hover .badge-container {
          width: 230px;
        }
      `}</style>

      <div
        className={cn(
          "badge-container flex items-center h-[60px] bg-[#1e1a17] border-2 border-[#5e3a21] rounded-full shadow-[0_4px_0_0_#3b2414] overflow-hidden cursor-pointer hover:bg-[#2a221b] hover:shadow-[0_6px_0_0_#3b2414] hover:-translate-y-0.5 transition-transform duration-300"
        )}
      >
        {/* S circle */}
        <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full">
          <span
            className="s-letter font-clash text-3xl font-bold text-[#fcd32a] drop-shadow-[0_2px_0_rgba(0,0,0,0.5)] pt-1 inline-block"
            style={{ WebkitTextStroke: "1.5px #5e3a21" }}
          >
            S
          </span>
        </div>

        {/* Expanded text */}
        <div className="sark-text flex flex-col justify-center whitespace-nowrap overflow-hidden opacity-0 pl-2">
          <span className="text-[11px] text-[#dacab5] leading-none uppercase tracking-widest font-semibold mb-1">
            Built By
          </span>
          <span className="text-base font-clash text-white tracking-wide leading-none">
            TEAM <span className="text-[#fcd32a] drop-shadow-sm">SARK</span>
          </span>
        </div>
      </div>
    </div>
  );
}