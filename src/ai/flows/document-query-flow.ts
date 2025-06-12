
'use server';
/**
 * @fileOverview An AI flow for answering questions based on document text.
 *
 * - queryDocumentText - A function that takes document text and a query, returning an answer.
 * - QueryDocumentTextInput - The input type for the queryDocumentText function.
 * - QueryDocumentTextOutput - The return type for the queryDocumentText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QueryDocumentTextInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content extracted from a document.'),
  userQuery: z.string().describe('The user\'s question about the document text.'),
  language: z.string().optional().default('English').describe('The language for the answer.'),
});
export type QueryDocumentTextInput = z.infer<typeof QueryDocumentTextInputSchema>;

const QueryDocumentTextOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s query based on the document text.'),
});
export type QueryDocumentTextOutput = z.infer<typeof QueryDocumentTextOutputSchema>;

export async function queryDocumentText(input: QueryDocumentTextInput): Promise<QueryDocumentTextOutput> {
  return documentQueryFlow(input);
}

const documentQueryPrompt = ai.definePrompt({
  name: 'documentQueryPrompt',
  input: {schema: QueryDocumentTextInputSchema},
  output: {schema: QueryDocumentTextOutputSchema},
  prompt: (input) => `You are a helpful AI assistant. Your task is to answer the user's question based *only* on the provided document text.
Do not use any external knowledge or information not present in the document text.
If the answer cannot be found in the document text, explicitly state that the information is not available in the provided text.
Respond in the following language: ${input.language || 'English'}.

Document Text:
"""
${input.documentText}
"""

User's Question: "${input.userQuery}"

Answer:
`,
  config: {
    temperature: 0.3, // Lower temperature for more factual, less creative answers from the text
  }
});

const documentQueryFlow = ai.defineFlow(
  {
    name: 'documentQueryFlow',
    inputSchema: QueryDocumentTextInputSchema,
    outputSchema: QueryDocumentTextOutputSchema,
  },
  async (input) => {
    console.log(`[documentQueryFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    try {
      const llmResponse = await documentQueryPrompt(input);
      const responseText = llmResponse.output?.answer;
      
      if (!responseText || responseText.trim() === "") {
        console.warn(`[documentQueryFlow] LLM response for document query was empty. Input language: ${input.language}. Raw LLM response: ${llmResponse.text}`);
        const defaultErrorMessage = input.language === 'hi-IN' ?
          "मुझे क्षमा करें, मैं आपके प्रश्न का उत्तर दस्तावेज़ में नहीं ढूँढ़ सका।" :
          "I'm sorry, I couldn't find an answer to your query in the document.";
        return { answer: defaultErrorMessage };
      }
      console.log('[documentQueryFlow] LLM document query success.');
      return { answer: responseText };
    } catch (error: any) {
      console.error('[documentQueryFlow] Error during document query:', error.message);
      if (error.cause) {
        console.error('[documentQueryFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) { 
        console.error('[documentQueryFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[documentQueryFlow] Error Stack:', error.stack);
      }
      const defaultErrorMessage = input.language === 'hi-IN' ?
        "मुझे क्षमा करें, दस्तावेज़ से प्रश्न का उत्तर देते समय एक तकनीकी समस्या हुई।" :
        "I'm sorry, a technical error occurred while answering the query from the document.";
      return { answer: defaultErrorMessage };
    }
  }
);

