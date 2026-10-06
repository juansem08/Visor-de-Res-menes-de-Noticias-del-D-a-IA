import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

// Initialize the Gemini client.
// Ensure GEMINI_API_KEY is configured in your environment variables.
const ai = new GoogleGenAI({});

export async function GET() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: 'Busca las 3 noticias globales más importantes del día de hoy. Resume cada noticia en exactamente 15 palabras.',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              categoria: { type: Type.STRING, description: "ej. TECNOLOGÍA, POLÍTICA, ECONOMÍA" },
              fuente: { type: Type.STRING, description: "ej. Reuters, BBC" },
              resumen: { type: Type.STRING, description: "máximo 15 palabras" },
              tiempo: { type: Type.STRING, description: "ej. 1h ago" }
            },
            required: ["id", "categoria", "fuente", "resumen", "tiempo"]
          }
        }
      }
    });

    const data = JSON.parse(response.text());
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching daily brief:", error);
    return NextResponse.json({ error: "Failed to generate news" }, { status: 500 });
  }
}
