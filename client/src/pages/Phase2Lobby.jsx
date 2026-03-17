import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useParticipant } from "../context/ParticipantContext";
import { useSocket } from "../hooks/useSocket";

const Phase2Lobby = () => {
  const { participant, updateParticipant } = useParticipant();
  const navigate = useNavigate();
  const { socket } = useSocket("/phase1");

  useEffect(() => {
    if (!participant) {
      navigate("/register", { replace: true });
      return;
    }

    if (!participant.phase1Qualified || participant.phase2Eliminated) {
      navigate("/eliminated", { replace: true });
      return;
    }
  }, [participant, navigate]);

  useEffect(() => {
    if (!socket || !participant?.usn) return;

    socket.emit("phase2:check_access", { usn: participant.usn }, (res) => {
      if (!res?.ok || !res?.qualified) {
        navigate("/eliminated", { replace: true });
      }
    });

    socket.emit("phase2:rejoin", { usn: participant.usn });

    const handleMatchStart = (payload) => {
      localStorage.setItem("phase2ActiveMatch", JSON.stringify(payload));
      navigate("/phase2/duel", { replace: true });
    };

    const handleMatchResume = (payload) => {
      localStorage.setItem("phase2ActiveMatch", JSON.stringify(payload));
      navigate("/phase2/duel", { replace: true });
    };

    const handleAdvancedFinals = () => {
      updateParticipant({ phase3Qualified: true, phase2Active: false });
    };

    socket.on("phase2:match_start", handleMatchStart);
    socket.on("phase2:match_resume", handleMatchResume);
    socket.on("phase2:advanced_finals", handleAdvancedFinals);

    return () => {
      socket.off("phase2:match_start", handleMatchStart);
      socket.off("phase2:match_resume", handleMatchResume);
      socket.off("phase2:advanced_finals", handleAdvancedFinals);
    };
  }, [socket, participant?.usn, navigate, updateParticipant]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="card-clash max-w-2xl w-full text-center space-y-6 animate-fade-in">
        <h2 className="text-4xl md:text-5xl font-clash text-clash-gold drop-shadow-md">
          Phase 2 Waiting Hall
        </h2>
        <p className="text-xl text-white">
          {participant?.phase3Qualified
            ? "You have advanced to the Grand Finals, please wait for further instructions."
            : "You are in Phase 2. Please wait while the next duel is prepared."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">Name</p>
            <p className="text-white font-bold">{participant?.name || "-"}</p>
          </div>
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">USN</p>
            <p className="text-white font-bold">{participant?.usn || "-"}</p>
          </div>
          <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4">
            <p className="text-gray-300 text-sm">Phase 1 Rank</p>
            <p className="text-white font-bold">
              {participant?.phase1Rank ? `#${participant.phase1Rank}` : "-"}
            </p>
          </div>
        </div>

        <div className="relative w-24 h-24 my-12">
          <div className="absolute inset-0 border-4 border-t-clash-gold border-r-clash-elixir border-b-clash-gold border-l-clash-elixir rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-t-clash-wood border-b-clash-wood border-l-transparent border-r-transparent rounded-full animate-spin-slow"></div>
        </div>

        <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4 px-8 shadow-sm">
          <p className="text-white font-bold tracking-widest uppercase">
            WAITING FOR PHASE 2 START
          </p>
        </div>
      </div>
    </div>
  );
};

export default Phase2Lobby;
