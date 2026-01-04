import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * VPai Chat Assistant
 * Provides concise, accurate campus information based on uploaded data.
 */
export async function askVPai(question: string, context: AppData) {
  // Always create a new instance inside the function to ensure the correct API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: question }] }],
      config: {
        systemInstruction: `You are VPai, the official AI assistant for QuadX College. 

        KNOWLEDGE BASE:
        ${JSON.stringify(context)}

        OPERATIONAL PROTOCOLS:
        1. BE CONCISE: Limit responses to 1-2 sentences. Use emojis sparingly.
        2. BE ACCURATE: Use the KNOWLEDGE BASE strictly for college-specific answers.
        3. SOCIAL CHAT: If the user greets you or makes small talk, respond in a friendly student manner.
        4. DIRECTNESS: Jump straight to the information requested.
        5. MISSING INFO: If data is missing, say: "I don't have that info yet! Check back later. 📚"`,
        temperature: 0.4,
      }
    });

    return response.text?.trim() || "I'm not sure how to answer that. Could you try rephrasing? 🤔";
  } catch (error) {
    console.error("VPai Connection Error:", error);
    return "I'm having a connection hiccup. Please check if your API key is correctly set in the environment variables! ⚡";
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
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const schema = CATEGORY_SCHEMAS[category];
  
  if (!schema) {
    console.error(`No schema defined for category: ${category}`);
    return [];
  }

  const parts: any[] = [{ text: `Task: Extract structured JSON data for ${category} from the provided input. 
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
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    let rawText = response.text || '[]';
    // Deep clean Markdown if responseMimeType wasn't strictly followed
    const sanitizedText = rawText.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(sanitizedText);
    
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