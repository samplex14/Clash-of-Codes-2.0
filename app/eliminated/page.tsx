"use client";

import React from "react";
import { useParticipant } from "@/components/providers/ParticipantProvider";

const EliminatedPage: React.FC = () => {
  const { participant } = useParticipant();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="card-clash max-w-2xl w-full text-center space-y-6">
        <h2 className="text-4xl font-clash text-clash-red drop-shadow-md">Eliminated After Phase 1</h2>
        <p className="text-xl text-white">Thank you for participating, you have been eliminated after Phase 1.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">Final Score</p>
            <p className="text-white font-bold text-2xl">{participant?.phase1Score ?? 0}</p>
          </div>
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">Final Rank</p>
            <p className="text-white font-bold text-2xl">
              {participant?.phase1Rank ? `#${participant.phase1Rank}` : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EliminatedPage;
