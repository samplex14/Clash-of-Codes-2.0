"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface ParticipantState {
  usn: string;
  name: string;
  track: string;
  phase1Score?: number;
  phase1Rank?: number;
  phase1Qualified?: boolean;
}

interface ParticipantContextValue {
  participant: ParticipantState | null;
  login: (data: ParticipantState) => void;
  logout: () => void;
  updateParticipant: (data: Partial<ParticipantState>) => void;
}

const ParticipantContext = createContext<ParticipantContextValue | null>(null);

export const useParticipant = (): ParticipantContextValue => {
  const value = useContext(ParticipantContext);
  if (!value) {
    throw new Error("useParticipant must be used inside ParticipantProvider");
  }
  return value;
};

interface ParticipantProviderProps {
  children: React.ReactNode;
}

export const ParticipantProvider: React.FC<ParticipantProviderProps> = ({ children }) => {
  const [participant, setParticipant] = useState<ParticipantState | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("participant");
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as ParticipantState;
      setParticipant(parsed);
    } catch {
      window.localStorage.removeItem("participant");
    }
  }, []);

  useEffect(() => {
    if (!participant) {
      window.localStorage.removeItem("participant");
      return;
    }

    window.localStorage.setItem("participant", JSON.stringify(participant));
  }, [participant]);

  const value = useMemo<ParticipantContextValue>(
    () => ({
      participant,
      login: (data: ParticipantState) => setParticipant(data),
      logout: () => setParticipant(null),
      updateParticipant: (data: Partial<ParticipantState>) => {
        setParticipant((previous: ParticipantState | null) => {
          if (!previous) {
            return previous;
          }
          return { ...previous, ...data };
        });
      }
    }),
    [participant]
  );

  return <ParticipantContext.Provider value={value}>{children}</ParticipantContext.Provider>;
};
