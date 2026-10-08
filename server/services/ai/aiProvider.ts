import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return genAIClient;
}

export function isAIAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Generate structured JSON completion using gemini-3.8-flash
 */
export async function generateJSONCompletion<T>(
  prompt: string,
  systemInstruction?: string
): Promise<T | null> {
  const ai = getAIClient();
  if (!ai) {
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are an expert recruitment ATS and talent evaluation intelligence system. Always respond with strict, valid JSON matching the requested schema. Never invent skills or work history not present in the candidate resume.",
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text?.trim();
    if (!text) return null;

    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return null;
  }
}
