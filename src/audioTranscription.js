// audioTranscription.js
import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";

// .env 파일에서 환경 변수 로드
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 환경 변수에서 API 키 가져오기
});

async function main() {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream("/path/to/file/audio.mp3"), // 음성 파일 경로
      model: "whisper-1",
    });

    console.log("Transcription:", transcription.text);
  } catch (error) {
    console.error("Error during transcription:", error);
  }
}

main();

