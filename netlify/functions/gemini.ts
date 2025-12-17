import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, text, image, langs, lang, context } = JSON.parse(event.body);

    if (action === 'generate') {
      const schema = {
        type: Type.OBJECT,
        properties: {
          key1: { type: Type.STRING },
          key2: { type: Type.STRING },
          translations: {
            type: Type.OBJECT,
            properties: langs.reduce((acc: any, l: string) => {
              acc[l] = { type: Type.STRING };
              return acc;
            }, { en: { type: Type.STRING } }),
            required: [...langs, 'en']
          }
        },
        required: ["key1", "key2", "translations"]
      };

      const parts: any[] = [];
      if (image) {
        parts.push({
          inlineData: {
            mimeType: "image/png",
            data: image
          }
        });
      }
      parts.push({ text: text || "Extract text and generate iGaming keys and translations." });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          systemInstruction: "You are an iGaming localization expert. Generate a Category (Key1) and ShortCode (Key2) in uppercase, plus translations for all requested languages.",
          responseMimeType: "application/json",
          responseSchema: schema
        }
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: response.text
      };
    }

    if (action === 'refine') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Refine this iGaming text for ${lang}. Context: ${context}. Text: ${text}`,
        config: {
          systemInstruction: "Return ONLY the refined text string. No quotes, no explanation."
        }
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response.text?.trim() })
      };
    }

    return { statusCode: 400, body: "Invalid Action" };
  } catch (error: any) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};