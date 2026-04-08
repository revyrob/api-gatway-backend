import "dotenv/config";
import express   from "express";
import cors      from "cors";
import helmet    from "helmet";
import rateLimit from "express-rate-limit";
import { logger }       from "./middleware/logger.js";
import { authenticate } from "./middleware/auth.js";
import { requireRole }  from "./middleware/requireRole.js";
import { authProxy }    from "./routes/auth.js";
import { usersProxy }   from "./routes/users.js";
import { uploadProxy }  from "./routes/upload.js";
import { videosProxy }  from "./routes/videos.js";

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,                   // stricter: slow brute-force on auth endpoints
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/auth", authLimiter);
app.use(generalLimiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(logger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth",   authProxy);                                              // public
app.use("/users",  authenticate, usersProxy);                               // any logged-in user
app.use("/upload", authenticate, requireRole("admin", "festival", "athlete"), uploadProxy); // approved accounts only
app.use("/videos", authenticate, videosProxy);                              // any logged-in user

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  /auth   → ${process.env.AUTH_SERVICE_URL   || "http://localhost:4001"}`);
  console.log(`  /users  → ${process.env.USER_SERVICE_URL   || "http://localhost:4002"}`);
  console.log(`  /upload → ${process.env.UPLOAD_SERVICE_URL || "http://localhost:4003"}`);
  console.log(`  /videos → ${process.env.VIDEO_SERVICE_URL  || "http://localhost:4004"}`);
});
