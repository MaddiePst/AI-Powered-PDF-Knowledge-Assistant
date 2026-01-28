import express from "express";
import cors from "cors";
import uploadRoutes from "./Routes/uploadRoutes.js";
import chatRoutes from "./Routes/chatRoutes.js";
import dotenv from "dotenv";
import { loadIndexIfExists } from "./Controllers/indexServiceControllers.js";

dotenv.config();

const app = express();

/* ✅ CORS: allow local + Vercel */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL, // Vercel
    ],
  })
);

app.use(express.json());

app.use("/upload", uploadRoutes);
app.use("/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await loadIndexIfExists();
    console.log("✅ Index loaded (or empty)");

    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
