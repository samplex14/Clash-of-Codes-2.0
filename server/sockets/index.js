const { Server } = require("socket.io");
const duelHandler = require("./duelHandler");

let io;

async function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
    // Keep clients alive on unstable venue WiFi while still detecting dead sockets.
    pingInterval: Number(process.env.SOCKET_PING_INTERVAL_MS || 30000),
    pingTimeout: Number(process.env.SOCKET_PING_TIMEOUT_MS || 45000),
    connectTimeout: Number(process.env.SOCKET_CONNECT_TIMEOUT_MS || 45000),
    transports: ["websocket", "polling"],
    allowUpgrades: true,
  });

  const duelNsp = io.of("/duel");
  duelNsp.on("connection", (socket) => {
    duelHandler(duelNsp, socket);
  });

  console.log("Socket.IO initialized");
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
