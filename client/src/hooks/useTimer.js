import { useState, useEffect, useRef } from 'react';

export const useTimer = (initialSeconds, onExpire = () => {}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);
  
  // Store the latest onExpire callback so the effect closure always uses the latest
  const callbackRef = useRef(onExpire);
  useEffect(() => {
    callbackRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      clearInterval(timerRef.current);
      setIsActive(false);
      if (callbackRef.current) {
         callbackRef.current();
      }
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, secondsLeft]);

  const startTimer = () => setIsActive(true);
  const stopTimer = () => setIsActive(false);
  const resetTimer = (newSeconds) => {
    setIsActive(false);
    setSecondsLeft(newSeconds !== undefined ? newSeconds : initialSeconds);
  };

  return { secondsLeft, isActive, startTimer, stopTimer, resetTimer };
};
