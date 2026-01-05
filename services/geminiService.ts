
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

/**
 * Enhanced AI Extraction for QuadX 2.0
 */
export async function extractAndCategorize(fileData: string, mimeType: string, fileName: string): Promise<{ collection: string, items: any[] }> {
  const fallback = {
    collection: 'broadcasts',
    items: [{
      id: generateId(),
      title: fileName,
      category: 'broadcasts',
      branch: ['Comp', 'IT', 'Civil', 'Mech', 'Elect', 'AIDS', 'E&TC'],
      year: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
      summary: "Manual processing fallback.",
      aiProcessed: false,
      priority: 'NORMAL',
      fileUrl: fileData
    }]
  };

  if (!isApiKeyConfigured()) return fallback;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const prompt = `Analyze this college document: "${fileName}". 
    1. Extract all meaningful text and data.
    2. Categorize it as: internships, scholarships, exam_notices, timetable, or broadcasts.
    3. Identify applicable Branches (Comp, IT, Civil, Mech, Elect, AIDS, E&TC).
    4. Identify applicable Years (1st Year, 2nd Year, 3rd Year, 4th Year).
    5. Generate a short summary and tags (e.g. "paid", "deadline", "government").
    6. Return a valid JSON array of objects.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { text: prompt },
        { inlineData: { mimeType: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg', data: fileData.split(',')[1] || fileData } }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            collection: { type: Type.STRING, description: "Target collection name" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  branch: { type: Type.ARRAY, items: { type: Type.STRING } },
                  year: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  // Categorical specific fields
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  stipend: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  date: { type: Type.STRING },
                  venue: { type: Type.STRING },
                  subject: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    if (!result.collection || !result.items) return fallback;

    return {
      collection: result.collection.toLowerCase(),
      items: result.items.map((item: any) => ({
        ...item,
        id: generateId(),
        aiProcessed: true,
        fileUrl: fileData,
        category: result.collection
      }))
    };
  } catch (error) {
    console.error("Gemini Deep Extraction Failed:", error);
    return fallback;
  }
}
