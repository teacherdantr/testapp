// src/ai/flows/prevent-bias.ts
// 'use server'; // Removed from top

/**
 * @fileOverview A flow to generate answer options for a given question to prevent bias in test design.
 *
 * - generateAnswerOptions - A function that generates answer options for a question.
 * - GenerateAnswerOptionsInput - The input type for the generateAnswerOptions function.
 * - GenerateAnswerOptionsOutput - The return type for the generateAnswerOptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAnswerOptionsInputSchema = z.object({
  question: z.string().describe('The question to generate answer options for.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  numOptions: z
    .number()
    .min(2)
    .max(5)
    .default(4)
    .describe('The number of answer options to generate (including the correct answer).'),
});

export type GenerateAnswerOptionsInput = z.infer<typeof GenerateAnswerOptionsInputSchema>;

const GenerateAnswerOptionsOutputSchema = z.object({
  options: z.array(z.string()).describe('An array of answer options, including the correct answer.'),
});

export type GenerateAnswerOptionsOutput = z.infer<typeof GenerateAnswerOptionsOutputSchema>;

export async function generateAnswerOptions(input: GenerateAnswerOptionsInput): Promise<GenerateAnswerOptionsOutput> {
  'use server'; // Moved inside the async function
  return generateAnswerOptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnswerOptionsPrompt',
  input: {schema: GenerateAnswerOptionsInputSchema},
  output: {schema: GenerateAnswerOptionsOutputSchema},
  prompt: `You are an AI assistant helping test creators generate unbiased answer options for their questions.

  Given the following question and correct answer, generate {{{numOptions}}} plausible answer options, including the correct answer. Ensure that the options are diverse and do not exhibit any unintentional bias.

  Question: {{{question}}}
  Correct Answer: {{{correctAnswer}}}

  Options:`, // The LLM is able to infer the array from the output schema's type.
});

const generateAnswerOptionsFlow = ai.defineFlow(
  {
    name: 'generateAnswerOptionsFlow',
    inputSchema: GenerateAnswerOptionsInputSchema,
    outputSchema: GenerateAnswerOptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
