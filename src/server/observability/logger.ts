import pino from "pino";

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
      "password",
      "access_token",
      "refresh_token",
      "token",
      "apiKey",
      "authorization",
      "cookies",
      "cvv",
    ],
    censor: "[REDACTED]",
  },
});
