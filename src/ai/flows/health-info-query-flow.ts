
'use server';
/**
 * @fileOverview An AI flow for answering general health information queries.
 *
 * - queryHealthInformation - A function that takes a user's question and language, returning an answer and disclaimer.
 * - HealthInfoQueryInput - The input type for the queryHealthInformation function.
 * - HealthInfoQueryOutput - The return type for the queryHealthInformation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HealthInfoQueryInputSchema = z.object({
  userQuery: z.string().describe("The user's health-related question."),
  language: z.string().optional().default('English').describe('The language for the answer and disclaimer.'),
});
export type HealthInfoQueryInput = z.infer<typeof HealthInfoQueryInputSchema>;

const HealthInfoQueryOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s health query in the specified language.'),
  disclaimer: z.string().describe('A standard disclaimer stating this is not medical advice, in the specified language.'),
});
export type HealthInfoQueryOutput = z.infer<typeof HealthInfoQueryOutputSchema>;

export async function queryHealthInformation(input: HealthInfoQueryInput): Promise<HealthInfoQueryOutput> {
  return healthInfoQueryFlow(input);
}

const healthInfoQueryPrompt = ai.definePrompt({
  name: 'healthInfoQueryPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: HealthInfoQueryInputSchema},
  output: {schema: HealthInfoQueryOutputSchema},
  prompt: (input) => `You are a helpful AI assistant providing general health information.
Your role is to answer health-related questions clearly and concisely based on general knowledge.
You MUST NOT provide medical advice, diagnoses, or treatment plans.
Always prioritize safety and direct users to consult with qualified healthcare professionals for personal medical concerns.

User's Question (in ${input.language || 'English'}): "${input.userQuery}"

Respond in the following JSON format. Ensure your entire response is a single, valid JSON object.
All text in the JSON values (answer and disclaimer) must be in ${input.language || 'English'}.

Example JSON format:
{
  "answer": "[Your informative answer to the question, in ${input.language || 'English'}]",
  "disclaimer": "[The standard disclaimer, in ${input.language || 'English'}: 'This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health.']"
}
`,
  config: {
    temperature: 0.5, // Balanced temperature for informative yet grounded responses
  }
});

const healthInfoQueryFlow = ai.defineFlow(
  {
    name: 'healthInfoQueryFlow',
    inputSchema: HealthInfoQueryInputSchema,
    outputSchema: HealthInfoQueryOutputSchema,
  },
  async (input) => {
    console.log(`[healthInfoQueryFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    const currentLanguage = input.language || 'English';
    let defaultErrorMessage = currentLanguage === 'hi-IN' ?
      "मुझे क्षमा करें, मैं आपके प्रश्न का उत्तर नहीं दे सका या अपेक्षित प्रारूप में जानकारी प्रदान नहीं कर सका।" :
      "I'm sorry, I couldn't answer your query or provide information in the expected format.";
    let defaultDisclaimer = currentLanguage === 'hi-IN' ?
      "यह जानकारी केवल सामान्य ज्ञान और सूचना के उद्देश्यों के लिए है, और चिकित्सा सलाह का गठन नहीं करती है। किसी भी स्वास्थ्य चिंता या अपने स्वास्थ्य से संबंधित कोई भी निर्णय लेने से पहले एक योग्य स्वास्थ्य देखभाल पेशेवर से परामर्श करना आवश्यक है।" :
      "This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health.";

    try {
      const llmResponse = await healthInfoQueryPrompt(input);
      const output = llmResponse.output;

      if (!output || !output.answer || output.answer.trim() === "" || !output.disclaimer || output.disclaimer.trim() === "") {
        console.warn(`[healthInfoQueryFlow] LLM response was missing answer or disclaimer, or they were empty. Input language: ${currentLanguage}. Raw LLM response text: ${llmResponse.text}. Parsed output: ${JSON.stringify(output, null, 2)}`);
        // Attempt to use raw text if structured output failed but text exists. This is a fallback.
        if (llmResponse.text && llmResponse.text.trim() !== "") {
            const rawText = llmResponse.text.trim();
            // Basic check if it looks like our JSON, otherwise just use it as answer.
            if (rawText.includes('"answer":') && rawText.includes('"disclaimer":')) {
                 try {
                    const parsedRaw = JSON.parse(rawText);
                    if (parsedRaw.answer && parsedRaw.disclaimer) {
                        console.log('[healthInfoQueryFlow] Successfully parsed raw LLM text as fallback.');
                        return { answer: parsedRaw.answer, disclaimer: parsedRaw.disclaimer };
                    }
                 } catch (parseError) {
                    console.warn('[healthInfoQueryFlow] Could not parse raw LLM text as JSON fallback:', parseError);
                 }
            }
            // If not parsable as JSON or doesn't look like it, return raw text as answer with default disclaimer.
            console.warn('[healthInfoQueryFlow] Using raw LLM text as answer due to failed structured output.');
            return { answer: rawText, disclaimer: defaultDisclaimer };
        }
        return { answer: defaultErrorMessage, disclaimer: defaultDisclaimer };
      }
      console.log('[healthInfoQueryFlow] Health information query success.');
      return output;
    } catch (error: any) {
      console.error('[healthInfoQueryFlow] Error during health information query:', error.message);
      if (error.cause) {
        console.error('[healthInfoQueryFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) {
        console.error('[healthInfoQueryFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[healthInfoQueryFlow] Error Stack:', error.stack);
      }
      
      defaultErrorMessage = currentLanguage === 'hi-IN' ?
        "मुझे क्षमा करें, आपके स्वास्थ्य प्रश्न का उत्तर देते समय एक तकनीकी समस्या हुई।" :
        "I'm sorry, a technical error occurred while answering your health query.";
      return { answer: defaultErrorMessage, disclaimer: defaultDisclaimer };
    }
  }
);
