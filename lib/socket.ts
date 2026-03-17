import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "../types/socket";

let ioInstance:
  | Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  | null = null;

export const createSocket = (
  server: HttpServer,
  corsOrigin: string
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    server,
    {
      cors: {
        origin: corsOrigin,
        methods: ["GET", "POST"]
      }
    }
  );

  return ioInstance;
};

export const getSocket = (): Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null => ioInstance;
