
// Use server directive.
'use server';

/**
 * @fileOverview Processes voice commands to extract relevant information, especially for booking and cancelling appointments.
 *
 * - processVoiceCommand - Processes the voice command and extracts relevant information.
 * - ProcessVoiceCommandInput - The input type for the processVoiceCommand function.
 * - ProcessVoiceCommandOutput - The return type for the processVoiceCommand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProcessVoiceCommandInputSchema = z.object({
  voiceCommand: z
    .string()
    .describe('The voice command from the user in their preferred language.'),
  currentDate: z.string().optional().describe('The current date.'),
});
export type ProcessVoiceCommandInput = z.infer<typeof ProcessVoiceCommandInputSchema>;

const ProcessVoiceCommandOutputSchema = z.object({
  intent: z
    .enum(['BOOK_APPOINTMENT', 'CANCEL_APPOINTMENT', 'GET_APPOINTMENT', 'OTHER'])
    .describe('The intent of the voice command.'),
  appointmentType: z.string().optional().describe('The type of appointment to book or cancel, e.g., general checkup, cardiology.'),
  dateTime: z.string().optional().describe('The date and time for the appointment in ISO format, if mentioned.'),
  patientName: z.string().optional().describe('The name of the patient, if mentioned.'),
  confirmationNumber: z.string().optional().describe('The confirmation number of the appointment, if the user wants to cancel it.'),
  language: z.string().optional().describe('The language in which the voice command was given.'),
});
export type ProcessVoiceCommandOutput = z.infer<typeof ProcessVoiceCommandOutputSchema>;

export async function processVoiceCommand(input: ProcessVoiceCommandInput): Promise<ProcessVoiceCommandOutput> {
  return processVoiceCommandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'processVoiceCommandPrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Reverted to Flash
  input: {schema: ProcessVoiceCommandInputSchema},
  output: {schema: ProcessVoiceCommandOutputSchema},
  prompt: `You are a helpful assistant that extracts information from voice commands to help manage appointments.

  The current date is {{{currentDate}}}.

  Here's the voice command: {{{voiceCommand}}}

  Analyze the voice command and extract the following information:
  - intent: Is the user trying to book an appointment, cancel an appointment or get an appointment, or is the command something else?
  - appointmentType: What type of appointment is the user asking for? (e.g., general checkup, cardiology)
  - dateTime: What date and time does the user want to book or cancel the appointment for? Provide in ISO format.
  - patientName: What is the name of the patient?
  - confirmationNumber: If the user wants to cancel an appointment, what is the confirmation number?
  - language: What language is the user speaking in?

  Return the information in JSON format.
  Make sure that the values are extracted from the user's voice command. If the user is asking to book or cancel an appointment, but does not provide a specific date and time, do not assume date and time.
  `,
});

const processVoiceCommandFlow = ai.defineFlow(
  {
    name: 'processVoiceCommandFlow',
    inputSchema: ProcessVoiceCommandInputSchema,
    outputSchema: ProcessVoiceCommandOutputSchema,
  },
  async (input) => {
    console.log(`[processVoiceCommandFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    try {
      const llmResponse = await prompt(input);
      if (llmResponse.output) {
        return llmResponse.output;
      } else {
        console.warn('[processVoiceCommandFlow] LLM response did not yield a parsable output. Raw text:', llmResponse.text);
        // Return a default "OTHER" intent if parsing fails
        return { intent: 'OTHER' as const };
      }
    } catch (error: any) {
      console.error('[processVoiceCommandFlow] Error during execution:', error.message);
      if (error.cause) {
        console.error('[processVoiceCommandFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) { 
        console.error('[processVoiceCommandFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[processVoiceCommandFlow] Error Stack:', error.stack);
      }
      return { intent: 'OTHER' as const }; // Default error response
    }
  }
);
