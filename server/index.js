require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets");

const participantRoutes = require("./routes/participantRoutes");
const questionRoutes = require("./routes/questionRoutes");
const phase1Routes = require("./routes/phase1Routes");
const phase2Routes = require("./routes/phase2Routes");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", participantRoutes);
app.use("/api", questionRoutes);
app.use("/api", phase1Routes);
app.use("/api", phase2Routes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  initSocket(server)
    .then(() => {
      server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to initialize Socket.IO:", err.message);
      process.exit(1);
    });
});
