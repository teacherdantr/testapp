'use server';

import { generateAnswerOptions as AIGenerateOptions } from '@/ai/flows/prevent-bias';

export async function generateAnswerOptionsAI(question: string, correctAnswer: string, numOptions: number = 4): Promise<{options: string[]} | {error: string}> {
  try {
    const result = await AIGenerateOptions({ question, correctAnswer, numOptions });
    return result;
  } catch (e: any) {
    console.error("AI option generation failed:", e);
    return { error: `Failed to generate options using AI. ${e.message}` };
  }
}