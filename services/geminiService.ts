
import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

// Helper to generate a unique ID for new records
const generateId = () => Math.random().toString(36).substring(2, 11);

/**
 * Check if the API Key is available
 */
export function isApiKeyConfigured(): boolean {
  return !!process.env.API_KEY && process.env.API_KEY !== '';
}

/**
 * VPai Chat Assistant
 */
export async function askVPai(question: string, context: AppData) {
  if (!isApiKeyConfigured()) {
    return "API Key is not configured in your deployment environment variables! 🔑";
  }

  // Create a new GoogleGenAI instance right before making an API call for up-to-date configuration
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are VPai, the official AI assistant for QuadX College. 
        KNOWLEDGE BASE: ${JSON.stringify(context)}
        RULES: Be concise (1-2 sentences). Use the base strictly. If info is missing, say "I don't have that info yet! 📚"`,
        temperature: 0.4,
      }
    });

    // Access .text property directly (getter)
    return response.text?.trim() || "I'm thinking... but nothing came out. Try again? 🤔";
  } catch (error) {
    console.error("VPai Connection Error:", error);
    return "I'm having a connection hiccup. Check your API key and internet! ⚡";
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
              room: { type: Type.STRING },
              color: { type: Type.STRING }
            }
          }
        }
      },
      required: ["day", "branch", "year", "division", "slots"]
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
        category: { type: Type.STRING }
      },
      required: ["name", "amount", "deadline", "eligibility", "category"]
    }
  },
  'EVENT': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        date: { type: Type.STRING },
        venue: { type: Type.STRING },
        description: { type: Type.STRING },
        category: { type: Type.STRING }
      },
      required: ["title", "date", "venue", "description", "category"]
    }
  },
  'EXAM': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        date: { type: Type.STRING },
        time: { type: Type.STRING },
        venue: { type: Type.STRING },
        branch: { type: Type.STRING },
        year: { type: Type.STRING },
        division: { type: Type.STRING }
      },
      required: ["subject", "date", "time", "venue", "branch", "year", "division"]
    }
  },
  'INTERNSHIP': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        company: { type: Type.STRING },
        role: { type: Type.STRING },
        location: { type: Type.STRING },
        stipend: { type: Type.STRING },
        branch: { type: Type.STRING },
        year: { type: Type.STRING }
      },
      required: ["company", "role", "location", "stipend", "branch", "year"]
    }
  }
};

/**
 * AI Content Extraction
 */
export async function extractCategoryData(category: string, content: string, mimeType: string = "text/plain") {
  if (!isApiKeyConfigured()) {
    console.error("CRITICAL: API_KEY is missing from environment variables.");
    return [];
  }

  // Fresh instance for every extraction request
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const schema = CATEGORY_SCHEMAS[category];
  
  if (!schema) return [];

  const parts: any[] = [{ text: `Task: Extract structured JSON data for ${category} from input. 
  Output ONLY a valid JSON array. No conversational text.
  Branch names: Comp, IT, Civil, Mech, Elect, AIDS, E&TC.
  Years: 1st Year, 2nd Year, 3rd Year, 4th Year.` }];

  if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        data: content.includes(',') ? content.split(',')[1] : content,
        mimeType: mimeType
      }
    });
  } else {
    parts.push({ text: `INPUT DATA:\n${content}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    // Extract text and sanitize from potential markdown wrappers
    let rawText = response.text || '[]';
    const sanitizedText = rawText.replace(/```json\n?|```/g, '').trim();
    if (!sanitizedText) return [];
    
    const parsed = JSON.parse(sanitizedText);
    
    if (!Array.isArray(parsed)) return [];

    // Assign IDs to extracted items and their nested components
    return parsed.map((item: any) => ({
      ...item,
      id: generateId(),
      slots: item.slots ? item.slots.map((s: any) => ({ ...s, id: generateId() })) : undefined
    }));
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return [];
  }
}
