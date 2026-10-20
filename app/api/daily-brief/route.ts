import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const temasQuery = searchParams.get('temas');
  const temasPreferidos = temasQuery 
    ? temasQuery.split(',').map(t => t.trim()).filter(Boolean)
    : ['Tecnología', 'Inteligencia Artificial', 'Negocios'];

  return handleCuratedBrief(temasPreferidos);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const temasPreferidos = Array.isArray(body?.temas) && body.temas.length > 0
      ? body.temas
      : ['Tecnología', 'Inteligencia Artificial', 'Negocios'];
    return handleCuratedBrief(temasPreferidos);
  } catch {
    return handleCuratedBrief(['Tecnología', 'Inteligencia Artificial', 'Negocios']);
  }
}

async function handleCuratedBrief(temasPreferidos: string[]) {
  const prompt = `Actúa como un curador de noticias. Dame 3 titulares súper cortos y un resumen de una línea basados EXCLUSIVAMENTE en estos temas: ${temasPreferidos.join(', ')}.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not configured. Falling back to curated simulated response.");
      return NextResponse.json(generateFallbackNews(temasPreferidos));
    }

    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              titular: { type: Type.STRING, description: "Titular súper corto e impactante (máx 8 palabras)" },
              categoria: { type: Type.STRING, description: "Categoría de la noticia (ej. Tecnología, Inteligencia Artificial, Negocios)" },
              fuente: { type: Type.STRING, description: "ej. TechCrunch, Wired, Reuters, Bloomberg" },
              resumen: { type: Type.STRING, description: "Resumen de exactamente una línea" },
              tiempo: { type: Type.STRING, description: "ej. 5m ago, Hace 1h" }
            },
            required: ["id", "titular", "categoria", "fuente", "resumen", "tiempo"]
          }
        }
      }
    });

    const text = response.text;
    if (typeof text === 'string') {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    }
    
    return NextResponse.json(generateFallbackNews(temasPreferidos));
  } catch (error) {
    console.error("Error en Gemini API daily-brief:", error);
    return NextResponse.json(generateFallbackNews(temasPreferidos));
  }
}

function generateFallbackNews(temas: string[]) {
  const newsTemplates: Record<string, { titular: string; fuente: string; resumen: string }> = {
    'Tecnología': {
      titular: 'Nueva era de procesadores cuánticos portátiles',
      fuente: 'TechCrunch',
      resumen: 'Fabricantes logran integrar núcleos de bajo consumo en dispositivos de uso diario.'
    },
    'Inteligencia Artificial': {
      titular: 'Gemini 2.5 Flash optimiza inferencia en Wearables',
      fuente: 'Google AI Blog',
      resumen: 'Modelos multimodales ultra compactos permiten resúmenes de noticias al instante en la muñeca.'
    },
    'Negocios': {
      titular: 'Mercados tecnológicos repuntan con fuerza récord',
      fuente: 'Bloomberg',
      resumen: 'Las empresas de hardware wearable lideran las ganancias trimestrales en Wall Street.'
    },
    'Ciencia': {
      titular: 'Telescopio Webb detecta atmósfera en exoplaneta',
      fuente: 'Nature',
      resumen: 'Confirmaron trazas de vapor de agua y dióxido de carbono en un sistema cercano.'
    },
    'Salud': {
      titular: 'Sensores de muñeca predicen fatiga cardiovascular',
      fuente: 'HealthTech',
      resumen: 'Algoritmos biométricos anticipan episodios de estrés con 95% de precisión.'
    },
    'Cripto': {
      titular: 'Pagos instantáneos con stablecoins en relojes',
      fuente: 'CoinDesk',
      resumen: 'Nueva especificación NFC habilita transacciones seguras con biometría del pulso.'
    }
  };

  const selectedTopics = temas.length > 0 ? temas.slice(0, 3) : ['Tecnología', 'Inteligencia Artificial', 'Negocios'];
  
  return selectedTopics.map((tema, index) => {
    const item = newsTemplates[tema] || {
      titular: `${tema}: Innovaciones clave revolucionan la industria`,
      fuente: 'DailyBrief Radar',
      resumen: `Reporte exclusivo de última hora enfocado en tendencias clave sobre ${tema}.`
    };

    return {
      id: Date.now() + index,
      titular: item.titular,
      categoria: tema.toUpperCase(),
      fuente: item.fuente,
      resumen: item.resumen,
      tiempo: `${(index + 1) * 7}m ago`
    };
  });
}
