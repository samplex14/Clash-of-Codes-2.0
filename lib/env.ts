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

const nextPublicAppUrl = read("NEXT_PUBLIC_APP_URL") ?? "";

const isServerRuntime = typeof window === "undefined";

export const env = {
  NODE_ENV: nodeEnv,
  NEXT_PUBLIC_APP_URL: nextPublicAppUrl,
  DATABASE_URL: isServerRuntime ? requireEnv("DATABASE_URL", read("DATABASE_URL")) : "",
  DIRECT_URL: isServerRuntime ? read("DIRECT_URL") ?? "" : ""
};
