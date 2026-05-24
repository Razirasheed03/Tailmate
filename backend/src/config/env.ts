import dotenv from "dotenv";
dotenv.config();

const requireEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing the environment variable ${key}`);
  }
  return value;
};

const parseAllowedOrigins = (): string[] => {
  const fromEnv = process.env.ALLOWED_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (fromEnv?.length) {
    return fromEnv;
  }

  const defaults = ["http://localhost:3000"];
  const frontend = process.env.FRONTEND_URL?.replace(/\/$/, "");
  if (frontend && !defaults.includes(frontend)) {
    defaults.push(frontend);
  }
  if (!defaults.includes("https://tailmate-care.vercel.app")) {
    defaults.push("https://tailmate-care.vercel.app");
  }
  return defaults;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: requireEnvVar("PORT"),
  MONGO_URI: requireEnvVar("MONGO_URI"),
  REDIS_URL: requireEnvVar("REDIS_URL"),
  JWT_SECRET: requireEnvVar("JWT_SECRET"),
  REFRESH_SECRET: requireEnvVar("REFRESH_SECRET"),
  STRIPE_SECRET_KEY: requireEnvVar("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireEnvVar("STRIPE_WEBHOOK_SECRET"),
  FRONTEND_URL: process.env.FRONTEND_URL,
  ALLOWED_ORIGINS: parseAllowedOrigins(),
  isProduction: (process.env.NODE_ENV || "development") === "production",
};
