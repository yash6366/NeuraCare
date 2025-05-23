
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

export const TelemedicineChatInputSchema = z.object({
  userMessage: z.string().describe('The latest message from the user.'),
  chatHistory: z.array(ChatMessageSchema).optional().describe('The history of the conversation so far.'),
});
export type TelemedicineChatInput = z.infer<typeof TelemedicineChatInputSchema>;

export const TelemedicineChatOutputSchema = z.object({
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
  // System prompt to guide the AI's behavior
  system: `You are "SmartCare AI Assistant", a friendly and knowledgeable AI designed to assist users within a telemedicine platform.
Your goal is to be helpful, empathetic, and provide clear, concise information.
You can answer general health-related questions, provide information about medical conditions (always with a disclaimer that you are not a doctor and users should consult professionals),
and engage in general conversation if the user wishes.
Maintain a positive and supportive tone.
If a question is outside your capabilities or requires medical expertise you don't have, politely state that and suggest consulting a healthcare professional.
Do not provide medical diagnoses or treatment plans.
`,
  // The main prompt will be constructed dynamically using the chat history
  prompt: (input) => {
    const history = input.chatHistory || [];
    // Add the current user message to the history for the prompt
    const fullHistory = [
      ...history,
      { role: 'user' as const, parts: [{ text: input.userMessage }] },
    ];
    return { history: fullHistory };
  },
  // Configuration for the model
  config: {
    // You can adjust temperature for more creative or deterministic responses
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
    const llmResponse = await telemedicineChatPrompt(input);
    const responseText = llmResponse.text;
    
    if (!responseText) {
      // Fallback response if the model doesn't return text for some reason
      return { botResponse: "I'm sorry, I couldn't process that. Could you try rephrasing?" };
    }
    return { botResponse: responseText };
  }
);
