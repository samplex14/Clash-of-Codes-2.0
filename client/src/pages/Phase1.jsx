import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParticipant } from '../context/ParticipantContext';
import { useSocket } from '../hooks/useSocket';
import { useTimer } from '../hooks/useTimer';
import QuestionCard from '../components/QuestionCard';
import Timer from '../components/Timer';

const Phase1 = () => {
  const { participant, updateParticipant } = useParticipant();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket('/phase1');

  // ── State ──
  const [status, setStatus] = useState('loading');   // loading | waiting | active | submitted | error
  const [questions, setQuestions] = useState([]);     // [{ questionId, text, options: [{id,text}] }]
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});         // { questionId: optionId }
  const [confirmedSet, setConfirmedSet] = useState(new Set()); // Set of confirmed questionIds
  const [score, setScore] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const joinedRef = useRef(false);

  // 15 minutes = 900 seconds
  const MAX_PHASE1_TIME = 900;

  const { secondsLeft, isActive: timerActive, startTimer, stopTimer } = useTimer(
    MAX_PHASE1_TIME, 
    () => {
      // Auto submit when timer expires — submit whatever is confirmed
      handleTimerExpiry();
    }
  );

  // ── Auto-submit on timer expiry ──
  const handleTimerExpiry = useCallback(() => {
    if (!socket || !questions.length) return;

    const lastQ = questions[questions.length - 1];
    const lastQId = lastQ.questionId;

    // If the last question has an answer selected, submit it
    if (answers[lastQId] !== undefined) {
      socket.emit('phase1:submit', {
        questionId: lastQId,
        selectedOptionId: answers[lastQId],
      });
    }
    // If not all are confirmed, the server will reject — but we tried
  }, [socket, questions, answers]);

  // ── Join the phase1 namespace when socket connects ──
  useEffect(() => {
    if (!socket || !isConnected || !participant?.usn || joinedRef.current) return;

    joinedRef.current = true;

    socket.emit('phase1:join', { usn: participant.usn }, (res) => {
      if (!res?.ok) {
        setError(res?.error || 'Failed to join Phase 1');
        setStatus('error');
        return;
      }

      // Already submitted (page refresh after submit)
      if (res.alreadySubmitted) {
        setScore(res.score);
        updateParticipant({ phase1Submitted: true, phase1Score: res.score });
        setStatus('submitted');
        return;
      }

      // Reconnect — restore state
      if (res.reconnected && res.questions) {
        setQuestions(res.questions);

        // Restore confirmed answers
        const restored = new Set();
        const restoredAnswers = {};
        if (res.confirmedAnswers) {
          for (const [qId, optId] of Object.entries(res.confirmedAnswers)) {
            restored.add(qId);
            restoredAnswers[qId] = optId;
          }
        }
        setConfirmedSet(restored);
        setAnswers(restoredAnswers);

        if (res.submitted) {
          setScore(res.score);
          setStatus('submitted');
        } else {
          setStatus('active');
          startTimer();
        }
        return;
      }

      // Fresh join — wait for admin to start
      setStatus('waiting');
    });
  }, [socket, isConnected, participant?.usn]);

  // ── Listen for phase1:questions (admin started Phase 1) ──
  useEffect(() => {
    if (!socket) return;

    const handleQuestions = (qs) => {
      setQuestions(qs);
      setCurrentIndex(0);
      setAnswers({});
      setConfirmedSet(new Set());
      setScore(null);
      setSubmitError(null);
      setStatus('active');
      startTimer();
    };

    socket.on('phase1:questions', handleQuestions);
    return () => socket.off('phase1:questions', handleQuestions);
  }, [socket, startTimer]);

  // ── Listen for answer confirmed ──
  useEffect(() => {
    if (!socket) return;

    const handleConfirmed = ({ questionId }) => {
      setConfirmedSet((prev) => new Set(prev).add(questionId));
    };

    socket.on('phase1:answer_confirmed', handleConfirmed);
    return () => socket.off('phase1:answer_confirmed', handleConfirmed);
  }, [socket]);

  // ── Listen for result ──
  useEffect(() => {
    if (!socket) return;

    const handleResult = ({ score: s, total: t }) => {
      stopTimer();
      setScore(s);
      setTotal(t);
      updateParticipant({ phase1Submitted: true, phase1Score: s });
      setStatus('submitted');
    };

    socket.on('phase1:result', handleResult);
    return () => socket.off('phase1:result', handleResult);
  }, [socket, stopTimer, updateParticipant]);

  // ── Listen for submit error ──
  useEffect(() => {
    if (!socket) return;

    const handleSubmitError = ({ message, missingQuestions }) => {
      setSubmitError(`${message}. ${missingQuestions?.length || 0} question(s) still need to be confirmed.`);
    };

    socket.on('phase1:submit_error', handleSubmitError);
    return () => socket.off('phase1:submit_error', handleSubmitError);
  }, [socket]);

  // ── Handlers ──
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;
  const currentQId = currentQuestion?.questionId;
  const isCurrentConfirmed = currentQId ? confirmedSet.has(currentQId) : false;
  const currentAnswer = currentQId !== undefined ? answers[currentQId] : undefined;
  const hasSelectedOption = currentAnswer !== undefined;

  // All questions except the last must be confirmed for submit to be enabled
  const allPriorConfirmed = questions.length > 0 &&
    questions.slice(0, -1).every((q) => confirmedSet.has(q.questionId));

  const handleSelectOption = (optionId) => {
    if (isCurrentConfirmed) return; // locked
    setAnswers((prev) => ({ ...prev, [currentQId]: optionId }));
    setSubmitError(null);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSubmitError(null);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSubmitError(null);
    }
  };

  const handleConfirmAnswer = () => {
    if (!socket || !currentQId || !hasSelectedOption || isCurrentConfirmed) return;

    socket.emit('phase1:confirm_answer', {
      questionId: currentQId,
      selectedOptionId: currentAnswer,
    }, (res) => {
      if (res && !res.ok) {
        setSubmitError(res.error || 'Failed to confirm answer');
      }
    });
  };

  const handleSubmit = () => {
    if (!socket || !currentQId || !hasSelectedOption) return;

    if (!allPriorConfirmed) {
      setSubmitError('You must confirm all previous questions before submitting.');
      return;
    }

    socket.emit('phase1:submit', {
      questionId: currentQId,
      selectedOptionId: currentAnswer,
    }, (res) => {
      if (res && !res.ok) {
        setSubmitError(res.error || 'Failed to submit');
      }
    });
  };

  // ── Question navigation dots ──
  const QuestionNav = () => (
    <div className="flex flex-wrap gap-2 justify-center my-6">
      {questions.map((q, i) => {
        const qId = q.questionId;
        const isConfirmed = confirmedSet.has(qId);
        const hasAnswer = answers[qId] !== undefined;
        const isCurrent = i === currentIndex;

        return (
          <button
            key={qId}
            onClick={() => { setCurrentIndex(i); setSubmitError(null); }}
            className={`
              w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 border-2
              ${isCurrent
                ? 'bg-clash-gold text-clash-dark border-yellow-600 scale-110 shadow-lg'
                : isConfirmed
                  ? 'bg-clash-green/80 text-white border-green-700'
                  : hasAnswer
                    ? 'bg-clash-elixir/60 text-white border-purple-700'
                    : 'bg-clash-wood/50 text-gray-300 border-clash-wood hover:bg-clash-wood/80'}
            `}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );

  // ── Render states ──

  if (status === 'loading' || (status === 'loading' && !isConnected)) {
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
        <p className="text-xl text-white max-w-md">{error || 'Failed to connect to the Village Server.'}</p>
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
        <p className="text-gray-400">Questions will appear here once the Chief starts the battle.</p>
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
            Score: <span className="text-3xl font-bold font-clash ml-2 text-clash-elixir">{score}</span>
            {total !== null && <span className="text-gray-400 text-lg ml-1">/ {total}</span>}
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

  // ── Active state — one question at a time ──
  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-clash-dark/95 border-b-4 border-clash-wood p-4 mb-4 flex justify-between items-center shadow-lg backdrop-blur-sm">
        <h2 className="text-2xl md:text-3xl font-clash tracking-wide text-clash-gold hidden md:block">
          Phase 1: Rapid Fire
        </h2>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <span className="text-white font-bold opacity-80 uppercase tracking-widest text-sm">
            {confirmedSet.size} / {questions.length} Locked
          </span>
          <Timer secondsLeft={secondsLeft} maxSeconds={MAX_PHASE1_TIME} />
        </div>
      </div>

      {/* Question Navigation Dots */}
      <QuestionNav />

      {/* Current Question */}
      {currentQuestion && (
        <div className="px-2 md:px-0">
          <QuestionCard
            question={currentQuestion}
            index={currentIndex}
            selectedOption={currentAnswer}
            onSelectOption={handleSelectOption}
            disabled={isCurrentConfirmed}
            isLocked={isCurrentConfirmed}
          />

          {/* Error message */}
          {submitError && (
            <div className="mt-4 bg-clash-red/20 border-2 border-clash-red text-white p-3 rounded text-center shadow-inner">
              {submitError}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-4 mt-6 justify-center">
            {/* Previous button */}
            {!isFirstQuestion && (
              <button
                onClick={handlePrev}
                className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-6 py-3 rounded-lg shadow-sm hover:bg-clash-wood transition-colors"
              >
                ← Previous
              </button>
            )}

            {/* Confirm / Submit / Next */}
            {isLastQuestion ? (
              // Last question — Show Submit button
              <button
                onClick={handleSubmit}
                disabled={!hasSelectedOption || !allPriorConfirmed}
                className={`btn-clash px-8 py-3 text-lg ${
                  (!hasSelectedOption || !allPriorConfirmed)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-clash-green'
                }`}
              >
                ⚔️ SUBMIT ATTACK
              </button>
            ) : (
              <>
                {/* Confirm button (not on last question) */}
                {!isCurrentConfirmed && (
                  <button
                    onClick={handleConfirmAnswer}
                    disabled={!hasSelectedOption}
                    className={`btn-clash px-6 py-3 ${
                      !hasSelectedOption ? 'opacity-50 cursor-not-allowed' : 'bg-clash-elixir'
                    }`}
                  >
                    🔒 Confirm Answer
                  </button>
                )}

                {/* Next button */}
                <button
                  onClick={handleNext}
                  className="bg-clash-woodlight text-white font-bold border-2 border-clash-wood px-6 py-3 rounded-lg shadow-sm hover:bg-clash-wood transition-colors"
                >
                  Next →
                </button>
              </>
            )}
          </div>

          {/* Submit hint */}
          {isLastQuestion && !allPriorConfirmed && (
            <p className="text-center text-gray-400 mt-3 text-sm">
              Confirm all previous questions before submitting.
              <span className="text-clash-gold ml-1">{questions.length - 1 - confirmedSet.size} remaining</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Phase1;
