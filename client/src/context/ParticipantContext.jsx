import React, { createContext, useContext, useState, useEffect } from 'react';

const ParticipantContext = createContext();

export const useParticipant = () => useContext(ParticipantContext);

export const ParticipantProvider = ({ children }) => {
  const [participant, setParticipant] = useState(() => {
    const saved = localStorage.getItem('participant');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (participant) {
      localStorage.setItem('participant', JSON.stringify(participant));
    } else {
      localStorage.removeItem('participant');
    }
  }, [participant]);

  const login = (data) => setParticipant(data);
  const logout = () => setParticipant(null);

  // Partial update function
  const updateParticipant = (newData) => {
    setParticipant(prev => ({ ...prev, ...newData }));
  };

  return (
    <ParticipantContext.Provider value={{ participant, login, logout, updateParticipant }}>
      {children}
    </ParticipantContext.Provider>
  );
};
