module.exports = {
  apps: [
    {
      name: "clash-of-codes-server",
      script: "index.js",
      cwd: "./server",
      instances: "max",
      exec_mode: "cluster",
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
