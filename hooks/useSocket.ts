"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents
} from "@/types/socket";
import { env } from "@/lib/env";

interface UseSocketResult {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
}

export const useSocket = (namespace: string = "/"): UseSocketResult => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    const socketNamespace = namespace === "/" ? "" : namespace;

    const socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      `${env.NEXT_PUBLIC_SOCKET_URL}${socketNamespace}`,
      {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      }
    );

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [namespace]);

  return { socket, isConnected };
};
