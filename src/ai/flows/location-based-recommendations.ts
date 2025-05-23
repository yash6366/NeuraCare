// The locationBasedRecommendationsFlow suggests nearby hospitals or specialists based on the user's current location.
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
      distance: z.number().describe('The distance in kilometers from the user.'),
      contact: z.string().optional().describe('The phone number of the healthcare service.'),
    })
  ).describe('A list of nearby healthcare services.'),
});

export type LocationBasedRecommendationsOutput = z.infer<
  typeof LocationBasedRecommendationsOutputSchema
>;

export async function locationBasedRecommendations(
  input: LocationBasedRecommendationsInput
): Promise<LocationBasedRecommendationsOutput> {
  return locationBasedRecommendationsFlow(input);
}

const locationBasedRecommendationsPrompt = ai.definePrompt({
  name: 'locationBasedRecommendationsPrompt',
  input: {schema: LocationBasedRecommendationsInputSchema},
  output: {schema: LocationBasedRecommendationsOutputSchema},
  prompt: `You are a helpful assistant designed to provide recommendations for nearby healthcare services based on the user's current location.

  The user is at latitude: {{latitude}} and longitude: {{longitude}}.

  {% if recommendationType == 'hospital' %}
  Suggest nearby hospitals.
  {% else %}
  Suggest nearby specialists in the field of {{specialty}}.
  {% endif %}

  Return a JSON object with an array of results. Each result should include the name, address, distance in kilometers from the user, and contact phone number if available.
  `,
});

const locationBasedRecommendationsFlow = ai.defineFlow(
  {
    name: 'locationBasedRecommendationsFlow',
    inputSchema: LocationBasedRecommendationsInputSchema,
    outputSchema: LocationBasedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await locationBasedRecommendationsPrompt(input);
    return output!;
  }
);
