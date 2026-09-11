import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

import uploadRoutes from "./Routes/uploadRoutes.js";
import chatRoutes from "./Routes/chatRoutes.js";
import { loadIndexIfExists } from "./Controllers/indexServiceControllers.js";
import { log } from "./logger.js";

dotenv.config();

// Catch anything that would otherwise crash the process silently, or leave
// a request hanging with no error ever surfacing anywhere. Written to
// Backend/app.log so it's never lost to a terminal window nobody happened
// to be watching.
process.on("uncaughtException", (err) => {
  log("🔥 uncaughtException:", err?.stack || String(err));
});
process.on("unhandledRejection", (reason) => {
  log("🔥 unhandledRejection:", reason?.stack || String(reason));
});

const app = express();

/* Disable Express's default ETag generation. Every response here is a
   dynamic status/JSON payload meant to be polled for changes — an ETag
   plus the browser's default HTTP caching can make a GET come back as a
   304 with a stale cached body instead of the current state, which looks
   exactly like "nothing is happening" even when it is. */
app.disable("etag");

/* Log every request that actually reaches this process, before any route
   handling runs. This is ground truth for "did the request even get
   here" — independent of what a browser's Network tab or a terminal
   window shows, both of which turned out to be easy to misread mid-debug. */
app.use((req, res, next) => {
  log(`→ ${req.method} ${req.originalUrl}`);
  next();
});

/* ✅ CORS — global, handles preflight automatically */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://ai-powered-pdf-knowledge-assistant.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ✅ Body parsing */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ Routes */
app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);

/* ✅ Always return JSON errors (Multer errors, bad uploads, etc.)
   instead of Express's default HTML error page — the frontend expects
   to be able to res.json() the response either way. */
app.use((err, req, res, next) => {
  log("❌ Unhandled error:", err?.stack || String(err));

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: err.message || "Something went wrong",
  });
});

/* ✅ Port for Render */
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  log(`🚀 Backend running on port ${PORT} (pid ${process.pid})`);
  // Restore a previously indexed PDF (if any) so chat keeps working
  // across server restarts instead of requiring a fresh upload.
  await loadIndexIfExists();
});
