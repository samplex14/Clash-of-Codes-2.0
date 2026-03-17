module.exports = {
  apps: [
    {
      name: "clash-of-codes-server",
      script: "index.js",
      cwd: "./server",
      // No Redis adapter: keep a single process so Socket.IO room state stays consistent.
      instances: 1,
      exec_mode: "fork",
      watch: false,
      time: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
  ],
};
