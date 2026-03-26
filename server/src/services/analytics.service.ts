import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const analyzeTranscript = async (transcript: string, keywords: string[], questions: string[], customPrompt?: string, totalClients?: number) => {
  try {
    const basePrompt = customPrompt || `
      Eres un AUDITOR DE ESTRATEGIA DE VENTAS. Tu única misión es evaluar el cumplimiento del VENDEDOR respecto a las preguntas obligatorias.
      
      TOTAL DE CLIENTES ATENDIDOS EN ESTA SESIÓN: ${totalClients || 'Variable'} 
      
      FRAGMENTO DE VOZ (VENDEDOR):
      "${transcript}"
      
      PREGUNTAS DEL GUION: ${questions.join(', ')}.
    `;

    const instructions = `
      INSTRUCCIONES CRÍTICAS (PARA EL JEFE):
      1. Usa el número exacto de clientes atendidos: ${totalClients || 'Desconocido'}.
      2. Ignora totalmente lo que diga el cliente. Enfócate en CÓMO y CUÁNDO el vendedor hizo las preguntas.
      2. Evalúa si el vendedor forzó las preguntas o si fluyeron naturalmente.
      3. Identifica si el vendedor se saltó alguna pregunta estratégica crucial.
      4. Genera un consejo DIRECTIVO para el jefe para mejorar el desempeño de este vendedor específico.

      Responde EXCLUSIVAMENTE en formato JSON:
      {
        "total_clients": numero,
        "question_counts": { "Pregunta 1": total, ... },
        "summary": "Análisis estratégico del comportamiento del vendedor con las preguntas y consejo para el jefe",
        "compliance_score": 0-100
      }
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: `${basePrompt}\n${instructions}` }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' }
    });

    const content = chatCompletion.choices[0]?.message?.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error('Groq API Error:', error);
    return null;
  }
};
