import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSocket = (namespace = '/') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to the specific namespace (e.g., '/' or '/duel')
    const socketInstance = io(`${SOCKET_URL}${namespace === '/' ? '' : namespace}`, {
      transports: ['websocket', 'polling'], // Fallback to polling if websocket fails
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log(`Connected to socket namespace: ${namespace}`);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log(`Disconnected from socket namespace: ${namespace}`);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [namespace]);

  return { socket, isConnected };
};
