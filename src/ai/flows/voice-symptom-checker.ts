
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
    .describe('The symptoms described by the patient in their preferred language. This may include severity, duration, and co-occurring symptoms.'),
  language: z.string().optional().describe('The language of the symptoms description (e.g., "English", "Hindi"). Default is "English".'),
});
export type VoiceSymptomCheckerInput = z.infer<typeof VoiceSymptomCheckerInputSchema>;

const SuggestedConditionSchema = z.object({
  conditionName: z.string().describe('The name of the possible medical condition, or a general category like "General Symptom Review: [Symptom]" if symptoms are too vague for specific conditions. Must be in the specified language.'),
  confidence: z.number().min(0).max(1).describe('The confidence level for this condition (0-1). If general review, confidence can be moderate (e.g., 0.5).'),
  explanation: z.string().describe('A detailed explanation. If a specific condition, explain why it might be relevant based on symptoms. If a general review, discuss common causes, lifestyle factors, or when to see a doctor for the described symptoms. This should be in the specified language.'),
  allopathicSuggestions: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable allopathic (modern medicine) suggestions or advice. These are general suggestions, not prescriptions. Focus on general approaches, types of treatments, or when to see a doctor. Provide in the specified language. If not applicable, return an empty array.'),
  ayurvedicSuggestions: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable Ayurvedic remedies or lifestyle advice. These are general suggestions, not prescriptions. Provide in the specified language. If not applicable, return an empty array.'),
  homeRemedies: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable common home remedies or self-care tips. These are general suggestions, not medical advice. Provide in the specified language. If not applicable, return an empty array.'),
});

const VoiceSymptomCheckerOutputSchema = z.object({
  analysis: z.array(SuggestedConditionSchema).describe('An array of possible medical insights. This array should ideally contain at least one entry, even for general symptoms (as "General Symptom Review"). All text in the analysis objects must be in the specified language.'),
  disclaimer: z.string().describe('A mandatory general disclaimer that this is not medical advice and a professional should be consulted. This should be in the specified language.'),
});
export type VoiceSymptomCheckerOutput = z.infer<typeof VoiceSymptomCheckerOutputSchema>;

export async function voiceSymptomChecker(input: VoiceSymptomCheckerInput): Promise<VoiceSymptomCheckerOutput> {
  return voiceSymptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceSymptomCheckerPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly using a capable model
  input: {schema: VoiceSymptomCheckerInputSchema},
  output: {schema: VoiceSymptomCheckerOutputSchema},
  prompt: (input) => `You are an AI-powered symptom checker. Your goal is to analyze the described symptoms and provide potential insights, including possible conditions and comprehensive, actionable suggestions for management.
You MUST respond in the language specified: ${input.language || 'English'}.

The patient describes their symptoms as: "{{{symptoms}}}"

Carefully analyze ONLY these specific symptoms. Based SOLELY on these symptoms, provide the following:
1.  An array named 'analysis' where each element represents a possible medical insight. Each element must be an object adhering to the 'SuggestedConditionSchema'.
    *   If the provided symptoms clearly suggest specific medical conditions, list them. The 'conditionName' should be the medical condition. The explanation must detail why symptoms link to it.
    *   If the symptoms are very general (e.g., 'hair fall', 'mild fatigue', 'occasional headache') and do not strongly indicate a specific medical condition, then for the 'conditionName', use a general category like "General Symptom Review: [The User's Main Symptom(s)]". For example, if the user says "I feel tired", use "General Symptom Review: Feeling Tired". The 'explanation' for this general review *must be specific to the user's described general symptom(s)*, discussing common non-serious causes, relevant lifestyle factors for *that symptom*, and general advice on when to see a doctor for *that symptom*. Do not use boilerplate explanations. Confidence for such general reviews can be moderate (e.g., 0.5).
    *   Ensure the 'analysis' array contains at least one entry. If no specific conditions are found, it MUST contain a "General Symptom Review" entry.
    *   For ALL entries in the 'analysis' array, provide 2-3 distinct and actionable suggestions for each of these categories if appropriate: 'allopathicSuggestions', 'ayurvedicSuggestions', and 'homeRemedies'. These are general suggestions, not prescriptions. If suggestions for a category are not relevant or readily available, an empty array [] is the correct response for that suggestion field. Do not omit the field.
2.  A 'disclaimer' string: This must be a clear statement emphasizing that this information is not a medical diagnosis, not a substitute for professional medical advice, and that the user should consult a qualified healthcare professional for any health concerns or before making any decisions related to their health. This disclaimer is mandatory and must be in the specified language.

When providing suggestions, ensure they are general, actionable, and not prescriptive. For example, instead of "Take 500mg Paracetamol", suggest "Over-the-counter pain relievers may help. Consider consulting a pharmacist."

Strive for accuracy and relevance based strictly on the input symptoms.
All text in your response, including condition names, explanations, suggestions, and the disclaimer, MUST be in the specified language: ${input.language || 'English'}.
Structure your entire response as a single JSON object adhering to the defined output schema.
`,
  config: {
    temperature: 0.5, // Moderate temperature for a balance of creativity and consistency
  },
});

const voiceSymptomCheckerFlow = ai.defineFlow(
  {
    name: 'voiceSymptomCheckerFlow',
    inputSchema: VoiceSymptomCheckerInputSchema,
    outputSchema: VoiceSymptomCheckerOutputSchema,
  },
  async (input) => {
    console.log(`[voiceSymptomCheckerFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    let llmResponse;
    try {
      llmResponse = await prompt(input);
    } catch (error: any) {
      console.error('[voiceSymptomCheckerFlow] Error calling LLM prompt:', error.message);
      if (error.cause) {
        console.error('[voiceSymptomCheckerFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) { 
        console.error('[voiceSymptomCheckerFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[voiceSymptomCheckerFlow] Error Stack:', error.stack);
      }
      const lang = input.language || 'English';
      let errorDisclaimer = "";
      let errorConditionName = "";
      let errorExplanation = "";

      if (lang === 'hi-IN') {
        errorDisclaimer = "क्षमा करें, AI आपके लक्षणों का ठीक से विश्लेषण नहीं कर सका। कृपया किसी स्वास्थ्य पेशेवर से सलाह लें। यह एक API त्रुटि प्रतिक्रिया है।";
        errorConditionName = "AI API त्रुटि";
        errorExplanation = `AI से संवाद करते समय एक त्रुटि हुई: ${(error as Error).message}. कृपया पुनः प्रयास करें या अपने लक्षणों को स्पष्ट करें।`;
      } else {
        errorDisclaimer = "Sorry, the AI could not properly analyze your symptoms. Please consult a healthcare professional. This is an API error response.";
        errorConditionName = "AI API Error";
        errorExplanation = `An error occurred while communicating with the AI: ${(error as Error).message}. Please try again or clarify your symptoms.`;
      }
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
    
    const output = llmResponse.output;

    if (!output || !output.disclaimer) { 
      const lang = input.language || 'English';
      let errorDisclaimer = "";
      let errorConditionName = ""; 
      let errorExplanation = ""; 

      if (lang === 'hi-IN') {
        errorDisclaimer = "क्षमा करें, AI आपके लक्षणों का ठीक से विश्लेषण नहीं कर सका। कृपया किसी स्वास्थ्य पेशेवर से सलाह लें। यह एक पार्सING (त्रुटि) प्रतिक्रिया है।";
        errorConditionName = "AI प्रतिसाद पार्सिंग त्रुटि";
        errorExplanation = "AI ने अपेक्षित संरचित प्रतिक्रिया नहीं दी या प्रतिक्रिया अधूरी थी। यह एक API समस्या या अप्रत्याशित AI आउटपुट के कारण हो सकता है। कृपया पुनः प्रयास करें या अपने लक्षणों को स्पष्ट करें।";
      } else {
        errorDisclaimer = "Sorry, the AI could not properly analyze your symptoms. Please consult a healthcare professional. This is a parsing (error) response.";
        errorConditionName = "AI Response Parsing Error";
        errorExplanation = "The AI did not return the expected structured response or the response was incomplete. This might be due to an API issue or an unexpected AI output. Please try again or clarify your symptoms.";
      }
      
      console.warn(`[voiceSymptomCheckerFlow] Fallback triggered due to missing output or disclaimer. Language: ${lang}. Input symptoms: "${input.symptoms}". Raw LLM response text: ${llmResponse.text}. Parsed LLM output object: ${JSON.stringify(llmResponse.output, null, 2)}`);

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
    
    if (output.analysis && output.analysis.length === 0) {
        console.log(`[voiceSymptomCheckerFlow] AI returned a valid response with a disclaimer but an empty analysis array for symptoms: "${input.symptoms}" in language: ${input.language || 'English'}. LLM response text: ${llmResponse.text}. Parsed LLM output: ${JSON.stringify(output, null, 2)}`);
        // Even if analysis is empty, if disclaimer is present, it's a valid response from the AI.
        // The UI should handle displaying this gracefully (e.g., "No specific conditions identified...").
    }
    console.log(`[voiceSymptomCheckerFlow] Successfully processed symptoms: "${input.symptoms}". Analysis items: ${output.analysis?.length || 0}.`);
    return output;
  }
);

