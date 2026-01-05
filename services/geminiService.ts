
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
        name: { type: Type.STRING },
        amount: { type: Type.STRING },
        deadline: { type: Type.STRING },
        eligibility: { type: Type.STRING },
        category: { type: Type.STRING, enum: ["GIRLS", "GENERAL"] },
        branch: { type: Type.STRING },
        year: { type: Type.STRING },
        applicationLink: { type: Type.STRING }
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
  'ANNOUNCEMENTS': {
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
 * AI Content Extraction & Categorization with Smart Routing
 */
export async function extractAndCategorize(content: string, mimeType: string = "text/plain", preferredCategory?: string): Promise<{ category: string, items: any[] } | null> {
  if (!isApiKeyConfigured()) {
    console.error("API Key missing in environment");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Classification Step - The Smart Router
  let category: string = (preferredCategory || '').toUpperCase();
  
  if (!category || category === 'DASHBOARD') {
    const classificationPrompt = `
      Analyze the following college content and classify it into EXACTLY ONE of these categories:
      TIMETABLE, SCHOLARSHIP, EVENT, EXAM, INTERNSHIP, ANNOUNCEMENTS.
      Respond with ONLY the word of the category.
      
      CONTENT:
      ${content.substring(0, 3000)}
    `;
    
    try {
      const classResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: classificationPrompt
      });
      const rawText = (classResponse.text || '').toUpperCase();
      // Use regex to find the category in case AI is verbose
      const match = rawText.match(/TIMETABLE|SCHOLARSHIP|EVENT|EXAM|INTERNSHIP|ANNOUNCEMENTS/);
      category = match ? match[0] : 'ANNOUNCEMENTS';
      console.log("AI Smart Routed to:", category);
    } catch (e) {
      console.error("Classification failure:", e);
      category = 'ANNOUNCEMENTS';
    }
  }

  // Normalize
  if (category === 'SCHOLARSHIPS') category = 'SCHOLARSHIP';
  if (category === 'EVENTS') category = 'EVENT';
  if (category === 'EXAMS') category = 'EXAM';
  if (category === 'INTERNSHIPS') category = 'INTERNSHIP';

  if (!CATEGORY_SCHEMAS[category]) {
    console.warn("Falling back to ANNOUNCEMENTS for category:", category);
    category = 'ANNOUNCEMENTS';
  }

  const schema = CATEGORY_SCHEMAS[category];
  const extractionPrompt = `
    Extract data for ${category} as a JSON array. 
    Map every row/item found in the input. 
    Return ONLY valid JSON.
  `;

  const parts: any[] = [{ text: extractionPrompt }];

  if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
    parts.push({
      inlineData: {
        data: content.includes(',') ? content.split(',')[1] : content,
        mimeType: mimeType
      }
    });
  } else {
    parts.push({ text: `DATA:\n${content}` });
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
    const items = parsed.map((item: any) => {
      // Clean undefined fields to prevent Firestore errors
      const cleanedItem: any = {
        id: generateId(),
        createdAt: new Date().toLocaleString(),
        sourceType: mimeType === 'application/json' ? 'EXCEL' : (mimeType.includes('text') ? 'MANUAL' : 'DOCUMENT'),
        timestamp: new Date().toLocaleString(),
      };

      Object.keys(item).forEach(key => {
        if (item[key] !== undefined) cleanedItem[key] = item[key];
      });

      if (cleanedItem.slots && Array.isArray(cleanedItem.slots)) {
        cleanedItem.slots = cleanedItem.slots.map((s: any) => ({ 
          ...s, 
          id: s.id || generateId() 
        }));
      }

      return cleanedItem;
    });

    return { category, items };
  } catch (error) {
    console.error("Extraction error:", error);
    return null;
  }
}
