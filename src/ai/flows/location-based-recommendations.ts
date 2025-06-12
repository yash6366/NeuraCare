
// The locationBasedRecommendationsFlow suggests nearby hospitals or specialists.
// It now attempts to use the Google Maps Places API.
// locationBasedRecommendations - A function that takes location data and returns a list of nearby healthcare services.
// LocationBasedRecommendationsInput - The input type for the locationBasedRecommendations function.
// LocationBasedRecommendationsOutput - The return type for the locationBasedRecommendations function.

'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LocationBasedRecommendationsInputSchema = z.object({
  latitude: z.number().describe('The latitude of the user.'),
  longitude: z.number().describe('The longitude of the user.'),
  recommendationType: z
    .enum(['hospital', 'specialist'])
    .describe('The type of recommendation to provide: hospital or specialist.'),
  specialty: z.string().optional().describe('The medical specialty to search for, if recommendationType is specialist.'),
});

export type LocationBasedRecommendationsInput = z.infer<
  typeof LocationBasedRecommendationsInputSchema
>;

const PlaceSchema = z.object({
  name: z.string().describe('The name of the healthcare service.'),
  address: z.string().describe('The address of the healthcare service.'),
  distance: z.number().describe('The distance in kilometers from the user. (This would be calculated or provided by the mapping API)'),
  contact: z.string().optional().describe('The phone number of the healthcare service.'),
  // Add other fields you might get from the API if needed, e.g., website, rating
});

const LocationBasedRecommendationsOutputSchema = z.object({
  results: z.array(PlaceSchema).describe('A list of nearby healthcare services.'),
  dataSource: z.enum(['API', 'Mock']).optional().describe('Indicates if the data came from the API or mock data.')
});

export type LocationBasedRecommendationsOutput = z.infer<
  typeof LocationBasedRecommendationsOutputSchema
>;

const generateRandomDistance = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

const getMockResults = (input: LocationBasedRecommendationsInput): LocationBasedRecommendationsOutput['results'] => {
  let mockResultsData = [];
  if (input.recommendationType === 'hospital') {
    mockResultsData = [
      {
        name: `City General Hospital (Mock)`,
        address: `100 Health Rd, Near Lat ${input.latitude.toFixed(2)}`,
        distance: generateRandomDistance(1.0, 5.0),
        contact: '555-MOCK-H1',
      },
      {
        name: `Community Medical Center (Mock)`,
        address: `200 Care Blvd, Near Lon ${input.longitude.toFixed(2)}`,
        distance: generateRandomDistance(5.1, 10.0),
        contact: '555-MOCK-H2',
      },
    ];
  } else if (input.recommendationType === 'specialist') {
    const specialtyName = input.specialty || 'General';
    mockResultsData = [
      {
        name: `Mock ${specialtyName} Clinic Alpha`,
        address: `400 Specialist Ln, Near Lat ${input.latitude.toFixed(2)}`,
        distance: generateRandomDistance(2.0, 7.0),
        contact: '555-MOCK-S1',
      },
      {
        name: `Mock ${specialtyName} Practice Beta`,
        address: `500 Expert St, Near Lon ${input.longitude.toFixed(2)}`,
        distance: generateRandomDistance(7.1, 12.0),
        contact: '555-MOCK-S2',
      },
    ];
  }
  return mockResultsData;
}

// Define the tool that would call Google Maps API
const findNearbyHealthcareTool = ai.defineTool(
  {
    name: 'findNearbyHealthcareTool',
    description: 'Finds nearby hospitals or specialists using mapping services based on user location and criteria.',
    inputSchema: LocationBasedRecommendationsInputSchema,
    outputSchema: LocationBasedRecommendationsOutputSchema,
  },
  async (input) => {
    console.log(`[findNearbyHealthcareTool] Called with input: ${JSON.stringify(input, null, 2)}`);
    
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      console.warn("[findNearbyHealthcareTool] GOOGLE_MAPS_API_KEY not configured or is using placeholder. Falling back to mock data.");
      return { results: getMockResults(input), dataSource: 'Mock' };
    }

    const searchType = input.recommendationType === 'hospital' ? 'hospital' : 'doctor'; // 'doctor' can be a generic type for specialists
    const keyword = input.recommendationType === 'specialist' ? input.specialty : '';
    // Increased radius for more varied results, can be adjusted.
    const radius = 15000; // 15km
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${input.latitude},${input.longitude}&radius=${radius}&type=${searchType}${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}&key=${apiKey}`;
    
    console.log(`[findNearbyHealthcareTool] Requesting URL: ${url.replace(apiKey, 'REDACTED_API_KEY')}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[findNearbyHealthcareTool] Google Maps API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`Google Maps API request failed: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`[findNearbyHealthcareTool] Google Maps API Error: ${data.status} - ${data.error_message || 'No error message provided.'}`);
        // Do not throw here, allow fallback to mock data if preferred for non-critical errors
        // but log it. If critical, then throw.
        // For now, let's fall back if not OK.
      }

      if (data.results && data.results.length > 0) {
        const apiResults = data.results.map((place: any) => ({
          name: place.name || 'Unnamed Place',
          address: place.vicinity || 'Address not available',
          // Distance calculation can be complex. Google Places API Nearby Search doesn't directly give distance.
          // For simplicity, using random distance for now, as in mock.
          // A real app might use the Distance Matrix API or calculate from place.geometry.location.
          distance: generateRandomDistance(1.0, 15.0), 
          contact: place.formatted_phone_number || place.international_phone_number || undefined, // Phone number might need Places Details API
        }));
        console.log(`[findNearbyHealthcareTool] Fetched ${apiResults.length} results from Google Maps API.`);
        return { results: apiResults, dataSource: 'API' };
      } else {
        console.log("[findNearbyHealthcareTool] No results from Google Maps API or API error, falling back to mock data. Status:", data.status);
        return { results: getMockResults(input), dataSource: 'Mock' };
      }

    } catch (error) {
      console.error(`[findNearbyHealthcareTool] Error fetching or parsing Google Maps data: ${(error as Error).message}. Falling back to mock data.`);
      return { results: getMockResults(input), dataSource: 'Mock' };
    }
  }
);


export async function locationBasedRecommendations(
  input: LocationBasedRecommendationsInput
): Promise<LocationBasedRecommendationsOutput> {
  return locationBasedRecommendationsFlow(input);
}

const locationBasedRecommendationsPrompt = ai.definePrompt({
  name: 'locationBasedRecommendationsPrompt',
  input: {schema: LocationBasedRecommendationsInputSchema},
  output: {schema: LocationBasedRecommendationsOutputSchema},
  tools: [findNearbyHealthcareTool],
  prompt: `You are an AI assistant that helps users find nearby healthcare services.
The user's current location is latitude: {{latitude}} and longitude: {{longitude}}.
They are looking for a {{recommendationType}}.
{{#if specialty}}
Their preferred specialty is '{{specialty}}'.
{{/if}}
Use the 'findNearbyHealthcareTool' to find relevant places.
If the tool returns a 'dataSource' of 'API', provide the results exactly as returned by the tool.
If the tool returns a 'dataSource' of 'Mock' or if the tool call fails, inform the user that you are providing general mock/placeholder recommendations as real-time data couldn't be fetched, then provide the mock results.
Do not add any extra conversational text beyond this, just the structured output from the tool or the mock data explanation and then the structured mock data.
`,
});

const locationBasedRecommendationsFlow = ai.defineFlow(
  {
    name: 'locationBasedRecommendationsFlow',
    inputSchema: LocationBasedRecommendationsInputSchema,
    outputSchema: LocationBasedRecommendationsOutputSchema,
  },
  async (input) => {
    console.log(`[locationBasedRecommendationsFlow] Received input: ${JSON.stringify(input, null, 2)}`);
    try {
      const llmResponse = await locationBasedRecommendationsPrompt(input);
      if (llmResponse.output && llmResponse.output.results) {
          console.log(`[locationBasedRecommendationsFlow] Successfully processed. Data source: ${llmResponse.output.dataSource || 'N/A'}`);
          return llmResponse.output;
      }
      // This part might be hit if the LLM doesn't call the tool or if the tool call part of the prompt fails before the tool.
      console.warn("[locationBasedRecommendationsFlow] LLM response did not yield a parsable output or tool was not called as expected. LLM Text:", llmResponse.text, "LLM Parsed Output:", JSON.stringify(llmResponse.output, null, 2));
      return { results: getMockResults(input), dataSource: 'Mock' }; // Fallback to mock results if LLM fails to use tool correctly
    } catch (error: any) {
      console.error('[locationBasedRecommendationsFlow] Error during execution:', error.message);
      if (error.cause) {
        console.error('[locationBasedRecommendationsFlow] Error Cause:', JSON.stringify(error.cause, null, 2));
      }
      if (error.details) { 
        console.error('[locationBasedRecommendationsFlow] Error Details:', JSON.stringify(error.details, null, 2));
      }
      if (error.stack) {
        console.error('[locationBasedRecommendationsFlow] Error Stack:', error.stack);
      }
      return { results: getMockResults(input), dataSource: 'Mock' }; // Default error response with mock data
    }
  }
);

    
