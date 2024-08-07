require("dotenv").config();
const express = require("express");
const multer = require("multer");
const tesseract = require("tesseract.js");
const path = require("path");
const { Configuration, OpenAI } = require("openai");

const app = express();

const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

async function describeImage(imagePath) {
  try {
    const {
      data: { text: extractedText },
    } = await tesseract.recognize(imagePath, "por");

    const prompt = `Analise o seguinte texto extraído de uma imagem: ${extractedText}. Baseado no conteúdo, forneça um título adequado para o objeto identificado, descrição do produto e sugira um preço de mercado para o mesmo.`;

    const response = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 150,
      temperature: 0.5,
    });

    const description = response.choices[0].text.trim();
    console.log("Description ===>:", description);
    return description;
  } catch (error) {
    console.error("Error describing image:", error);
    throw new Error("Failed to describe image.");
  }
}

app.post("/describe", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded." });
    }

    const imagePath = path.resolve(req.file.path);

    const description = await describeImage(imagePath);

    res.json({ description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
