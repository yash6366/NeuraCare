
'use server';
/**
 * @fileOverview An AI flow for summarizing text content.
 *
 * - summarizeDocumentText - A function that takes text and returns its summary.
 * - SummarizeDocumentTextInput - The input type for the summarizeDocumentText function.
 * - SummarizeDocumentTextOutput - The return type for the summarizeDocumentText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDocumentTextInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content extracted from a document to be summarized.'),
  language: z.string().optional().default('English').describe('The language for the summary.'),
});
export type SummarizeDocumentTextInput = z.infer<typeof SummarizeDocumentTextInputSchema>;

const SummarizeDocumentTextOutputSchema = z.object({
  summary: z.string().describe('The generated summary of the document text.'),
});
export type SummarizeDocumentTextOutput = z.infer<typeof SummarizeDocumentTextOutputSchema>;

export async function summarizeDocumentText(input: SummarizeDocumentTextInput): Promise<SummarizeDocumentTextOutput> {
  return documentSummarizationFlow(input);
}

const documentSummarizationPrompt = ai.definePrompt({
  name: 'documentSummarizationPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Reverted to Flash
  input: {schema: SummarizeDocumentTextInputSchema},
  output: {schema: SummarizeDocumentTextOutputSchema},
  prompt: (input) => `Please provide a concise summary of the following text. The summary should be in ${input.language || 'English'}.

Document Text:
"""
${input.documentText}
"""

Summary:
`,
  config: {
    temperature: 0.5, 
  }
});

const documentSummarizationFlow = ai.defineFlow(
  {
    name: 'documentSummarizationFlow',
    inputSchema: SummarizeDocumentTextInputSchema,
    outputSchema: SummarizeDocumentTextOutputSchema,
  },
  async (input) => {
    console.log(`[documentSummarizationFlow] Received input: ${JSON.stringify({ language: input.language, documentTextLength: input.documentText.length }, null, 2)}`);
    try {
      const llmResponse = await documentSummarizationPrompt(input);
      const responseText = llmResponse.output?.summary;
      
      if (!responseText || responseText.trim() === "") {
        console.warn(`[documentSummarizationFlow] LLM response for summary was empty. Input language: ${input.language}. Raw LLM response: ${llmResponse.text}`);
        const defaultErrorMessage = input.language === 'hi-IN' ?
          "मुझे क्षमा करें, मैं पाठ का सारांश नहीं बना सका।" :
          "I'm sorry, I couldn't generate a summary for the text.";
        return { summary: defaultErrorMessage };
      }
      console.log('[documentSummarizationFlow] LLM text summarization success.');
      return { summary: responseText };
    } catch (error: any) {
      console.error('[documentSummarizationFlow] Error during text summarization:', error.message);
      if (error.cause) {
        console.error('[documentSummarizationFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) { 
        console.error('[documentSummarizationFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[documentSummarizationFlow] Error Stack:', error.stack);
      }
      const defaultErrorMessage = input.language === 'hi-IN' ?
        "मुझे क्षमा करें, पाठ का सारांश बनाते समय एक तकनीकी समस्या हुई।" :
        "I'm sorry, a technical error occurred during text summarization.";
      return { summary: defaultErrorMessage };
    }
  }
);
