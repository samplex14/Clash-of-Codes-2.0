import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import api from '../utils/api';

const Phase2Lobby = () => {
  const { participant } = useParticipant();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If user is eliminated or not active, they shouldn't even be here, but let's check
    if (!participant?.phase2Active && !participant?.phase1Qualified) {
      setError("You are not qualified for Phase 2.");
      setLoading(false);
      return;
    }

    if (participant?.phase2Eliminated) {
       setError("You have been eliminated from the tournament.");
       setLoading(false);
       return;
    }

    const checkCurrentMatch = async () => {
      try {
        // Here we could have a specific endpoint to find the current active match for a user
        // But let's assume we can fetch all matches and filter, or we have a dedicated endpoint
        // Wait, the backend currently accepts GET /api/matches/:matchId.
        // And for a user to know their match, we really need a new endpoint `GET /api/matches/current`.
        // The instructions from previous conversation summarize "Implement Match Recovery Endpoint" -> `GET /api/matches/current`.
        // So we will call it here.
        const res = await api.get('/matches/current', { params: { usn: participant.usn } });
        
        if (res.data && res.data.match) {
          // Found an active match, store match details and redirect
          localStorage.setItem('currentMatchId', res.data.match._id);
          navigate('/phase2/duel');
        } else {
          // No match assigned yet, wait
          setLoading(false);
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error('Failed to check match status', err);
        }
        setLoading(false);
      }
    };

    checkCurrentMatch();

    // Poll every 5 seconds for a new match
    const interval = setInterval(checkCurrentMatch, 5000);
    return () => clearInterval(interval);

  }, [participant, navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-lg w-full text-center">
          <h2 className="text-3xl font-clash text-clash-red mb-6 border-b-2 border-clash-wood pb-4">Tournament Over</h2>
          <p className="text-xl text-white font-medium">{error}</p>
          <p className="mt-4 text-gray-400">Better luck next time, Chief!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-8 animate-fade-in flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-clash text-clash-gold drop-shadow-md">War Camp</h2>
        <p className="text-xl text-white">Wait here while the elders find you a worthy opponent.</p>

        <div className="relative w-24 h-24 my-12">
           {/* Simple spinning sword/shield animation placeholder */}
           <div className="absolute inset-0 border-4 border-t-clash-gold border-r-clash-elixir border-b-clash-gold border-l-clash-elixir rounded-full animate-spin"></div>
           <div className="absolute inset-2 border-4 border-t-clash-wood border-b-clash-wood border-l-transparent border-r-transparent rounded-full animate-spin-slow"></div>
        </div>

        <div className="bg-clash-woodlight border-2 border-clash-wood rounded-lg p-4 px-8 shadow-sm">
          <p className="text-white font-bold tracking-widest uppercase">MATCHMAKING IN PROGRESS...</p>
        </div>
      </div>
    </div>
  );
};

export default Phase2Lobby;
