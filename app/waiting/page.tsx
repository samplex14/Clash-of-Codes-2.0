"use client";

import React from "react";
import { useParticipant } from "@/components/providers/ParticipantProvider";

const WaitingPage: React.FC = () => {
  const { participant } = useParticipant();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="card-clash max-w-2xl w-full text-center space-y-6 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-clash text-clash-gold drop-shadow-md">Village Camp</h2>
        <p className="text-xl text-white">You are in the Top 64. Please wait for admin instructions.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">Name</p>
            <p className="text-white font-bold">{participant?.name ?? "-"}</p>
          </div>
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">USN</p>
            <p className="text-white font-bold">{participant?.usn ?? "-"}</p>
          </div>
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">Phase 1 Rank</p>
            <p className="text-white font-bold">{participant?.phase1Rank ? `#${participant.phase1Rank}` : "-"}</p>
          </div>
        </div>

        <div className="relative w-24 h-24 my-12">
          <div className="absolute inset-0 border-4 border-t-clash-gold border-r-clash-elixir border-b-clash-gold border-l-clash-elixir rounded-full animate-spin" />
          <div className="absolute inset-2 border-4 border-t-clash-wood border-b-clash-wood border-l-transparent border-r-transparent rounded-full animate-spin-slow" />
        </div>

        <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4 px-8 shadow-sm">
          <p className="text-white font-bold tracking-widest uppercase">WAITING FOR NEXT ANNOUNCEMENT</p>
        </div>
      </div>
    </div>
  );
};

export default WaitingPage;
