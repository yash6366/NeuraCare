
// The locationBasedRecommendationsFlow suggests nearby hospitals or specialists.
// It now uses a tool that would (in a full implementation) query the Google Maps Places API.
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

const LocationBasedRecommendationsOutputSchema = z.object({
  results: z.array(
    z.object({
      name: z.string().describe('The name of the healthcare service.'),
      address: z.string().describe('The address of the healthcare service.'),
      distance: z.number().describe('The distance in kilometers from the user. (This would be calculated or provided by the mapping API)'),
      contact: z.string().optional().describe('The phone number of the healthcare service.'),
    })
  ).describe('A list of nearby healthcare services.'),
});

export type LocationBasedRecommendationsOutput = z.infer<
  typeof LocationBasedRecommendationsOutputSchema
>;

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
    // In a real implementation, you would use input.latitude, input.longitude, 
    // input.recommendationType, input.specialty and the GOOGLE_MAPS_API_KEY 
    // from process.env to call the Google Maps Places API.
    // For example:
    // const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    // const searchType = input.recommendationType === 'hospital' ? 'hospital' : 'doctor';
    // const keyword = input.recommendationType === 'specialist' ? input.specialty : '';
    // const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${input.latitude},${input.longitude}&radius=15000&type=${searchType}&keyword=${keyword}&key=${apiKey}`; // Increased radius for more varied mock results
    // const response = await fetch(url);
    // const data = await response.json();
    // Then, parse 'data' and map it to LocationBasedRecommendationsOutputSchema.

    // For now, returning mock data with slightly randomized distances:
    const generateRandomDistance = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(1));

    let mockResults = [];

    if (input.recommendationType === 'hospital') {
      mockResults = [
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
        {
          name: `Suburban Health Clinic (Mock)`,
          address: `300 Wellness Ave, Mocktown`,
          distance: generateRandomDistance(10.1, 15.0),
          contact: '555-MOCK-H3',
        },
      ];
    } else if (input.recommendationType === 'specialist') {
      const specialtyName = input.specialty || 'General';
      mockResults = [
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
      if (!input.specialty) { // Add a generic specialist if no specific specialty was asked
        mockResults.push({
            name: "General Specialist Center (Mock)",
            address: "600 Health Plaza, Mockcity",
            distance: generateRandomDistance(4.0, 9.0),
            contact: "555-MOCK-GS"
        });
      }
    }

    console.log("[findNearbyHealthcareTool] Returning mock results with randomized distances.", mockResults);
    return { results: mockResults };
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
Use the 'findNearbyHealthcareTool' to find relevant places and provide the results exactly as returned by the tool.
Do not add any extra conversational text, just the structured output from the tool.
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
      if (llmResponse.output) {
          return llmResponse.output;
      }
      console.warn("[locationBasedRecommendationsFlow] LLM response did not yield a parsable output or tool was not called as expected. Raw text:", llmResponse.text, "Parsed output:", JSON.stringify(llmResponse.output, null, 2));
      return { results: [] }; // Fallback to empty results
    } catch (error) {
      console.error('[locationBasedRecommendationsFlow] Error during execution:', error);
      return { results: [] }; // Default error response
    }
  }
);

