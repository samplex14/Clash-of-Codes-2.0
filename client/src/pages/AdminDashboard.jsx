import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../hooks/useSocket';
import Leaderboard from '../components/Leaderboard';

const AdminDashboard = () => {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Phase 1 specific state
  const [phase1Status, setPhase1Status] = useState('idle'); // idle, active, ended
  const [leaderboard, setLeaderboard] = useState([]);
  const { socket } = useSocket('/phase1');

  // Phase 1 control functions
  const fetchPhase1Status = async () => {
    try {
      const res = await api.get('/admin/phase1/status', { headers: { 'x-admin-token': token } });
      setPhase1Status(res.data.status);
    } catch(err) {
      console.error(err);
      if(err.response?.status === 401) setIsAuthenticated(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/phase1/leaderboard', { headers: { 'x-admin-token': token } });
      setLeaderboard(res.data);
    } catch(err) {
      console.error('Failed to get leaderboard', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhase1Status();
      fetchLeaderboard();
      // Poll leaderboard
      const interval = setInterval(fetchLeaderboard, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, token]);

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem('adminToken', token);
    setIsAuthenticated(true);
  };

  const startPhase1 = async () => {
    try {
      // Still call REST to maintain DB state history if needed, though Socket.IO handles the active session
      await api.post('/admin/phase1/start', {}, { headers: { 'x-admin-token': token } });
      
      // Critical: Tell Socket.IO to start pushing questions to everyone
      if (socket) {
        socket.emit('phase1:start', { adminToken: token }, (res) => {
          if (res && res.error) {
             console.error("Socket start error:", res.error);
             alert("Error pushing questions via socket: " + res.error);
          } else {
             console.log(`Socket started successfully: ${res.questionCount} questions to ${res.participantCount} users`);
          }
        });
      }
      
      setPhase1Status('active');
    } catch(err) {
      alert('Error starting phase 1: ' + (err.response?.data?.error || err.message));
    }
  };

  const endPhase1 = async () => {
    if(!window.confirm("Are you sure you want to end Phase 1? This will lock submissions and compute the top 64.")) return;
    try {
      await api.post('/admin/phase1/end', {}, { headers: { 'x-admin-token': token } });
      setPhase1Status('ended');
      fetchLeaderboard();
    } catch(err) {
      alert('Error ending phase 1: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-sm w-full">
          <h2 className="text-3xl font-clash text-center text-clash-gold mb-6 border-b-2 border-clash-wood pb-2">Town Hall Access</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              className="input-clash w-full text-center"
              placeholder="Admin Secret"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <button type="submit" className="btn-clash w-full py-3">Unlock</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between w-full mb-4 pr-2">
        <h2 className="text-4xl font-clash text-clash-gold drop-shadow-md">Admin Town Hall</h2>
        <button 
          onClick={() => { setIsAuthenticated(false); localStorage.removeItem('adminToken'); }}
          className="bg-clash-wood border-2 border-clash-dark text-white px-4 py-2 font-bold rounded hover:bg-clash-woodlight transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Phase 1 Panel */}
        <div className="card-clash border-t-8 border-t-clash-green">
          <h3 className="text-2xl font-clash text-white mb-2">Phase 1 Control</h3>
          <p className="text-gray-300 font-medium mb-6 border-b-2 border-[#4a2e1b] pb-4">
            Status: <span className="font-clash text-xl tracking-wider uppercase ml-2 text-clash-gold">{phase1Status}</span>
          </p>

          <div className="flex gap-4">
            {phase1Status !== 'active' ? (
              <button onClick={startPhase1} className="btn-clash flex-1 shrink-0">
                Start Phase 1
              </button>
            ) : (
              <button onClick={endPhase1} className="btn-clash-danger flex-1 shrink-0">
                End Phase 1
              </button>
            )}
            
            <button className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-4 rounded-lg shadow-sm hover:bg-clash-wood transition-colors">
              Refresh
            </button>
          </div>
        </div>

        {/* Phase 2 Matchmaking Panel Placeholder (To be implemented later) */}
        <div className="card-clash border-t-8 border-t-clash-elixir opacity-70 cursor-not-allowed">
          <h3 className="text-2xl font-clash text-white mb-2">Phase 2 Matrix</h3>
          <p className="text-gray-300 font-medium mb-6 border-b-2 border-[#4a2e1b] pb-4">
            Status: <span className="font-clash text-xl tracking-wider uppercase ml-2 text-clash-gold">LOCKED</span>
          </p>
          <div className="flex gap-4">
             <button disabled className="btn-clash flex-1 opacity-50 cursor-not-allowed">
                Trigger Matchmaking
            </button>
          </div>
        </div>
      </div>

      <div className="w-full">
         <Leaderboard players={leaderboard} />
      </div>
    </div>
  );
};

export default AdminDashboard;
