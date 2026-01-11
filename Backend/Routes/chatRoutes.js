import express from "express";
import { chatWithPDF } from "../Controllers/qaChainControllers.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // Passes user input to LangChain. Entire AI pipeline executes here
    const answer = await chatWithPDF(req.body.question);
    // Sends AI-generated answer to frontend
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
