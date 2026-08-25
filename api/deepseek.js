import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.post("/deepseek", async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.DEEPSEEK_API_KEY;

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const result = await response.json();
    res.json({ reply: result.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "DeepSeek API call failed" });
  }
});

export default router;
