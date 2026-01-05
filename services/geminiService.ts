
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
    return "API Key is not configured! 🔑";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are VPai, the official AI assistant for QuadX College. 
        KNOWLEDGE BASE: ${JSON.stringify(context)}
        RULES: Be concise. If info is missing, say "I don't have that info yet! 📚"`,
        temperature: 0.4,
      }
    });
    return response.text?.trim() || "I'm thinking... but nothing came out.";
  } catch (error) {
    console.error("VPai Connection Error:", error);
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
        name: { type: Type.STRING, description: "The name of the scholarship" },
        amount: { type: Type.STRING, description: "Amount or grant value" },
        deadline: { type: Type.STRING, description: "Application deadline" },
        eligibility: { type: Type.STRING, description: "Criteria for eligibility" },
        category: { type: Type.STRING, enum: ["GIRLS", "GENERAL"] },
        branch: { type: Type.STRING, description: "Applicable branch or 'Global'" },
        year: { type: Type.STRING, description: "Applicable academic year" },
        applicationLink: { type: Type.STRING, description: "URL for application if found" }
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
  },
  'ANNOUNCEMENT': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ["HIGH", "NORMAL"] }
      },
      required: ["title", "content", "priority"]
    }
  }
};

/**
 * AI Content Extraction & Categorization
 */
export async function extractAndCategorize(content: string, mimeType: string = "text/plain", preferredCategory?: string) {
  if (!isApiKeyConfigured()) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Classification Step
  let category = preferredCategory;
  if (!category) {
    const classificationResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Classify the following content into one of these categories: TIMETABLE, SCHOLARSHIP, EVENT, EXAM, INTERNSHIP, ANNOUNCEMENT. Respond ONLY with the category name.\n\nCONTENT: ${content.substring(0, 1000)}`
    });
    category = classificationResponse.text?.trim().toUpperCase() || 'ANNOUNCEMENT';
  }

  // Sanitize category / Handle plural aliases
  if (category === 'SCHOLARSHIPS') category = 'SCHOLARSHIP';
  if (!CATEGORY_SCHEMAS[category]) category = 'ANNOUNCEMENT';

  const schema = CATEGORY_SCHEMAS[category];
  const parts: any[] = [{ text: `Task: Extract structured JSON data for ${category} from input. Output ONLY a valid JSON array matching the schema. For SCHOLARSHIP, if branch or year are not specified, you may omit them or use "Global". Ensure application links are extracted if available.` }];

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

    const parsed = JSON.parse(response.text || '[]');
    const items = parsed.map((item: any) => ({
      ...item,
      id: generateId(),
      createdAt: new Date().toLocaleString(),
      sourceType: mimeType === 'application/json' ? 'EXCEL/JSON' : (mimeType.includes('text') ? 'TEXT/MANUAL' : 'DOCUMENT'),
      timestamp: new Date().toLocaleString(),
      slots: item.slots ? item.slots.map((s: any) => ({ ...s, id: generateId() })) : undefined
    }));

    return { category, items };
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return null;
  }
}
