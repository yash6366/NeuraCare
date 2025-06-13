
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
  explanation: z.string().describe('A detailed explanation. If a specific condition, explain *how the provided user symptoms* link to it. If a general review, discuss common causes, lifestyle factors, or when to see a doctor for the *user\'s described general symptoms*. This should be in the specified language.'),
  allopathicSuggestions: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable allopathic (modern medicine) suggestions or advice *relevant to the condition or general symptom*. These are general suggestions, not prescriptions. Provide in the specified language. If not applicable, return an empty array.'),
  ayurvedicSuggestions: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable Ayurvedic remedies or lifestyle advice *relevant to the condition or general symptom*. These are general suggestions, not prescriptions. Provide in the specified language. If not applicable, return an empty array.'),
  homeRemedies: z.array(z.string()).optional().describe('An array of 2-3 distinct and actionable common home remedies or self-care tips *relevant to the condition or general symptom*. These are general suggestions, not medical advice. Provide in the specified language. If not applicable, return an empty array.'),
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
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: VoiceSymptomCheckerInputSchema},
  output: {schema: VoiceSymptomCheckerOutputSchema},
  prompt: (input) => `You are an AI-powered symptom checker, drawing upon a comprehensive understanding of medical knowledge. Your goal is to analyze the described symptoms and provide *distinct, medically-informed, and relevant* potential insights, including possible conditions and comprehensive, actionable suggestions for management.
When suggesting conditions or explanations, ensure they are grounded in established medical information.
You MUST respond in the language specified: ${input.language || 'English'}.

The patient describes their symptoms as: "{{{symptoms}}}"

Carefully analyze ONLY these specific symptoms. Based SOLELY on these symptoms and your medical knowledge, provide the following:
1.  An array named 'analysis' where each element represents a possible medical insight. Each element must be an object adhering to the 'SuggestedConditionSchema'.
    *   If the provided symptoms clearly suggest specific medical conditions, list them. The 'conditionName' should be the medical condition. The explanation *must detail how the user's provided symptoms specifically link to this condition, supported by medical reasoning*.
    *   If the symptoms are very general (e.g., 'hair fall', 'mild fatigue', 'occasional headache') and do not strongly indicate a specific medical condition, then for the 'conditionName', use a general category like "General Symptom Review: [The User's Main Symptom(s)]". For example, if the user says "I feel tired", use "General Symptom Review: Feeling Tired". The 'explanation' for this general review *must be specific to the user's described general symptom(s)*, discussing common non-serious causes, relevant lifestyle factors for *that symptom*, and general advice on when to see a doctor for *that symptom*, all based on general medical knowledge. The suggestions (allopathic, Ayurvedic, home remedies) for this general review entry must also be *specifically tailored to the user's described general symptom(s)*, not generic health advice. Do not use boilerplate explanations or suggestions. Confidence for such general reviews can be moderate (e.g., 0.5).
    *   Ensure the 'analysis' array contains at least one entry. If no specific conditions are found, it MUST contain a "General Symptom Review" entry tailored to the provided symptoms.
    *   For ALL entries in the 'analysis' array, provide 2-3 distinct and actionable suggestions for each of these categories if appropriate: 'allopathicSuggestions', 'ayurvedicSuggestions', and 'homeRemedies'. These are general suggestions, not prescriptions. If suggestions for a category are not relevant or readily available, an empty array [] is the correct response for that suggestion field. Do not omit the field.
    *   **Crucially, if different sets of symptoms are provided in separate requests, strive to generate different and relevant insights. Avoid repeating the same conditions or general advice unless the symptoms are genuinely very similar.** Be discerning and link your analysis directly to the unique aspects of the current symptom input, drawing from a broad medical knowledge base.
2.  A 'disclaimer' string: This must be a clear statement emphasizing that this information is not a medical diagnosis, not a substitute for professional medical advice, and that the user should consult a qualified healthcare professional for any health concerns or before making any decisions related to their health. This disclaimer is mandatory and must be in the specified language.

When providing suggestions, ensure they are general, actionable, and not prescriptive. For example, instead of "Take 500mg Paracetamol", suggest "Over-the-counter pain relievers may help. Consider consulting a pharmacist."

Strive for accuracy and relevance based strictly on the input symptoms and sound medical principles.
All text in your response, including condition names, explanations, suggestions, and the disclaimer, MUST be in the specified language: ${input.language || 'English'}.

Example of the JSON structure you should return:
{
  "analysis": [
    {
      "conditionName": "Example Condition Name (in ${input.language || 'English'})",
      "confidence": 0.8,
      "explanation": "Detailed explanation linking symptoms to this condition (in ${input.language || 'English'}).",
      "allopathicSuggestions": ["Suggestion 1 (allopathic)", "Suggestion 2 (allopathic)"],
      "ayurvedicSuggestions": ["Suggestion 1 (Ayurvedic)"],
      "homeRemedies": ["Remedy 1", "Remedy 2"]
    }
  ],
  "disclaimer": "Mandatory disclaimer text (in ${input.language || 'English'})."
}
Ensure your entire response is ONLY this JSON object. Do not include any text before or after the JSON object.
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
  async (input): Promise<VoiceSymptomCheckerOutput> => {
    console.log(`[voiceSymptomCheckerFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    const lang = input.language || 'English';
    let llmResponse;

    const createErrorResponse = (message: string, conditionNamePrefix: string, explanationPrefix: string): VoiceSymptomCheckerOutput => {
      let errorDisclaimer = "";
      let errorConditionName = "";
      let errorExplanation = "";

      if (lang === 'hi-IN') {
        errorDisclaimer = `क्षमा करें, AI आपके लक्षणों का ठीक से विश्लेषण नहीं कर सका। कृपया किसी स्वास्थ्य पेशेवर से सलाह लें। (${message})`;
        errorConditionName = `${conditionNamePrefix}: AI त्रुटि`;
        errorExplanation = `${explanationPrefix}: AI से संवाद करते समय एक त्रुटि हुई: ${message}. कृपया पुनः प्रयास करें या अपने लक्षणों को स्पष्ट करें।`;
      } else {
        errorDisclaimer = `Sorry, the AI could not properly analyze your symptoms. Please consult a healthcare professional. (${message})`;
        errorConditionName = `${conditionNamePrefix}: AI Error`;
        errorExplanation = `${explanationPrefix}: An error occurred while communicating with the AI: ${message}. Please try again or clarify your symptoms.`;
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
    };

    try {
      llmResponse = await prompt(input);
    } catch (error: any) {
      console.error('[voiceSymptomCheckerFlow] Error calling LLM prompt:', error.message);
      if (error.cause) console.error('[voiceSymptomCheckerFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      if (error.details) console.error('[voiceSymptomCheckerFlow] Error Details:', JSON.stringify(error.details, null, 2));
      if (error.stack) console.error('[voiceSymptomCheckerFlow] Error Stack:', error.stack);
      return createErrorResponse((error as Error).message, "LLM Call", "Error during LLM call");
    }
    
    let parsedOutput = llmResponse.output;

    if (!parsedOutput && llmResponse.text) {
      console.log(`[voiceSymptomCheckerFlow] Genkit parsing failed for symptoms: "${input.symptoms}". Attempting manual JSON.parse of raw LLM text.`);
      try {
        const manuallyParsed = JSON.parse(llmResponse.text);
        if (manuallyParsed && typeof manuallyParsed.disclaimer === 'string' && Array.isArray(manuallyParsed.analysis)) {
           // Basic structural check for analysis items
          if (manuallyParsed.analysis.every((item: any) => item && typeof item.conditionName === 'string' && typeof item.confidence === 'number' && typeof item.explanation === 'string')) {
            console.log("[voiceSymptomCheckerFlow] Manual JSON.parse and basic validation successful. Using manually parsed data.");
            parsedOutput = manuallyParsed as VoiceSymptomCheckerOutput;
          } else {
            console.warn("[voiceSymptomCheckerFlow] Manual JSON.parse succeeded, but analysis items lack required structure or types.");
            parsedOutput = null; // Invalidate if structure is incorrect
          }
        } else {
           console.warn("[voiceSymptomCheckerFlow] Manual JSON.parse succeeded, but object lacks essential 'disclaimer' or 'analysis' (as array) fields.");
           parsedOutput = null; // Invalidate if top-level structure is incorrect
        }
      } catch (parseError: any) {
        console.warn(`[voiceSymptomCheckerFlow] Manual JSON.parse of raw LLM text also failed for symptoms "${input.symptoms}": ${parseError.message}. Raw text (first 500 chars): ${llmResponse.text.substring(0,500)}`);
        // `parsedOutput` remains null, will be caught by the next check
      }
    }

    if (!parsedOutput || !parsedOutput.disclaimer || !parsedOutput.analysis) { 
      const source = llmResponse.output ? "Genkit-parsed" : "manually-parsed (or failed attempt)";
      const warningMessage = `Fallback triggered. Output source: ${source}. Missing output, disclaimer, or analysis array. Language: ${lang}. Input symptoms: "${input.symptoms}". Raw LLM response text (first 500 chars): ${llmResponse.text?.substring(0,500)}. Parsed/attempted LLM output object: ${JSON.stringify(parsedOutput, null, 2)}`;
      console.warn(`[voiceSymptomCheckerFlow] ${warningMessage}`);
      return createErrorResponse("AI did not return expected structured response or it was incomplete.", "Parsing", "Response Parsing Error");
    }
    
    if (!Array.isArray(parsedOutput.analysis)) {
        console.warn(`[voiceSymptomCheckerFlow] AI output.analysis was not an array for symptoms: "${input.symptoms}". Forcing to empty array. LLM response text: ${llmResponse.text}`);
        parsedOutput.analysis = []; // Ensure analysis is an array if it somehow passed previous checks but wasn't one.
    }

    if (parsedOutput.analysis.length === 0) {
        console.log(`[voiceSymptomCheckerFlow] AI returned a valid response with a disclaimer but an empty analysis array for symptoms: "${input.symptoms}" in language: ${lang}. LLM response text: ${llmResponse.text}. Parsed LLM output: ${JSON.stringify(parsedOutput, null, 2)}`);
        const generalSymptomReviewText = lang === 'hi-IN' ? 
            `सामान्य लक्षण समीक्षा: ${input.symptoms}` : 
            `General Symptom Review: ${input.symptoms}`;
        const generalExplanationText = lang === 'hi-IN' ? 
            `आपके द्वारा बताए गए लक्षणों (${input.symptoms}) के लिए कोई विशिष्ट स्थिति तुरंत पहचानी नहीं गई। सामान्य सलाह के लिए कृपया स्वास्थ्य सेवा प्रदाता से परामर्श करें।` :
            `No specific condition was immediately identified for the symptoms you described (${input.symptoms}). Please consult a healthcare provider for general advice.`;
        
        parsedOutput.analysis.push({
            conditionName: generalSymptomReviewText,
            confidence: 0.3,
            explanation: generalExplanationText,
            allopathicSuggestions: [],
            ayurvedicSuggestions: [],
            homeRemedies: [],
        });
    }
    console.log(`[voiceSymptomCheckerFlow] Successfully processed symptoms: "${input.symptoms}". Analysis items: ${parsedOutput.analysis?.length || 0}.`);
    return parsedOutput;
  }
);
