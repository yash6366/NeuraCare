import { config } from 'dotenv';
config();

import '@/ai/flows/voice-symptom-checker.ts';
import '@/ai/flows/voice-command-processing.ts';
import '@/ai/flows/location-based-recommendations.ts';