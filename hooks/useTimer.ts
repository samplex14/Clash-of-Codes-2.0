"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimerResult {
  secondsLeft: number;
  isActive: boolean;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

export const useTimer = (initialSeconds: number, onComplete: () => void): UseTimerResult => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const completeRef = useRef(onComplete);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((previous: number) => {
        if (previous <= 1) {
          window.clearInterval(interval);
          setIsActive(false);
          completeRef.current();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isActive]);

  const startTimer = useCallback(() => {
    setSecondsLeft(initialSeconds);
    setIsActive(true);
  }, [initialSeconds]);

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setSecondsLeft(initialSeconds);
    setIsActive(false);
  }, [initialSeconds]);

  return {
    secondsLeft,
    isActive,
    startTimer,
    stopTimer,
    resetTimer
  };
};
