// 'use server';
/**
 * @fileOverview A voice-enabled symptom checker AI agent.
 *
 * - voiceSymptomChecker - A function that handles the symptom checking process.
 * - VoiceSymptomCheckerInput - The input type for the voiceSymptomChecker function.
 * - VoiceSymptomCheckerOutput - The return type for the voiceSymptomChecker function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceSymptomCheckerInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms described by the patient in their preferred language.'),
  language: z.string().optional().describe('The language of the symptoms description.'),
});
export type VoiceSymptomCheckerInput = z.infer<typeof VoiceSymptomCheckerInputSchema>;

const VoiceSymptomCheckerOutputSchema = z.object({
  possibleConditions: z
    .array(z.string())
    .describe('Possible medical conditions based on the symptoms.'),
  confidenceLevels: z
    .array(z.number())
    .describe('Confidence levels for each possible condition (0-1).'),
  explanation: z.string().describe('A brief explanation for each suggested condition.'),
});
export type VoiceSymptomCheckerOutput = z.infer<typeof VoiceSymptomCheckerOutputSchema>;

export async function voiceSymptomChecker(input: VoiceSymptomCheckerInput): Promise<VoiceSymptomCheckerOutput> {
  return voiceSymptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceSymptomCheckerPrompt',
  input: {schema: VoiceSymptomCheckerInputSchema},
  output: {schema: VoiceSymptomCheckerOutputSchema},
  prompt: `You are an AI-powered symptom checker that suggests possible medical conditions based on a patient's description of their symptoms.

  The patient describes their symptoms in their preferred language. Identify possible conditions and provide confidence levels and brief explanations for each.

  Symptoms: {{{symptoms}}}
  Language: {{{language}}}

  Format your response as a JSON object with the following keys:
  - possibleConditions: An array of possible medical conditions.
  - confidenceLevels: An array of confidence levels (0-1) for each condition.
  - explanation: A brief explanation for each suggested condition.
  `,
});

const voiceSymptomCheckerFlow = ai.defineFlow(
  {
    name: 'voiceSymptomCheckerFlow',
    inputSchema: VoiceSymptomCheckerInputSchema,
    outputSchema: VoiceSymptomCheckerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
