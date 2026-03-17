import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { useTimer } from '../hooks/useTimer';
import api from '../utils/api';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';

const Phase1 = () => {
  const { participant, updateParticipant } = useParticipant();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // loading, waiting, active, submitted
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]); // Array of selected option indices
  const [timeTaken, setTimeTaken] = useState(0); // in seconds
  
  const [error, setError] = useState(null);
  
  // 15 minutes = 900 seconds
  const MAX_PHASE1_TIME = 900;
  
  const { secondsLeft, isActive, startTimer, stopTimer, resetTimer } = useTimer(
    MAX_PHASE1_TIME, 
    () => {
      // Auto submit when time expires
      submitAnswers(answers, MAX_PHASE1_TIME);
    }
  );

  // Check status and fetch questions if active
  useEffect(() => {
    if (participant?.phase1Submitted) {
      setStatus('submitted');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await api.get('/admin/phase1/status');
        if (res.data.status === 'active') {
          // Fetch questions
          const qRes = await api.get('/phase1/questions');
          setQuestions(qRes.data);
          setAnswers(new Array(qRes.data.length).fill(-1));
          setStatus('active');
          startTimer();
        } else {
          setStatus('waiting');
        }
      } catch (err) {
        console.error('Failed to check phase 1 status', err);
        setError('Failed to connect to the Village Server. Make sure the backend is running.');
        setStatus('error');
      }
    };

    checkStatus();

    // Poll if waiting or error
    let interval;
    if (status === 'waiting' || status === 'loading' || status === 'error') {
      interval = setInterval(checkStatus, 3000);
    }

    return () => clearInterval(interval);
  }, [participant, status]);

  const handleSelectOption = (qIndex, optIndex) => {
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const submitAnswers = async (currentAnswers, timeSpent) => {
    stopTimer();
    try {
      // Replace -1 with null for unanswered
      const formattedAnswers = currentAnswers.map(a => a === -1 ? null : a);
      
      const res = await api.post('/phase1/submit', {
        usn: participant.usn,
        answers: formattedAnswers,
        timeTaken: timeSpent
      });

      // Update context
      updateParticipant({ phase1Submitted: true, phase1Score: res.data.score });
      setStatus('submitted');
    } catch (err) {
      alert('Failed to submit: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleManualSubmit = () => {
    if (window.confirm('Are you sure you want to finish the attack? You cannot change your troops later.')) {
      submitAnswers(answers, MAX_PHASE1_TIME - secondsLeft);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] space-y-4">
        <div className="text-3xl font-clash text-clash-gold animate-pulse">Scouting Base...</div>
        <p className="text-gray-400">Connecting to server...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] space-y-6 text-center">
        <h2 className="text-4xl font-clash text-clash-red drop-shadow-md">Connection Lost</h2>
        <p className="text-xl text-white max-w-md">{error}</p>
        <div className="w-12 h-12 border-4 border-t-clash-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mt-4"></div>
        <p className="text-gray-400">Retrying connection...</p>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <h2 className="text-4xl font-clash text-clash-gold">Village Camp</h2>
        <p className="text-xl text-white">The Clan War has not started yet.</p>
        <div className="w-16 h-16 border-4 border-t-clash-gold border-r-clash-gold border-b-transparent border-l-transparent rounded-full animate-spin mt-8"></div>
      </div>
    );
  }

  if (status === 'submitted') {
    const isQualifying = participant?.phase1Qualified;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="card-clash max-w-lg w-full text-center space-y-6">
          <h2 className="text-4xl font-clash text-clash-gold">Attack Finished</h2>
          <p className="text-xl text-white">
            Score: <span className="text-3xl font-bold font-clash ml-2 text-clash-elixir">{participant?.phase1Score}</span>
          </p>
          <div className="pt-6 border-t border-clash-wood">
             {isQualifying ? (
               <div className="space-y-4">
                 <h3 className="text-2xl text-clash-green font-clash">You Qualified!</h3>
                 <button onClick={() => navigate('/phase2/lobby')} className="btn-clash">
                   Enter War Camp
                 </button>
               </div>
             ) : (
               <p className="text-gray-300">Wait for the Clan Chief (Admin) to end Phase 1 to see if you qualify for the duels.</p>
             )}
          </div>
        </div>
      </div>
    );
  }

  // Active state
  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-clash-dark/95 border-b-4 border-clash-wood p-4 mb-8 flex justify-between items-center shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-clash tracking-wide text-clash-gold hidden md:block">
          Phase 1: Rapid Fire
        </h2>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <span className="text-white font-bold opacity-80 uppercase tracking-widest text-sm">
            {answers.filter(a => a !== -1).length} / {questions.length} Built
          </span>
          <Timer secondsLeft={secondsLeft} maxSeconds={MAX_PHASE1_TIME} />
          <button onClick={handleManualSubmit} className="btn-clash shadow-sm bg-clash-green text-sm px-4 md:px-6">
            FINISH
          </button>
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
            onSelectOption={(optIndex) => handleSelectOption(i, optIndex)}
          />
        ))}
      </div>
    </div>
  );
};

export default Phase1;
