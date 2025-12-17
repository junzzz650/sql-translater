import { GoogleGenAI, Type } from "@google/genai";
import { CmsEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-3-flash-preview";

// We generate the schema dynamically now based on user config
const createSchema = (languages: string[]): any => {
  const translationsProps: Record<string, any> = {};
  
  languages.forEach(lang => {
    translationsProps[lang] = { 
        type: Type.STRING,
        description: lang === 'en' ? "English Translation" : `Translation for language code: ${lang}`
    };
  });

  return {
    type: Type.OBJECT,
    properties: {
      key1: {
        type: Type.STRING,
        description: "The Category Key (e.g., BANK, GAME, PROMO). Uppercase. Derived from English meaning.",
      },
      key2: {
        type: Type.STRING,
        description: "The Short Code Key (e.g., MTC, SPIN, DEPOSIT). Uppercase. Derived from English meaning.",
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
  const langs = Array.from(new Set([...targetLanguages, 'en']));
  const schema = createSchema(langs);

  const systemInstruction = `
    You are an expert iGaming SQL Data Generator.
    
    Your task is to analyze the input (Text and/or Image) and generate:
    1. A CATEGORY KEY (Key 1) and a SHORT CODE KEY (Key 2) based on the ENGLISH meaning.
    2. Translations for the specific requested languages: ${langs.join(', ')}.

    ### INPUT HANDLING
    - **Language Agnostic**: The input text can be in ANY language. 
    - **Image Input**: If an image is provided, extract the main text or intent.
    - **Translation Source**: If input is non-English, translate it to English internally to generate Key 1/Key 2, then translate to all requested target languages.

    ### KEY GENERATION RULES
    - **Key 1 (Category)**: e.g., BANK, GAME, PROMO, ERR, BTN, SYS, ACC. (Max 4-6 chars, Uppercase).
    - **Key 2 (Short Code)**: An abbreviation of the content in English. e.g., 'Max Transaction Count' -> 'MTC'. 'Free Spin' -> 'FSPIN'. (Max 6-8 chars, Uppercase).
    
    ### TRANSLATION RULES
    - **Tone**: Professional, Concise, iGaming appropriate (Exciting for Promos, Clear for Errors).
    - **Format**: Return strict JSON matching the schema.
  `;

  try {
    const parts: any[] = [];
    
    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/png", 
          data: imageBase64
        }
      });
      parts.push({
        text: textInput ? `Analyze this image in context of: "${textInput}"` : "Analyze the text and context in this image."
      });
    } else {
      parts.push({ text: textInput });
    }

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts }, 
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.3,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);

    return {
      key1: data.key1,
      key2: data.key2,
      translations: data.translations,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const refineText = async (targetLang: string, currentText: string, englishContext: string): Promise<string> => {
  const systemInstruction = `
    You are an expert iGaming Localization Specialist.
    
    Task: Refine or Translate text for an Online Casino/Betting platform.
    Target Language Code: "${targetLang}"
    English Context: "${englishContext}"

    Instructions:
    1. If the current text is empty or looks wrong, TRANSLATE the "English Context" to "${targetLang}".
    2. If the current text exists, REFINE it to be professional, concise, and native-sounding for iGaming.
    3. Return ONLY the final text string. No explanations.
  `;

  try {
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts: [{ text: currentText || " " }] }, 
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.7,
        },
    });
    return response.text?.trim() || currentText;
  } catch (e) {
      console.error("Gemini Refine Error:", e);
      return currentText;
  }
};