
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
  language: z.string().optional().describe('The language of the symptoms description (e.g., "English", "Hindi").'),
});
export type VoiceSymptomCheckerInput = z.infer<typeof VoiceSymptomCheckerInputSchema>;

const SuggestedConditionSchema = z.object({
  conditionName: z.string().describe('The name of the possible medical condition, or a general category like "General Symptom Review: [Symptom]" if symptoms are too vague for specific conditions.'),
  confidence: z.number().min(0).max(1).describe('The confidence level for this condition (0-1). If general review, confidence can be moderate (e.g., 0.5).'),
  explanation: z.string().describe('A detailed explanation. If a specific condition, explain why it might be relevant based on symptoms. If a general review, discuss common causes, lifestyle factors, or when to see a doctor for the described symptoms. This should be in the specified language.'),
  allopathicSuggestions: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable allopathic (modern medicine) suggestions or advice. These are general suggestions, not prescriptions. Focus on general approaches, types of treatments, or when to see a doctor. Provide in the specified language.'),
  ayurvedicSuggestions: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable Ayurvedic remedies or lifestyle advice. These are general suggestions, not prescriptions. Provide in the specified language.'),
  homeRemedies: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable common home remedies or self-care tips. These are general suggestions, not medical advice. Provide in the specified language.'),
});

const VoiceSymptomCheckerOutputSchema = z.object({
  analysis: z.array(SuggestedConditionSchema).describe('An array of possible medical conditions or general symptom reviews with detailed explanations and diverse suggestions. This array should ideally contain at least one entry, even for general symptoms.'),
  disclaimer: z.string().describe('A general disclaimer that this is not medical advice and a professional should be consulted. This should be in the specified language.'),
});
export type VoiceSymptomCheckerOutput = z.infer<typeof VoiceSymptomCheckerOutputSchema>;

export async function voiceSymptomChecker(input: VoiceSymptomCheckerInput): Promise<VoiceSymptomCheckerOutput> {
  return voiceSymptomCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceSymptomCheckerPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: VoiceSymptomCheckerInputSchema},
  output: {schema: VoiceSymptomCheckerOutputSchema},
  prompt: (input) => `You are an AI-powered symptom checker. Your goal is to analyze the described symptoms and provide potential insights, including possible conditions and comprehensive, actionable suggestions for management.
You MUST respond in the language specified: ${input.language || 'English'}.

The patient describes their symptoms as: "{{{symptoms}}}"

Carefully analyze ONLY these specific symptoms. Based SOLELY on these symptoms, provide the following:
1.  An array named 'analysis' where each element represents a possible medical insight. Each element should be an object with the fields defined in the output schema.
    *   If the provided symptoms clearly suggest specific medical conditions, list them. The 'conditionName' should be the medical condition.
    *   If the symptoms are very general (e.g., 'hair fall', 'mild fatigue', 'occasional headache') and do not strongly indicate a specific medical condition, then for the 'conditionName', use a general category like "General Symptom Review: [Main Symptom, e.g., Hair Fall]". The 'explanation' should then discuss common non-serious causes, relevant lifestyle factors, and general advice on when to see a doctor for the described general symptom(s). Confidence for such general reviews can be moderate (e.g., 0.5).
    *   For ALL entries in the 'analysis' array (whether specific conditions or general reviews), aim to provide 2-3 distinct and actionable suggestions for each of these categories if appropriate: 'allopathicSuggestions', 'ayurvedicSuggestions', and 'homeRemedies'. These are general suggestions, not prescriptions. If suggestions for a category are not relevant or readily available, an empty array is acceptable.
2.  A 'disclaimer' string: This should be a clear statement emphasizing that this information is not a medical diagnosis, not a substitute for professional medical advice, and that the user should consult a qualified healthcare professional for any health concerns or before making any decisions related to their health. This disclaimer is mandatory.

When providing suggestions, ensure they are general, actionable, and not prescriptive. For example, instead of "Take 500mg Paracetamol", suggest "Over-the-counter pain relievers may help. Consider consulting a pharmacist."

Strive for accuracy and relevance based strictly on the input symptoms.
All text in your response, including condition names, explanations, suggestions, and the disclaimer, MUST be in the specified language: ${input.language || 'English'}.
Structure your entire response as a single JSON object adhering to the defined output schema.
`,
  config: {
    temperature: 0.5, 
  },
});

const voiceSymptomCheckerFlow = ai.defineFlow(
  {
    name: 'voiceSymptomCheckerFlow',
    inputSchema: VoiceSymptomCheckerInputSchema,
    outputSchema: VoiceSymptomCheckerOutputSchema,
  },
  async (input) => {
    const llmResponse = await prompt(input);    
    const output = llmResponse.output;

    if (!output || !output.disclaimer) { 
      const lang = input.language || 'English';
      let errorDisclaimer = "";
      let errorConditionName = ""; 
      let errorExplanation = ""; 

      if (lang === 'hi-IN') {
        errorDisclaimer = "क्षमा करें, AI आपके लक्षणों का ठीक से विश्लेषण नहीं कर सका। कृपया किसी स्वास्थ्य पेशेवर से सलाह लें। यह एक फॉलबैक (त्रुटि) प्रतिक्रिया है।";
        errorConditionName = "AI प्रसंस्करण त्रुटि";
        errorExplanation = "AI दिए गए लक्षणों को संसाधित नहीं कर सका या अपेक्षित संरचित प्रतिक्रिया नहीं दे सका। यह एक API समस्या या अप्रत्याश этих AI आउटपुट के कारण हो सकता है। कृपया पुनः प्रयास करें या अपने लक्षणों को स्पष्ट करें।";
      } else {
        errorDisclaimer = "Sorry, the AI could not properly analyze your symptoms. Please consult a healthcare professional. This is a fallback (error) response.";
        errorConditionName = "AI Processing Error";
        errorExplanation = "The AI could not process the provided symptoms or did not return the expected structured response. This might be due to an API issue or an unexpected AI output. Please try again or clarify your symptoms.";
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
    
    // Log if the analysis array is empty but the response is otherwise valid
    if (output.analysis && output.analysis.length === 0) {
        console.log(`[voiceSymptomCheckerFlow] AI returned a valid response with a disclaimer but an empty analysis array for symptoms: "${input.symptoms}" in language: ${input.language || 'English'}. LLM response text: ${llmResponse.text}. Parsed LLM output: ${JSON.stringify(output, null, 2)}`);
    }
    return output;
  }
);


