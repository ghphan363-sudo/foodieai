const dotenv = require("dotenv");
dotenv.config();

const { GoogleGenAI } = require("@google/genai");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"],
  })
);

const upload = multer();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post(
  "/analyze-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No image uploaded",
        });
      }

      const languageRaw =
        typeof req.body?.language === "string"
          ? req.body.language.toLowerCase()
          : "en";
      const language =
        languageRaw === "vi" || languageRaw === "en"
          ? languageRaw
          : "en";
      const languageLabel =
        language === "vi"
          ? "Vietnamese (use proper accents)"
          : "English";

      const imageBase64 =
        req.file.buffer.toString("base64");

      const response =
        await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              inlineData: {
                mimeType: req.file.mimetype,
                data: imageBase64,
              },
            },
            `
Analyze this food image.

Return ONLY valid JSON, and ensure the "food_name" is in ${languageLabel}.

{
  "food_name": "",
  "carbs_g": 0,
  "protein_g": 0,
  "fat_g": 0,
  "health_rating": 0,
  "estimated_calories": 0
}
`,
          ],
        });

      const text = response.text.trim();

      // Gemini sometimes wraps JSON in markdown fences; remove them before parsing.
      const cleanedText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();

      const result = JSON.parse(cleanedText);

      res.json(result);

    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: "Failed to analyze image",
      });
    }
  }
);

app.get("/", (req, res) => {
  res.send("NodeJS Backend Endpoint");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});