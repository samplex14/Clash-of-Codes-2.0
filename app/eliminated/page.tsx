"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { apiRequest } from "@/lib/api";

interface ParticipantApiRecord {
  usn: string;
  name: string;
  mappedTo: string | null;
  phase1Score: number;
  qualified: boolean;
}

interface ParticipantApiResponse {
  participant: ParticipantApiRecord;
}

const EliminatedPage: React.FC = () => {
  const { participant } = useParticipant();
  const [opponent, setOpponent] = useState<ParticipantApiRecord | null>(null);
  const [opponentDisplay, setOpponentDisplay] = useState<{ name: string; usn: string } | null>(null);
  const [loadingOpponent, setLoadingOpponent] = useState<boolean>(false);

  useEffect(() => {
    if (!participant?.usn) {
      return;
    }

    const run = async (): Promise<void> => {
      setLoadingOpponent(true);
      setOpponent(null);
      setOpponentDisplay(null);

      try {
        const self = await apiRequest<ParticipantApiResponse>(`/api/participants/${participant.usn}`);
        const mappedTo = self.participant.mappedTo;

        if (!mappedTo) {
          return;
        }

        if (mappedTo === "WAITING_FOR_OPPONENT") {
          setOpponentDisplay({ name: "Queue Pending", usn: mappedTo });
          return;
        }

        if (mappedTo.startsWith("BOT_")) {
          setOpponentDisplay({ name: mappedTo.replace("BOT_", "WARRIOR_BOT_"), usn: mappedTo });
          return;
        }

        const response = await apiRequest<ParticipantApiResponse>(`/api/participants/${mappedTo}`);
        setOpponent(response.participant);
        setOpponentDisplay({
          name: response.participant.name,
          usn: response.participant.usn
        });
      } catch {
        setOpponentDisplay({ name: "Unknown Rival", usn: "UNKNOWN" });
      } finally {
        setLoadingOpponent(false);
      }
    };

    void run();
  }, [participant?.usn]);

  const opponentBattleLine = useMemo<string>(() => {
    if (!opponent) {
      return "Your rival's final result is hidden in the war fog.";
    }

    if (opponent.qualified) {
      return "Your opponent advanced but you fought with honor.";
    }

    return "Your opponent also fell in battle today.";
  }, [opponent]);

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

        <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-5 text-left space-y-3">
          <h3 className="text-2xl font-clash text-clash-gold">Your Opponent&apos;s Result</h3>
          {loadingOpponent ? <p className="text-gray-300">Scouting enemy battle report...</p> : null}

          {!loadingOpponent ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-gray-300 text-sm">Opponent Name</p>
                  <p className="text-white font-bold">{opponentDisplay?.name ?? "Unknown Rival"}</p>
                </div>
                <div>
                  <p className="text-gray-300 text-sm">Opponent USN</p>
                  <p className="text-white font-bold">{opponentDisplay?.usn ?? "UNKNOWN"}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-300 text-sm">Opponent Score</p>
                <p className="text-white font-bold text-2xl">{opponent?.phase1Score ?? "-"}</p>
              </div>

              <p className="text-[#f4d07d]">{opponentBattleLine}</p>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EliminatedPage;
