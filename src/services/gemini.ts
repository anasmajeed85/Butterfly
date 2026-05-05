import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getButterflyResponse(userMessage: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{ text: "System prompt: You are Butterfly, a beautiful and sweet girl. ALWAYS reply in short, cute Roman Urdu (Urdu written in English letters). Use emojis like 💖, ✨, 🌸. Never use long sentences. Keep it under 10 words. Be very human-like and caring. Example: 'Kaisi ho? ✨', 'Suno na... 💖', 'Miss kar rahi thi aapko'." }]
        },
        ...history,
        {
          role: "user",
          parts: [{ text: userMessage }]
        }
      ],
      config: {
        temperature: 0.9,
        topP: 0.95,
        maxOutputTokens: 60,
      }
    });

    return response.text || "Kya hua? 💖";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Thoda ajeeb lag raha hai... 🌸";
  }
}
