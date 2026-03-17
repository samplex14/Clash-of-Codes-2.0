import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { useSocket } from '../hooks/useSocket';
import { useTimer } from '../hooks/useTimer';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';

const Phase2Duel = () => {
  const { participant } = useParticipant();
  const navigate = useNavigate();
  const matchId = localStorage.getItem('currentMatchId');
  const { socket, isConnected } = useSocket('/duel');

  const [status, setStatus] = useState('joining'); // joining, waiting, active, finished
  const [opponent, setOpponent] = useState(null);
  const [opponentAnswers, setOpponentAnswers] = useState(0);
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null); // { winner, p1score, p2score, reason }
  
  const [duelDuration, setDuelDuration] = useState(90);

  const { secondsLeft, startTimer, stopTimer, resetTimer } = useTimer(
    duelDuration,
    () => { } // Timer expiry handled by server auto-submit
  );

  useEffect(() => {
    if (!matchId) {
      navigate('/phase2/lobby');
      return;
    }

    if (isConnected && socket) {
      socket.emit('join_room', { matchId, usn: participant.usn });

      socket.on('room_joined', (data) => {
        setOpponent(data.opponent);
        setStatus('waiting');
      });

      socket.on('duel_start', (data) => {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(-1));
        setDuelDuration(data.durationSeconds);
        resetTimer(data.durationSeconds);
        setStatus('active');
        startTimer();
      });

      socket.on('opponent_progress', (data) => {
        setOpponentAnswers(data.answered);
      });

      socket.on('duel_end', (data) => {
        stopTimer();
        setResult(data);
        setStatus('finished');
        localStorage.removeItem('currentMatchId');
      });

      socket.on('error', (err) => {
        console.error('Socket error:', err);
        // If match not found or not in match, go back to lobby
        if (err.message.includes('not in this match') || err.message.includes('not found')) {
            localStorage.removeItem('currentMatchId');
            navigate('/phase2/lobby');
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('room_joined');
        socket.off('duel_start');
        socket.off('opponent_progress');
        socket.off('duel_end');
        socket.off('error');
      }
    };
  }, [isConnected, socket, matchId, participant.usn, navigate]);

  const handleReady = () => {
    socket.emit('ready', { matchId, usn: participant.usn });
  };

  const submitAnswer = (qIndex, optIndex) => {
    if (answers[qIndex] !== -1) return; // Already answered

    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);

    socket.emit('submit_answer', {
      matchId,
      usn: participant.usn,
      questionIndex: qIndex,
      answerIndex: optIndex,
      timestamp: Date.now()
    });
  };

  if (status === 'joining') {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
         <div className="text-2xl font-clash text-clash-gold animate-pulse">Entering Arena...</div>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-xl w-full text-center space-y-8">
          <h2 className="text-4xl font-clash text-clash-gold">Duel Arena</h2>
          
          <div className="flex justify-between items-center py-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-clash-green rounded-full flex items-center justify-center border-4 border-[#166534] shadow-md mb-2">
                 <span className="font-clash text-2xl text-white">YOU</span>
              </div>
              <span className="text-white font-bold">{participant.name}</span>
            </div>
            
            <div className="text-3xl font-clash text-clash-red px-6">VS</div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-clash-red rounded-full flex items-center justify-center border-4 border-[#881337] shadow-md mb-2">
                 <span className="font-clash text-2xl text-white">OPP</span>
              </div>
              <span className="text-white font-bold">{opponent?.name || 'Opponent'}</span>
            </div>
          </div>
          
          <button onClick={handleReady} className="btn-clash px-12 py-4 w-full text-2xl">
            I AM READY
          </button>
          
          <p className="text-gray-300 font-medium">Duel will start when both players are ready.</p>
        </div>
      </div>
    );
  }

  if (status === 'finished') {
    // Winner is participant if winner object matches participant ID (or if backend sent string/object)
    const isWinner = result.winner && (result.winner._id === participant._id || result.winner === participant._id);
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className={`card-clash max-w-lg w-full text-center border-t-8 ${isWinner ? 'border-t-clash-gold' : 'border-t-gray-500'}`}>
           <h2 className="text-5xl font-clash mb-2 text-white drop-shadow-md">
             {isWinner ? 'VICTORY' : 'DEFEAT'}
           </h2>
           
           {result.reason === 'disconnect_forfeit' && (
             <p className="text-clash-gold font-bold mb-4 uppercase tracking-wider text-sm">Opponent Fled the Battle</p>
           )}

           <div className="flex justify-center gap-12 my-8 border-y-2 border-clash-wood py-6">
             <div className="text-center">
               <p className="text-gray-300 font-bold uppercase mb-1">{participant.name}</p>
               <p className="text-4xl font-clash text-clash-green">{/* Need to know which score is ours */}</p>
                <p className="text-sm text-gray-400 mt-2">Your Score</p>
             </div>
             
             <div className="text-center">
               <p className="text-gray-300 font-bold uppercase mb-1">{opponent?.name}</p>
               <p className="text-4xl font-clash text-clash-red">{/* Need to know which score is opponent */}</p>
                <p className="text-sm text-gray-400 mt-2">Opponent Score</p>
             </div>
           </div>
           
           <button onClick={() => navigate('/phase2/lobby')} className="btn-clash mt-4">
             Return to Camp
           </button>
        </div>
      </div>
    );
  }

  // Active state
  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Sticky Dual Header */}
      <div className="sticky top-0 z-50 bg-clash-dark/95 border-b-4 border-clash-wood p-4 mb-8 grid grid-cols-3 items-center shadow-lg backdrop-blur-sm">
        
        {/* Your Progress */}
        <div className="flex flex-col text-left">
           <span className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Your Progress</span>
           <div className="flex items-center gap-2">
             <div className="w-full bg-[#3b2414] rounded-full h-3 border border-clash-wood">
                <div 
                  className="bg-clash-green h-full rounded-full transition-all duration-300" 
                  style={{ width: `${(answers.filter(a => a !== -1).length / questions.length) * 100}%` }}
                ></div>
             </div>
             <span className="font-clash text-white">{answers.filter(a => a !== -1).length}/{questions.length}</span>
           </div>
        </div>
        
        {/* Central Timer */}
        <div className="flex justify-center">
           <Timer secondsLeft={secondsLeft} maxSeconds={duelDuration} />
        </div>
        
        {/* Opponent Progress */}
        <div className="flex flex-col text-right">
           <span className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">{opponent?.name}</span>
           <div className="flex items-center gap-2 justify-end">
             <span className="font-clash text-white">{opponentAnswers}/{questions.length}</span>
             <div className="w-full bg-[#3b2414] rounded-full h-3 border border-clash-wood transform rotate-180">
                <div 
                  className="bg-clash-red h-full rounded-full transition-all duration-300" 
                  style={{ width: `${(opponentAnswers / questions.length) * 100}%` }}
                ></div>
             </div>
           </div>
        </div>

      </div>

      {/* Questions List */}
      <div className="space-y-8 px-2 md:px-0">
        {questions.map((q, i) => (
          <QuestionCard 
            key={q._id || i}
            question={q}
            index={i}
            selectedOption={answers[i]}
            onSelectOption={(optIndex) => submitAnswer(i, optIndex)}
            disabled={answers[i] !== -1} // Cannot change answer in duel
          />
        ))}
      </div>
    </div>
  );
};

export default Phase2Duel;
