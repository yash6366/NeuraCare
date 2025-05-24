
'use server';
/**
 * @fileOverview A voice-enabled symptom checker AI agent that suggests possible conditions
 * and provides allopathic, Ayurvedic, and home remedy suggestions.
 *
 * - voiceSymptomChecker - A function that handles the symptom checking process.
 * - VoiceSymptomCheckerInput - The input type for the voiceSymptomChecker function.
 * - VoiceSymptomCheckerOutput - The return type for the voiceSymptomChecker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceSymptomCheckerInputSchema = z.object({
  symptoms: z
    .string()
    .describe('The symptoms described by the patient in their preferred language.'),
  language: z.string().optional().describe('The language of the symptoms description (e.g., "English", "Hindi").'),
});
export type VoiceSymptomCheckerInput = z.infer<typeof VoiceSymptomCheckerInputSchema>;

const SuggestedConditionSchema = z.object({
  conditionName: z.string().describe('The name of the possible medical condition.'),
  confidence: z.number().min(0).max(1).describe('The confidence level for this condition (0-1).'),
  explanation: z.string().describe('A brief explanation of the condition and why it might be relevant based on the symptoms. This should be in the specified language.'),
  allopathicSuggestions: z.array(z.string()).optional().describe('Suggested allopathic (modern medicine) approaches or advice. These are general suggestions, not prescriptions. Provide in the specified language.'),
  ayurvedicSuggestions: z.array(z.string()).optional().describe('Suggested Ayurvedic remedies or lifestyle advice. These are general suggestions, not prescriptions. Provide in the specified language.'),
  homeRemedies: z.array(z.string()).optional().describe('Suggested home remedies or self-care tips. These are general suggestions, not medical advice. Provide in the specified language.'),
});

const VoiceSymptomCheckerOutputSchema = z.object({
  analysis: z.array(SuggestedConditionSchema).describe('An array of possible medical conditions with explanations and suggestions.'),
  disclaimer: z.string().describe('A general disclaimer that this is not medical advice and a professional should be consulted. This should be in the specified language.'),
});
export type VoiceSymptomCheckerOutput = z.infer<typeof VoiceSymptomCheckerOutputSchema>;

export async function voiceSymptomChecker(input: VoiceSymptomCheckerInput): Promise<VoiceSymptomCheckerOutput> {
  return voiceSymptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceSymptomCheckerPrompt',
  input: {schema: VoiceSymptomCheckerInputSchema},
  output: {schema: VoiceSymptomCheckerOutputSchema},
  prompt: (input) => `You are an AI-powered symptom checker. Your goal is to analyze the described symptoms and provide potential insights, including possible conditions and general suggestions for management.
You MUST respond in the language specified: ${input.language || 'English'}.

The patient describes their symptoms as: "{{{symptoms}}}"
The patient's preferred language for response is: {{#if language}}{{{language}}}{{else}}English{{/if}}.

Based on these symptoms, please provide the following:
1.  An array named 'analysis' where each element represents a possible medical condition. Each element should be an object with the following fields:
    *   'conditionName': The name of the possible medical condition.
    *   'confidence': A numerical confidence score between 0.0 and 1.0 for this condition.
    *   'explanation': A brief explanation of the condition and why it might be relevant based on the symptoms.
    *   'allopathicSuggestions': An array of strings with general allopathic (modern medicine) suggestions or advice. Do NOT prescribe specific medications or dosages. Focus on general approaches, types of treatments, or when to see a doctor.
    *   'ayurvedicSuggestions': An array of strings with general Ayurvedic remedies or lifestyle advice.
    *   'homeRemedies': An array of strings with common home remedies or self-care tips.
2.  A 'disclaimer' string: This should be a clear statement emphasizing that this information is not a medical diagnosis, not a substitute for professional medical advice, and that the user should consult a qualified healthcare professional for any health concerns or before making any decisions related to their health.

When providing suggestions (allopathic, Ayurvedic, home remedies), ensure they are general and not prescriptive. For example, instead of "Take 500mg Paracetamol", suggest "Over-the-counter pain relievers may help with fever or pain."

Consider a wide range of possibilities, including common ailments.
Use information from modern medical knowledge, traditional Ayurvedic principles, and common home remedies where appropriate.
Structure your entire response as a single JSON object adhering to the defined output schema.
All text in your response, including condition names, explanations, suggestions, and the disclaimer, MUST be in the specified language: ${input.language || 'English'}.
`,
});

const voiceSymptomCheckerFlow = ai.defineFlow(
  {
    name: 'voiceSymptomCheckerFlow',
    inputSchema: VoiceSymptomCheckerInputSchema,
    outputSchema: VoiceSymptomCheckerOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);
    // console.log('[voiceSymptomCheckerFlow] Raw LLM Response:', JSON.stringify(llmResponse, null, 2)); // Optional: for debugging
    
    const output = llmResponse.output;

    if (!output || !output.analysis || !output.disclaimer) { // Check for a minimally valid output
      const lang = input.language || 'English';
      let errorDisclaimer = "";
      let errorConditionName = "";
      let errorExplanation = "";

      if (lang === 'hi-IN') {
        errorDisclaimer = "क्षमा करें, मुझे आपके लक्षणों का विश्लेषण करने में समस्या आ रही है। कृपया किसी स्वास्थ्य पेशेवर से सलाह लें। यह एक फॉलबैक प्रतिक्रिया है।";
        errorConditionName = "विश्लेषण में त्रुटि";
        errorExplanation = "AI लक्षणों को संसाधित नहीं कर सका। यह API समस्या या जटिल इनपुट के कारण हो सकता है। कृपया पुनः प्रयास करें या वाक्यांश बदलें।";
      } else {
        errorDisclaimer = "Sorry, I encountered an issue analyzing your symptoms. Please consult a healthcare professional. This is a fallback response indicating the AI could not process the request.";
        errorConditionName = "Error in Analysis";
        errorExplanation = "The AI could not process the symptoms. This might be due to an API issue, complex input, or the model not returning the expected structure. Please try again or rephrase.";
      }
      
      console.warn(`[voiceSymptomCheckerFlow] Fallback triggered for language: ${lang}. Input symptoms: ${input.symptoms}. LLM output was: ${JSON.stringify(llmResponse.output, null, 2)}`);

      return {
        analysis: [{
            conditionName: errorConditionName,
            confidence: 0,
            explanation: errorExplanation,
            allopathicSuggestions: [],
            ayurvedicSuggestions: [],
            homeRemedies: []
        }],
        disclaimer: errorDisclaimer,
      };
    }
    return output;
  }
);

