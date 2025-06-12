
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
  answer: z.string().describe('The AI-generated answer to the user\'s health query.'),
  disclaimer: z.string().describe('A standard disclaimer stating this is not medical advice.'),
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

Provide an informative answer to this question in ${input.language || 'English'}.

After the answer, you MUST include the following standard disclaimer, also in ${input.language || 'English'}:
"This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health."
`,
  config: {
    temperature: 0.6, // Slightly more creative/informative than pure factual, but still grounded.
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
    try {
      const llmResponse = await healthInfoQueryPrompt(input);
      const output = llmResponse.output;

      if (!output || !output.answer || !output.disclaimer) {
        console.warn(`[healthInfoQueryFlow] LLM response was missing answer or disclaimer. Input language: ${input.language}. Raw LLM response: ${llmResponse.text}`);
        const defaultErrorMessage = input.language === 'hi-IN' ?
          "मुझे क्षमा करें, मैं आपके प्रश्न का उत्तर नहीं दे सका या अपेक्षित प्रारूप में जानकारी प्रदान नहीं कर सका।" :
          "I'm sorry, I couldn't answer your query or provide information in the expected format.";
        const defaultDisclaimer = input.language === 'hi-IN' ?
          "यह जानकारी केवल सामान्य ज्ञान और सूचना के उद्देश्यों के लिए है, और चिकित्सा सलाह का गठन नहीं करती है। किसी भी स्वास्थ्य चिंता या अपने स्वास्थ्य से संबंधित कोई भी निर्णय लेने से पहले एक योग्य स्वास्थ्य देखभाल पेशेवर से परामर्श करना आवश्यक है।" :
          "This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health.";
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
      const defaultErrorMessage = input.language === 'hi-IN' ?
        "मुझे क्षमा करें, आपके स्वास्थ्य प्रश्न का उत्तर देते समय एक तकनीकी समस्या हुई।" :
        "I'm sorry, a technical error occurred while answering your health query.";
      const defaultDisclaimer = input.language === 'hi-IN' ?
        "यह जानकारी केवल सामान्य ज्ञान और सूचना के उद्देश्यों के लिए है, और चिकित्सा सलाह का गठन नहीं करती है। किसी भी स्वास्थ्य चिंता या अपने स्वास्थ्य से संबंधित कोई भी निर्णय लेने से पहले एक योग्य स्वास्थ्य देखभाल पेशेवर से परामर्श करना आवश्यक है।" :
        "This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health.";
      return { answer: defaultErrorMessage, disclaimer: defaultDisclaimer };
    }
  }
);
