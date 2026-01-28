import { getIndex } from "./indexServiceControllers.js";

export async function chatWithPDF(req, res) {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const index = getIndex();

    if (!index) {
      return res.status(400).json({
        error: "No PDF indexed yet. Upload a PDF first.",
      });
    }

    const queryEngine = index.asQueryEngine({
      similarityTopK: 3,
    });

    const response = await queryEngine.query({
      query: question,
    });

    res.json({
      answer: response.response,
    });
  } catch (err) {
    console.error("❌ Chat error:", err);
    res.status(500).json({ error: err.message });
  }
}
