import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const prompt = "";

const result = await model.generateContent(prompt);
console.log(result.response.text());