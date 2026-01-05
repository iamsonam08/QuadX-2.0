
import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 11);

export function isApiKeyConfigured(): boolean {
  return !!process.env.API_KEY && process.env.API_KEY !== '';
}

export async function askVPai(question: string, context: AppData) {
  if (!isApiKeyConfigured()) return "API Key is not configured! 🔑";
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are VPai, the official AI assistant for QuadX College. KNOWLEDGE BASE: ${JSON.stringify(context)}`,
        temperature: 0.4,
      }
    });
    return response.text?.trim() || "I'm thinking... but nothing came out.";
  } catch (error) {
    return "Connection hiccup. Check your API key! ⚡";
  }
}

const CATEGORY_SCHEMAS: Record<string, any> = {
  'TIMETABLE': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING },
        branch: { type: Type.STRING },
        year: { type: Type.STRING },
        division: { type: Type.STRING },
        slots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING },
              subject: { type: Type.STRING },
              room: { type: Type.STRING }
            }
          }
        }
      }
    }
  },
  'SCHOLARSHIP': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        amount: { type: Type.STRING },
        deadline: { type: Type.STRING },
        eligibility: { type: Type.STRING },
        category: { type: Type.STRING, enum: ["GIRLS", "GENERAL"] }
      }
    }
  },
  'ANNOUNCEMENTS': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        priority: { type: Type.STRING }
      }
    }
  }
};

export async function extractAndCategorize(content: string, mimeType: string = "text/plain", fileName?: string): Promise<{ category: string, items: any[] }> {
  const fallback = {
    category: 'ANNOUNCEMENTS',
    items: [{
      id: generateId(),
      title: fileName || "New Uploaded Document",
      content: content.length > 500 ? content.substring(0, 500) + "..." : content,
      rawContent: content,
      mimeType: mimeType,
      originalFileName: fileName,
      priority: 'NORMAL',
      timestamp: new Date().toLocaleString()
    }]
  };

  if (!isApiKeyConfigured()) return fallback;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // 1. Classification
    const classResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Classify this content as TIMETABLE, SCHOLARSHIP, or ANNOUNCEMENTS. Return ONLY the word. Data: ${content.substring(0, 500)}`
    });
    const category = (classResponse.text || 'ANNOUNCEMENTS').trim().toUpperCase();
    const activeCategory = CATEGORY_SCHEMAS[category] ? category : 'ANNOUNCEMENTS';

    // 2. Extraction
    const extractResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract data for ${activeCategory} from this: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: CATEGORY_SCHEMAS[activeCategory]
      }
    });

    const items = JSON.parse(extractResponse.text || '[]');
    if (!Array.isArray(items) || items.length === 0) return fallback;

    return {
      category: activeCategory,
      items: items.map(item => ({
        ...item,
        id: generateId(),
        timestamp: new Date().toLocaleString(),
        originalFileName: fileName,
        rawContent: content,
        mimeType: mimeType
      }))
    };
  } catch (error) {
    console.error("AI Error, using fallback:", error);
    return fallback;
  }
}
