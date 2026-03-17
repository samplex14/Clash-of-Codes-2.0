import { createServer } from "http";
import { config as loadEnv } from "dotenv";
import next from "next";

loadEnv({ path: ".env.local" });
loadEnv();

const read = (key: string): string | undefined => process.env[key];
const portValue = Number(read("PORT") ?? "3000");
if (Number.isNaN(portValue)) {
  throw new Error("PORT must be a valid number");
}

const socketUrl = read("NEXT_PUBLIC_SOCKET_URL") ?? `http://localhost:${portValue}`;

const dev = (read("NODE_ENV") ?? "development") !== "production";
const hostname = "0.0.0.0";
const port = portValue;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(async () => {
    const [{ createSocket }, { initSocketHandlers }] = await Promise.all([
      import("./lib/socket"),
      import("./lib/socketHandler")
    ]);

    const httpServer = createServer((req, res) => {
      handle(req, res);
    });

    const io = createSocket(httpServer, socketUrl);
    initSocketHandlers(io);

    httpServer.listen(port, () => {
      console.log(`> Custom server ready on http://localhost:${port}`);
    });
  })
  .catch((error: unknown) => {
    console.error("Failed to start custom server", error);
    process.exit(1);
  });
