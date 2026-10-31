import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { requestId } from "./middleware/requestId.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";
import apiRouter from "./routes/index.js";

export const app = express();

app.disable("x-powered-by"); // don't advertise "Express" to scanners (helmet also strips it; belt and braces)
app.disable("etag"); 

// Behind Render/Railway/Fly the TCP peer is the platform's proxy. Trust ONE hop so `req.ip` is the real
// client; otherwise every user shares one rate-limit bucket. Never enable this blindly in dev.
if (env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(requestId);
app.use(pinoHttp({ logger, genReqId: (req) => req.id }));
app.use(
  helmet({
    // This API only returns JSON, never HTML, so the strictest possible policy is correct:
    // nothing may be loaded, framed, or posted-to because of one of our responses.
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
      },
    },
  })
);
app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(generalLimiter);

// ← ADDED THIS WHOLE BLOCK, directly above the apiRouter line
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");    // private data must never be stored by a CDN
  next();
});

app.use("/api/v1", apiRouter);

app.use(notFound);
app.use(errorHandler); // MUST be last
