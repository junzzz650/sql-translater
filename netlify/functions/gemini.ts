import { GoogleGenAI, Type } from "@google/genai";

// The API key is securely accessed from Netlify's environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const handler = async (event: any) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action, text, image, langs, lang, context } = body;

    if (action === 'generate') {
      const schema = {
        type: Type.OBJECT,
        properties: {
          key1: { type: Type.STRING, description: "Category code" },
          key2: { type: Type.STRING, description: "Action code" },
          translations: {
            type: Type.OBJECT,
            properties: (langs || ['en']).reduce((acc: any, l: string) => {
              acc[l] = { type: Type.STRING };
              return acc;
            }, { en: { type: Type.STRING } }),
            required: [...(langs || []), 'en']
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
      parts.push({ text: text || "Identify the iGaming intent and translate to requested languages." });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts },
        config: {
          systemInstruction: "You are an iGaming CMS expert. Create SQL-friendly keys (KEY1=Category, KEY2=ShortCode) and professional translations. Use context like 'Spin', 'Bet', 'Deposit', 'Withdraw'.",
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
        contents: `Refine this iGaming text for ${lang}. English context: ${context}. Current text: ${text}`,
        config: {
          systemInstruction: "You are a localization editor. Return ONLY the corrected string. No quotes, no preamble."
        }
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response.text?.trim() })
      };
    }

    return { 
      statusCode: 400, 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid action" }) 
    };

  } catch (error: any) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message || "Internal Server Error" })
    };
  }
};