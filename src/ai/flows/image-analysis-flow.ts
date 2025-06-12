
'use server';
/**
 * @fileOverview An AI flow for analyzing images.
 *
 * - analyzeImage - A function that takes an image and an optional query, returning a description.
 * - AnalyzeImageInput - The input type for the analyzeImage function.
 * - AnalyzeImageOutput - The return type for the analyzeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  query: z.string().optional().describe('An optional question or prompt about the image.'),
  language: z.string().optional().default('English').describe('The language for the response.'),
});
export type AnalyzeImageInput = z.infer<typeof AnalyzeImageInputSchema>;

const AnalyzeImageOutputSchema = z.object({
  description: z.string().describe('The AI\'s description or answer related to the image.'),
});
export type AnalyzeImageOutput = z.infer<typeof AnalyzeImageOutputSchema>;

export async function analyzeImage(input: AnalyzeImageInput): Promise<AnalyzeImageOutput> {
  return imageAnalysisFlow(input);
}

const imageAnalysisPrompt = ai.definePrompt({
  name: 'imageAnalysisPrompt',
  input: {schema: AnalyzeImageInputSchema},
  output: {schema: AnalyzeImageOutputSchema},
  prompt: (input) => {
    let promptText = "";
    if (input.query) {
      promptText = `Based on the following image and the query: "${input.query}", provide a detailed answer in ${input.language || 'English'}.`;
    } else {
      promptText = `Describe the following image in detail in ${input.language || 'English'}.`;
    }
    return [
      {media: {url: input.imageDataUri}},
      {text: promptText},
    ];
  },
  config: {
    temperature: 0.6,
  }
});

const imageAnalysisFlow = ai.defineFlow(
  {
    name: 'imageAnalysisFlow',
    inputSchema: AnalyzeImageInputSchema,
    outputSchema: AnalyzeImageOutputSchema,
  },
  async (input) => {
    console.log(`[imageAnalysisFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    try {
      const llmResponse = await imageAnalysisPrompt(input);
      const responseText = llmResponse.output?.description;
      
      if (!responseText || responseText.trim() === "") {
        console.warn(`[imageAnalysisFlow] LLM response text for image analysis was empty. Input language: ${input.language}. Raw LLM response: ${llmResponse.text}`);
        const defaultErrorMessage = input.language === 'hi-IN' ?
          "मुझे क्षमा करें, मैं छवि का विश्लेषण नहीं कर सका।" :
          "I'm sorry, I couldn't analyze the image.";
        return { description: defaultErrorMessage };
      }
      console.log('[imageAnalysisFlow] LLM image analysis success.');
      return { description: responseText };
    } catch (error) {
      console.error('[imageAnalysisFlow] Error during image analysis:', error);
      const defaultErrorMessage = input.language === 'hi-IN' ?
        "मुझे क्षमा करें, छवि विश्लेषण के दौरान एक तकनीकी समस्या हुई है।" :
        "I'm sorry, a technical error occurred during image analysis.";
      return { description: defaultErrorMessage };
    }
  }
);

