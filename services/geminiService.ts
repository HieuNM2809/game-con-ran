import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getGameCommentary = async (
  score: number,
  deathReason: 'WALL' | 'SELF' | null
): Promise<string> => {
  const ai = getClient();
  if (!ai) {
    return "Gemini API key not found. Add API_KEY to env.";
  }

  try {
    const prompt = `
      I just played a classic Snake game.
      - Final Score: ${score}
      - Cause of Death: ${deathReason === 'WALL' ? 'Crashed into a wall' : 'Bit my own tail'}
      
      Act as a witty, slightly sarcastic, but encouraging arcade game commentator.
      Give me a one-sentence reaction to my performance. 
      If the score is low (< 5), roast me gently. 
      If high (> 20), praise me.
      Keep it under 20 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Game over! Better luck next time.";
  } catch (error) {
    console.error("Error fetching commentary:", error);
    return "The AI is speechless at your performance (Network Error).";
  }
};