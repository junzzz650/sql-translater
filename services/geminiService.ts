import { GoogleGenAI, Type } from "@google/genai";
import { CmsEntry } from "../types";

const MODEL_NAME = "gemini-3-flash-preview";

// Dynamic schema generation based on selected languages
const createSchema = (languages: string[]): any => {
  const translationsProps: Record<string, any> = {};
  
  languages.forEach(lang => {
    translationsProps[lang] = { 
        type: Type.STRING,
        description: `iGaming localized string for: ${lang}`
    };
  });

  return {
    type: Type.OBJECT,
    properties: {
      key1: {
        type: Type.STRING,
        description: "Category code (e.g. BANK, GAME, PROMO). Max 6 chars.",
      },
      key2: {
        type: Type.STRING,
        description: "Action or content code (e.g. DEPOSIT, SPIN). Max 8 chars.",
      },
      translations: {
        type: Type.OBJECT,
        properties: translationsProps,
        required: languages, 
      },
    },
    required: ["key1", "key2", "translations"],
  };
};

export const generateCmsEntry = async (
    textInput: string, 
    targetLanguages: string[], 
    imageBase64?: string
): Promise<Omit<CmsEntry, 'id' | 'timestamp'>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const langs = Array.from(new Set([...targetLanguages, 'en']));
  const schema = createSchema(langs);

  const systemInstruction = `
    You are an expert iGaming CMS Localization Tool.
    
    TASK:
    Generate unique SQL keys and translations for a gambling/casino platform.
    Key 1 is the Category (uppercase, short).
    Key 2 is the Descriptive Code (uppercase, short).
    
    CONTEXT:
    The input might be an image of a game UI or a text description.
    Ensure translations are professional and context-aware (e.g., 'Bet' vs 'Wager').
  `;

  try {
    const parts: any[] = [];
    if (imageBase64) {
      parts.push({ inlineData: { mimeType: "image/png", data: imageBase64 } });
    }
    parts.push({ text: textInput || "Extract meaning from image and translate." });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts }, 
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const data = JSON.parse(response.text || "{}");

    return {
      key1: data.key1?.toUpperCase() || "NEW",
      key2: data.key2?.toUpperCase() || "KEY",
      translations: data.translations,
    };
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const refineText = async (targetLang: string, currentText: string, englishContext: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `
    Refine this iGaming text for language: ${targetLang}.
    Context: ${englishContext}
    Return ONLY the corrected/refined text.
  `;

  try {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [{ text: currentText || englishContext }] }, 
        config: { systemInstruction },
    });
    return response.text?.trim() || currentText;
  } catch (e) {
      return currentText;
  }
};