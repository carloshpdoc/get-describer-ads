
# Media Analysis API

This application provides an API for analyzing media files, specifically images and audio, using services from OpenAI and Google Cloud. The application can transcribe audio files to text and describe the content of images.

## Features

- **Audio Transcription**: Convert audio files to text using OpenAI's Whisper model.
- **Image Description**: Analyze images and provide a textual description using OpenAI's GPT models.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (version 12 or later).
- **Google Cloud Credentials**: Configure your environment to authenticate with Google Cloud services.
- **OpenAI API Key**: Obtain an API key from OpenAI and set it in your environment variables.

## Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/carloshpdoc/get-describer-ads
   cd get-describer-ads
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Environment Configuration**:

   Create a `.env` file in the root of your project directory and add your API keys:

   ```plaintext
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_APPLICATION_CREDENTIALS=path-to-your-google-cloud-credentials.json
   PORT=3000
   ```

   Ensure your Google Cloud credentials JSON file path is correctly set.

## Usage

1. **Start the Server**:

   Run the following command to start the server:

   ```bash
   npm start
   ```

   The server will start on the port specified in your `.env` file or default to 3000.

2. **API Endpoints**:

   - **Describe Image**: Upload an image file to get a description.

     ```http
     POST /describe
     ```

     **Form Data**:
     - `image`: The image file to analyze.

   - **Analyze Audio**: Upload an audio file for transcription.

     ```http
     POST /analyze-audio
     ```

     **Form Data**:
     - `audio`: The audio file to transcribe (in `.m4a` format).

3. **Example Requests**:

   Use tools like `curl` or Postman to make requests to the API endpoints.

   **Example with curl**:

   ```bash
   curl -X POST -F 'image=@/path/to/your/image.jpg' http://localhost:3000/describe
   curl -X POST -F 'audio=@/path/to/your/audio.m4a' http://localhost:3000/analyze-audio
   ```

## Dependencies

- **express**: Web framework for Node.js.
- **multer**: Middleware for handling `multipart/form-data` for file uploads.
- **tesseract.js**: OCR tool to read text from images.
- **@google-cloud/speech**: Google Cloud's Speech-to-Text API.
- **@google-cloud/vision**: Google Cloud's Vision API.
- **OpenAI**: Library for interacting with OpenAI's API.
- **dotenv**: Loads environment variables from a `.env` file.
- **ffmpeg**: Used for audio file conversion.

## Notes

- Ensure ffmpeg is installed and accessible in your system's PATH for audio file conversion.
- Handle API rate limits and errors according to your application needs.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.
