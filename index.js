require("dotenv").config();
const fs = require('fs');
const express = require("express");
const multer = require("multer");
const path = require("path");
const { OpenAI } = require("openai");
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: "uploads/" });

const authorizedEmails = process.env.EMAILS_AUTHORIZED.split(',');

const openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
});

function emailAuthMiddleware(req, res, next) {
  const { email } = req.body;

  if (!email) {
    return res.status(401).send({ message: "Unauthorized: Email is required." });
  }

  if (!authorizedEmails.includes(email)) {
    return res.status(401).send({ message: "Unauthorized: Email is not authorized." });
  }

  next();
}

async function transcribeAudio(filePath) {
  const mp3FilePath = `${filePath}.mp3`;

  try {
    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${filePath} -codec:a libmp3lame -b:a 192k ${mp3FilePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error('=== Error === during conversion:', error);
          reject(error);
        }
        console.log('=== stdout ===',stdout);
        console.log('=== stderr ===',stderr);
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

    console.log('transcription ===>',transcription);
    return transcription;
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
    return description;

  } catch (error) {
    console.error("Error describing image:", error);
    throw new Error("Failed to describe image.");
  }
}

app.post("/describe", upload.single("image"), emailAuthMiddleware, async (req, res) => {
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

app.post("/analyze-audio", upload.single("audio"), emailAuthMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded." });
    }

    const audioPath = path.resolve(req.file.path);

    const transcribedText = await transcribeAudio(audioPath);

    res.json({ transcribedText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/authenticate', (req, res) => {
  const { email } = req.body;

  if (authorizedEmails.includes(email)) {
    console.log('Authorized', email);
      res.status(200).send({ message: 'Authorized' });
  } else {
    console.log('Unauthorized', email);
      res.status(401).send({ message: 'Unauthorized' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
