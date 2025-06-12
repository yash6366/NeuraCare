
'use server';
/**
 * @fileOverview A conversational AI flow for the Telemedicine chat assistant.
 *
 * - telemedicineChat - A function that handles the chat interaction.
 * - TelemedicineChatInput - The input type for the telemedicineChat function.
 * - TelemedicineChatOutput - The return type for the telemedicineChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the structure for a single message in the chat history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(z.object({ text: z.string() })),
});

const TelemedicineChatInputSchema = z.object({
  userMessage: z.string().describe('The latest message from the user.'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('The history of the conversation so far.'),
  language: z.string().optional().default('English').describe('The language for the conversation.'),
});
export type TelemedicineChatInput = z.infer<typeof TelemedicineChatInputSchema>;

const TelemedicineChatOutputSchema = z.object({
  botResponse: z.string().describe('The AI assistant\'s response to the user.'),
});
export type TelemedicineChatOutput = z.infer<typeof TelemedicineChatOutputSchema>;

export async function telemedicineChat(input: TelemedicineChatInput): Promise<TelemedicineChatOutput> {
  return telemedicineChatFlow(input);
}

const telemedicineChatPrompt = ai.definePrompt({
  name: 'telemedicineChatPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly set to Flash model
  input: {schema: TelemedicineChatInputSchema},
  // No output schema for direct text chat prompt
  system: (input) => `You are "SmartCare AI Assistant", a friendly, empathetic, and knowledgeable AI designed to assist users within a telemedicine platform.
Your primary goal is to be helpful and provide clear, concise information.
You can answer general health-related questions, provide information about medical conditions (always with a disclaimer that you are not a doctor and users should consult professionals),
and engage in general conversation if the user wishes.
Maintain a positive, supportive, and understanding tone.
If a question is outside your capabilities, involves a diagnosis, or requires specific medical expertise you don't possess, politely state that and suggest consulting a healthcare professional.
Do NOT provide medical diagnoses or treatment plans.
You MUST understand and respond fluently in the following language: ${input.language || 'English'}.
Adapt your vocabulary and sentence structure to be easily understandable for a general audience in the specified language.
`,
  prompt: (input) => input.userMessage, 
  config: {
    temperature: 0.75,
  },
});

const telemedicineChatFlow = ai.defineFlow(
  {
    name: 'telemedicineChatFlow',
    inputSchema: TelemedicineChatInputSchema,
    outputSchema: TelemedicineChatOutputSchema, 
  },
  async (input) => {
    console.log('[telemedicineChatFlow] Received input:', JSON.stringify(input, null, 2));
    try {
      const llmResponse = await telemedicineChatPrompt(input);
      const responseText = llmResponse.text; // For chat, we expect direct text output

      if (!responseText || responseText.trim() === "") {
        console.warn('[telemedicineChatFlow] LLM response text was empty. Input:', JSON.stringify(input, null, 2), 'Input language:', input.language, 'Raw LLM Response object:', JSON.stringify(llmResponse, null, 2));
        const defaultErrorMessage = input.language === 'hi-IN' ?
          "मुझे क्षमा करें, मैं इसे संसाधित नहीं कर सका। क्या आप इसे फिर से कह सकते हैं?" :
          "I'm sorry, I couldn't process that. Could you try rephrasing?";
        return { botResponse: defaultErrorMessage };
      }
      console.log('[telemedicineChatFlow] LLM response success. Response text length:', responseText.length);
      return { botResponse: responseText };
    } catch (error: any) {
      console.error('[telemedicineChatFlow] Error during execution:', error.message);
      if (error.cause) {
        console.error('[telemedicineChatFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) { 
        console.error('[telemedicineChatFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[telemedicineChatFlow] Error Stack:', error.stack);
      }
      const defaultErrorMessage = input.language === 'hi-IN' ?
        "मुझे क्षमा करें, एक तकनीकी समस्या हुई है।" :
        "I'm sorry, a technical error occurred.";
      return { botResponse: defaultErrorMessage };
    }
  }
);
