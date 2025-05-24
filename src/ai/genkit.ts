
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {groq} from '@genkit-ai/groq'; // Temporarily removed due to install issues

export const ai = genkit({
  plugins: [
    googleAI(),
    // groq({apiKey: process.env.GROQ_API_KEY}), // Temporarily removed
  ],
  model: 'googleai/gemini-2.0-flash', // Default global model
});
