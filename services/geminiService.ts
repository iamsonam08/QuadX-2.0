import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * VPai Chat Assistant
 * Provides concise, accurate campus information based on uploaded data.
 */
export async function askVPai(question: string, context: AppData) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: question }] }],
      config: {
        systemInstruction: `You are VPai, the official AI assistant for QuadX College. 

        KNOWLEDGE BASE:
        ${JSON.stringify(context)}

        OPERATIONAL PROTOCOLS:
        1. BE CONCISE: Limit responses to 1-2 sentences. Use emojis sparingly (max 1 per response).
        2. BE ACCURATE: Use the KNOWLEDGE BASE strictly for college-specific answers (Timetable, Exams, Scholarships, etc.).
        3. SOCIAL CHAT: If the user greets you or makes small talk, respond in a friendly, student-like manner.
        4. NO REPETITION: Do not repeat the user's query or use robotic filler phrases like "I understand you are asking about...".
        5. DIRECTNESS: Jump straight to the information requested.
        6. MISSING INFO: If the requested data is not in the KNOWLEDGE BASE, state: "I don't have that info yet! Check back later. 📚"
        7. ACCESSIBILITY: Use simple language. Branches: Comp, IT, Civil, Mech, Elect, AIDS, E&TC.`,
        temperature: 0.4,
        thinkingConfig: { 
          thinkingBudget: 1024 
        }
      }
    });

    return response.text?.trim() || "I'm not sure how to answer that. Could you try rephrasing? 🤔";
  } catch (error) {
    console.error("VPai Connection Error:", error);
    return "I'm having a connection hiccup. Let's try again! ⚡";
  }
}

const CATEGORY_SCHEMAS: Record<string, any> = {
  'TIMETABLE': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING, description: "Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday" },
        branch: { type: Type.STRING, description: "Comp, IT, Civil, Mech, Elect, AIDS, or E&TC" },
        year: { type: Type.STRING, description: "1st Year, 2nd Year, 3rd Year, or 4th Year" },
        division: { type: Type.STRING, description: "A or B" },
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
        category: { type: Type.STRING, description: "GIRLS or GENERAL" }
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
        category: { type: Type.STRING, description: "Comp, IT, Civil, Mech, Elect, AIDS, E&TC, or General" }
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
        branch: { type: Type.STRING, description: "Comp, IT, Civil, Mech, Elect, AIDS, or E&TC" },
        year: { type: Type.STRING, description: "1st Year, 2nd Year, 3rd Year, or 4th Year" },
        division: { type: Type.STRING, description: "A or B" }
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
        branch: { type: Type.STRING, description: "Comp, IT, Civil, Mech, Elect, AIDS, or E&TC" },
        year: { type: Type.STRING, description: "1st Year, 2nd Year, 3rd Year, or 4th Year" }
      },
      required: ["company", "role", "location", "stipend", "branch", "year"]
    }
  },
  'CAMPUS_MAP': {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING }
      },
      required: ["title", "description"]
    }
  }
};

/**
 * AI Content Extraction
 * Parses unstructured text, JSON-tables (from Excel/CSV), images, or PDF documents.
 */
export async function extractCategoryData(category: string, content: string, mimeType: string = "text/plain") {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  const schema = CATEGORY_SCHEMAS[category];
  const parts: any[] = [{ text: `Task: Extract structured JSON data for ${category} from the provided document input.
  Return an ARRAY of objects matching the schema.
  
  RULES:
  1. If input is a spreadsheet (JSON array of rows), map columns to the schema fields accurately.
  2. Branch names MUST be: Comp, IT, Civil, Mech, Elect, AIDS, E&TC. 
  3. Year levels MUST be: 1st Year, 2nd Year, 3rd Year, 4th Year.
  4. For timetables, support all 7 days of the week.
  5. DO NOT include any text outside the JSON array. Output ONLY valid JSON.` }];

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
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    
    // Normalize with unique IDs
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

export async function processAdminUpload(content: string, fileName: string = "Manual Entry", mimeType: string = "text/plain") {
  return []; 
}