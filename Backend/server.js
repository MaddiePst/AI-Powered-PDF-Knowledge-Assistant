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

app.listen(5000, () => {
  console.log("Backend running on http://localhost:5000");
});
