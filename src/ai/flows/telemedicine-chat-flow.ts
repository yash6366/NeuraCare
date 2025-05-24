
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
  input: {schema: TelemedicineChatInputSchema},
  output: {schema: TelemedicineChatOutputSchema},
  system: (input) => `You are "SmartCare AI Assistant", a friendly and knowledgeable AI designed to assist users within a telemedicine platform.
Your goal is to be helpful, empathetic, and provide clear, concise information.
You can answer general health-related questions, provide information about medical conditions (always with a disclaimer that you are not a doctor and users should consult professionals),
and engage in general conversation if the user wishes.
Maintain a positive and supportive tone.
If a question is outside your capabilities or requires medical expertise you don't have, politely state that and suggest consulting a healthcare professional.
Do not provide medical diagnoses or treatment plans.
You MUST understand and respond in the following language: ${input.language || 'English'}.
`,
  prompt: (input) => input.userMessage, // Corrected: Return the user's message string directly
  config: {
    // temperature: 0.7, 
  },
});

const telemedicineChatFlow = ai.defineFlow(
  {
    name: 'telemedicineChatFlow',
    inputSchema: TelemedicineChatInputSchema,
    outputSchema: TelemedicineChatOutputSchema,
  },
  async (input) => {
    // When 'telemedicineChatPrompt' is called with 'input', Genkit will automatically use
    // 'input.chatHistory' as the conversation history for the model,
    // and 'input.userMessage' as the prompt content (due to the corrected 'prompt' function above).
    const llmResponse = await telemedicineChatPrompt(input);
    const responseText = llmResponse.text;
    
    if (!responseText) {
      const defaultErrorMessage = input.language === 'hi-IN' ? // Example for Hindi, expand as needed
        "मुझे क्षमा करें, मैं इसे संसाधित नहीं कर सका। क्या आप इसे फिर से कह सकते हैं?" :
        "I'm sorry, I couldn't process that. Could you try rephrasing?";
      return { botResponse: defaultErrorMessage };
    }
    return { botResponse: responseText };
  }
);

