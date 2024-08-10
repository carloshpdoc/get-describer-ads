require("dotenv").config();
const fs = require('fs');
const express = require("express");
const multer = require("multer");
const tesseract = require("tesseract.js");
const path = require("path");
const { OpenAI } = require("openai");
const speech = require('@google-cloud/speech');
const vision = require('@google-cloud/vision');
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: "uploads/" });

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

async function transcribeAudio(filePath) {
  console.log("filePath ==>", filePath);

  const mp3FilePath = filePath.replace('.m4a', '.mp3');
  try {
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${filePath} -codec:a libmp3lame -qscale:a 2 ${mp3FilePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Error during conversion:', error);
          reject(error);
        }
        console.log('Conversion stdout:', stdout);
        console.error('Conversion stderr:', stderr);
        resolve();
      });
    });
  } catch (error) {
    console.error("Error during conversion:", error);
    throw new Error("Failed to convert audio.");
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3FilePath),
      model: "whisper-1",
    });

    console.log("Transcription text:", transcription.text);

    return transcription.text;
  } catch (error) {
    console.error("Error during transcription:", error);
    throw new Error("Failed to transcribe audio.");
  } finally {
    fs.unlinkSync(mp3FilePath);
  }
}

async function describeImage(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What’s in this image?" },
            {
              type: "image_url",
              image_url: {
                "url": `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 400,
    });

    const prompt = `Analise o seguinte texto extraído de uma imagem: ${response.choices[0].message.content}. Baseado no conteúdo, forneça um título adequado para o objeto identificado, descrição do produto e sugira um preço de mercado para o mesmo.`;

    console.log('===>',response.choices[0]);

    const responseText = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 150,
      temperature: 0.5,
    });
  
    const description = responseText.choices[0].text.trim();
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

app.post("/analyze-audio", upload.single("audio"), async (req, res) => {
  console.log("make post request ==>", req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }
    console.log("make try post request ==>", req.file);
    const audioPath = path.resolve(req.file.path);
    console.log("audioPath ==>", audioPath);
    const transcribedText = await transcribeAudio(audioPath);
    console.log("transcribedText ==>", transcribedText);
    res.json({ transcribedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
