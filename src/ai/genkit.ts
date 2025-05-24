
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {groq} from '@genkit-ai/groq'; // Reverted: Groq plugin removed due to install issues

export const ai = genkit({
  plugins: [
    googleAI(),
    // groq({apiKey: process.env.GROQ_API_KEY}), // Reverted
  ],
  model: 'googleai/gemini-1.5-flash-latest', // Default global model remains Gemini
});
