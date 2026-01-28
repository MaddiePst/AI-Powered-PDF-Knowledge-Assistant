import express from "express";
import { chatWithPDF } from "../Controllers/qaChainControllers.js";

const router = express.Router();

// Chat Routes
router.post("/", chatWithPDF);

export default router;
