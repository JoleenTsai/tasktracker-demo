import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiClient) {
    // Note: For Vertex AI, you'll typically need to call this from your Node.js server (server.ts)
    // because ADC (Application Default Credentials) don't work directly in the browser.
    // This prevents the browser app from crashing on load.
    aiClient = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY'
    });
  }
  return aiClient;
};
export interface ParsedData {
  projects: {
    name: string;
    description: string;
    category: string;
    dueDate: string;
  }[];
  tasks: {
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    dueDate: string;
  }[];
  engagements: {
    title: string;
    description: string;
    status: 'Active' | 'On Hold' | 'Completed' | 'Upcoming';
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    cadence: 'One-time' | 'Recurring';
    recurrencePattern: string;
    engagementDate: string;
  }[];
}

export const parseDocumentContent = async (text: string): Promise<ParsedData | null> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract project details, tasks, and account engagements from the following text. 
      Return a structured JSON object. If a field is missing in the text, provide a sensible default or leave it empty.
      
      Text: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  dueDate: { type: Type.STRING, description: "ISO date or human readable" },
                },
                required: ["name"]
              }
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Urgent"] },
                  dueDate: { type: Type.STRING, description: "ISO date or human readable" },
                },
                required: ["title"]
              }
            },
            engagements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["Active", "On Hold", "Completed", "Upcoming"] },
                  priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Urgent"] },
                  cadence: { type: Type.STRING, enum: ["One-time", "Recurring"] },
                  recurrencePattern: { type: Type.STRING },
                  engagementDate: { type: Type.STRING, description: "ISO date or human readable" },
                },
                required: ["title"]
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      projects: result.projects || [],
      tasks: result.tasks || [],
      engagements: result.engagements || []
    };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
};
