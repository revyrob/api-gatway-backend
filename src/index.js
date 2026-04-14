import "dotenv/config";
import express   from "express";
import cors      from "cors";
import helmet    from "helmet";
import rateLimit from "express-rate-limit";
import { Resend } from "resend";
import { logger }       from "./middleware/logger.js";
import { authenticate } from "./middleware/auth.js";
import { requireRole }  from "./middleware/requireRole.js";
import { authProxy }          from "./routes/auth.js";
import { usersProxy }         from "./routes/users.js";
import { uploadProxy }        from "./routes/upload.js";
import { videosProxy }        from "./routes/videos.js";
import { athletesProxy }      from "./routes/athletes.js";
import { festivalsProxy }     from "./routes/festivals.js";
import { notificationsProxy } from "./routes/notifications.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const app  = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin:         process.env.FRONTEND_URL || "http://localhost:5173",
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));

// Explicitly handle every OPTIONS preflight BEFORE proxy middleware sees it.
// http-proxy-middleware intercepts OPTIONS and never calls next(), so cors()
// alone is not enough — we need this dedicated handler first.
app.options("/{*path}", cors(corsOptions));

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
app.use("/auth",    authProxy);                                              // public

// ── Contact form — handled directly, no proxy ────────────────────────────────
app.use(express.json());
app.post("/contact", async (req, res) => {
  const { name, email, reason, message } = req.body ?? {};
  if (!name || !email || !reason || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }
  try {
    await resend.emails.send({
      from:    process.env.RESEND_FROM    || "onboarding@resend.dev",
      to:      process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `[${reason}] from ${name}`,
      html: `<p><strong>Reason:</strong> ${reason}</p>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <hr/>
             <p style="white-space:pre-wrap">${message}</p>`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err.message);
    res.status(500).json({ error: "Failed to send message." });
  }
});

app.use("/users",         authenticate, usersProxy);                              // any logged-in user
app.use("/upload",        authenticate, requireRole("admin", "festival", "athlete"), uploadProxy);
app.use("/videos",        authenticate, videosProxy);                             // any logged-in user
app.use("/athletes",      authenticate, athletesProxy);                           // any logged-in user
app.use("/festivals",     authenticate, festivalsProxy);                          // any logged-in user
app.use("/notifications", authenticate, notificationsProxy);                     // any logged-in user

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
