type NodeEnv = "development" | "production" | "test";

const read = (key: string): string | undefined => process.env[key];

const requireEnv = (key: string, value: string | undefined): string => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const nodeEnvValue = read("NODE_ENV") ?? "development";
const nodeEnv = (["development", "production", "test"].includes(nodeEnvValue)
  ? nodeEnvValue
  : "development") as NodeEnv;

const portValue = read("PORT") ?? "3000";
const parsedPort = Number(portValue);

if (Number.isNaN(parsedPort)) {
  throw new Error("PORT must be a valid number");
}

const nextPublicSocketUrl = read("NEXT_PUBLIC_SOCKET_URL") ?? `http://localhost:${parsedPort}`;

const isServerRuntime = typeof window === "undefined";

export const env = {
  NODE_ENV: nodeEnv,
  NEXT_PUBLIC_SOCKET_URL: nextPublicSocketUrl,
  PORT: parsedPort,
  DATABASE_URL: isServerRuntime ? requireEnv("DATABASE_URL", read("DATABASE_URL")) : "",
  ADMIN_SECRET: isServerRuntime ? requireEnv("ADMIN_SECRET", read("ADMIN_SECRET")) : ""
};
