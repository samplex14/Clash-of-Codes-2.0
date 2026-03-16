const { Server } = require("socket.io");
const duelHandler = require("./duelHandler");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
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
