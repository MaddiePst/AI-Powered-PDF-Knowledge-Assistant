import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import uploadRoutes from "./Routes/uploadRoutes.js";
import chatRoutes from "./Routes/chatRoutes.js";

dotenv.config();

const app = express();

/* ✅ CORS: allow local + Vercel */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL, // https://ai-powered-pdf-knowledge-assistant.vercel.app
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

/* ✅ Body parsing (important for uploads & JSON) */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ✅ Routes */
app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);

/* ✅ REQUIRED for Render */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
