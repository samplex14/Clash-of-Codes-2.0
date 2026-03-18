"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import LoadingRadar from "@/components/ui/loading-radar";
import { useParticipant } from "@/components/providers/ParticipantProvider";
import { useSocket } from "@/hooks/useSocket";

const finaleLines = [
  "Buckle up, Warrior. The real matrix awaits you.",
  "Only the elite 8 stand here. The Grand Finale is about to begin.",
  "Your coding blade has been sharpened.",
  "Now prepare to conquer the ultimate arena."
] as const;

const QualifiedPage: React.FC = () => {
  const router = useRouter();
  const { participant } = useParticipant();
  const { socket } = useSocket("/phase1");
  const [visibleLines, setVisibleLines] = useState<string[]>([]);

  useEffect(() => {
    if (!participant?.usn) {
      router.replace("/");
      return;
    }

    if (!participant.phase1Qualified) {
      router.replace("/eliminated");
    }
  }, [participant, router]);

  useEffect(() => {
    setVisibleLines([]);
    const timer = window.setInterval(() => {
      setVisibleLines((previous) => {
        if (previous.length >= finaleLines.length) {
          window.clearInterval(timer);
          return previous;
        }

        return [...previous, finaleLines[previous.length]];
      });
    }, 800);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handlePhase3Start = (): void => {
      router.replace("/phase3");
    };

    socket.on("phase3:start", handlePhase3Start);

    return () => {
      socket.off("phase3:start", handlePhase3Start);
    };
  }, [router, socket]);

  const score = useMemo<number>(() => participant?.phase1Score ?? 0, [participant?.phase1Score]);

  if (!participant) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 arena-bg-texture">
      <div className="w-full max-w-4xl rounded-2xl border-4 border-[#e0be6f] bg-[#5a351f]/95 shadow-[0_16px_0_0_#2d1b0f] p-8 md:p-12 text-center qualified-gold-glow">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#3c2616] border-2 border-[#f0d487] flex items-center justify-center">
            <Crown className="w-10 h-10 text-[#f7d26e]" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl text-[#f3cf78] mb-4 font-serif">You Have Survived the First Battle!</h1>
        <p className="text-2xl text-[#f3eee3] mb-2">{participant.name}</p>
        <p className="text-xl text-[#f4d17d] mb-6">Battle Score: {score}</p>

        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="w-2 h-2 rotate-45 bg-[#d9b86f]" />
          <span className="w-3 h-3 rotate-45 bg-[#f1d28a]" />
          <span className="w-2 h-2 rotate-45 bg-[#d9b86f]" />
        </div>

        <div className="space-y-3 min-h-40 mb-8">
          {visibleLines.map((line) => (
            <p key={line} className="text-lg text-[#f0cf83] qualified-line-fade">
              {line}
            </p>
          ))}
        </div>

        <div className="inline-flex items-center justify-center px-6 py-2 rounded-full border-2 border-[#f0cb74] bg-[#1f7f47] text-white font-bold tracking-widest uppercase animate-pulse">
          Grand Finalist
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <LoadingRadar />
          <p className="text-[#cfb78a] animate-pulse">Awaiting the Grand Finale to begin...</p>
        </div>
      </div>
    </div>
  );
};

export default QualifiedPage;
