
'use server';
/**
 * @fileOverview An AI flow for extracting text from PDF documents.
 *
 * - extractTextFromDocument - A function that takes a PDF and returns its text content.
 * - ExtractTextFromDocumentInput - The input type for the extractTextFromDocument function.
 * - ExtractTextFromDocumentOutput - The return type for the extractTextFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromDocumentInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document to analyze, as a data URI that must include a MIME type (application/pdf) and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  language: z.string().optional().default('English').describe('The language for the extracted text response.'),
});
export type ExtractTextFromDocumentInput = z.infer<typeof ExtractTextFromDocumentInputSchema>;

const ExtractTextFromDocumentOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text content from the PDF document.'),
});
export type ExtractTextFromDocumentOutput = z.infer<typeof ExtractTextFromDocumentOutputSchema>;

export async function extractTextFromDocument(input: ExtractTextFromDocumentInput): Promise<ExtractTextFromDocumentOutput> {
  return documentTextExtractionFlow(input);
}

const documentTextExtractionPrompt = ai.definePrompt({
  name: 'documentTextExtractionPrompt',
  input: {schema: ExtractTextFromDocumentInputSchema},
  output: {schema: ExtractTextFromDocumentOutputSchema},
  prompt: (input) => [
    {media: {url: input.pdfDataUri, mimeType: 'application/pdf'}}, // Ensure mimeType is specified for clarity
    {text: `Extract all text content from the provided PDF document. Respond with only the extracted text. Ensure the response is in ${input.language || 'English'}. If the document is empty or contains no extractable text, respond with "No text found in document.".`},
  ],
  config: {
    temperature: 0.2, // Lower temperature for more deterministic text extraction
  }
});

const documentTextExtractionFlow = ai.defineFlow(
  {
    name: 'documentTextExtractionFlow',
    inputSchema: ExtractTextFromDocumentInputSchema,
    outputSchema: ExtractTextFromDocumentOutputSchema,
  },
  async (input) => {
    console.log('[documentTextExtractionFlow] Received input for PDF text extraction.');
    try {
      const llmResponse = await documentTextExtractionPrompt(input);
      const responseText = llmResponse.output?.extractedText;
      
      if (!responseText || responseText.trim() === "" || responseText.trim().toLowerCase() === "no text found in document.") {
        console.warn('[documentTextExtractionFlow] LLM response text for PDF extraction was empty or indicated no text found. Input language:', input.language);
        const defaultErrorMessage = input.language === 'hi-IN' ?
          "मुझे क्षमा करें, मैं दस्तावेज़ से पाठ नहीं निकाल सका या दस्तावेज़ में कोई पाठ नहीं मिला।" :
          "I'm sorry, I couldn't extract text from the document or no text was found in the document.";
        return { extractedText: defaultErrorMessage };
      }
      console.log('[documentTextExtractionFlow] LLM PDF text extraction success.');
      return { extractedText: responseText };
    } catch (error) {
      console.error('[documentTextExtractionFlow] Error during PDF text extraction:', error);
      const defaultErrorMessage = input.language === 'hi-IN' ?
        "मुझे क्षमा करें, दस्तावेज़ से पाठ निकालते समय एक तकनीकी समस्या हुई।" :
        "I'm sorry, a technical error occurred during document text extraction.";
      return { extractedText: defaultErrorMessage };
    }
  }
);

