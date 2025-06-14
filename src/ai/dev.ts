
import { config } from 'dotenv';
config();

import '@/ai/flows/voice-symptom-checker.ts';
import '@/ai/flows/voice-command-processing.ts';
import '@/ai/flows/location-based-recommendations.ts';
import '@/ai/flows/telemedicine-chat-flow.ts';
import '@/ai/flows/image-analysis-flow.ts'; // Added new image analysis flow
import '@/ai/flows/document-text-extraction-flow.ts'; // Added new document text extraction flow
import '@/ai/flows/document-summarization-flow.ts'; // Added new document summarization flow
import '@/ai/flows/document-query-flow.ts'; // Added new document query flow
import '@/ai/flows/health-info-query-flow.ts'; // Added new health information query flow

