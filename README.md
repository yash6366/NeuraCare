
# VakCare

This is a NextJS starter for VakCare in Firebase Studio.

To get started, take a look at src/app/page.tsx.

*This project was prototyped and assisted by the App Prototyper in Firebase Studio, your friendly AI coding partner!*

## Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Set up Environment Variables**:
    Create a `.env` file in the root of your project and add the necessary environment variables (see "Environment Variables for Vercel" section below for a list, you'll need these for local development too).
3.  **Run Next.js Development Server**:
    ```bash
    npm run dev
    ```
    This will start the Next.js app, typically on `http://localhost:9002`.
4.  **Run Genkit Development Server (in a separate terminal)**:
    ```bash
    npm run genkit:watch
    ```
    This starts the Genkit server, making your AI flows available for the Next.js app to call.

## Deployment to Vercel

To deploy this project to Vercel:

1.  **Push to a Git Repository**: Make sure your project is on GitHub, GitLab, or Bitbucket.
2.  **Import Project in Vercel**:
    *   Go to your Vercel dashboard and click "Add New... > Project".
    *   Import your Git repository.
    *   Vercel should automatically detect it as a Next.js project.
3.  **Configure Environment Variables**: This is a crucial step. In your Vercel project settings, navigate to "Settings > Environment Variables" and add the following:
    *   `GEMINI_API_KEY`: Your API key for Google AI Studio (Gemini). (e.g., `AIzaSy...`)
    *   `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/yourDbName?retryWrites=true&w=majority`).
    *   `MONGODB_DB_NAME`: (Optional) Your MongoDB database name (defaults to `smartcare_hub` if not set in the connection string or this variable).
    *   `TWILIO_ACCOUNT_SID_ACTUAL`: Your actual Twilio Account SID (starts with `AC`).
    *   `TWILIO_API_KEY_SID`: Your Twilio API Key SID (starts with `SK`).
    *   `TWILIO_API_KEY_SECRET`: Your Twilio API Key Secret.
    *   `TWILIO_PHONE_NUMBER`: Your Twilio phone number for sending SMS (e.g., `+1234567890`).
    *   `EMERGENCY_CONTACT_PHONE`: The primary phone number for SOS alerts (e.g., a specific emergency service number or a family member's number, like `+19876543210`).
    *   `GOOGLE_MAPS_API_KEY`: Your Google Maps API Key for location services. (e.g., `AIzaSy...`)
    *   **Note**: For security, ensure these are set with the appropriate environments (Production, Preview, Development) in Vercel.
4.  **Build and Deploy**:
    *   Vercel will typically use `npm run build` as the build command and `.next` as the output directory. These settings are usually correctly inferred for Next.js projects. The `vercel.json` file included in this project specifies `nextjs` as the framework.
    *   Trigger a deployment. Vercel will build your Next.js application and deploy its pages and API routes (including Genkit flows) as serverless functions.
5.  **Access Your Deployed App**: Once deployed, Vercel will provide you with a URL.

### How Genkit Flows Work on Vercel

This project uses the `@genkit-ai/next` plugin. This plugin automatically exposes your Genkit flows (defined in `src/ai/flows/`) as Next.js API routes, typically under `/api/genkit/[flowName]`. Vercel deploys these API routes as serverless functions, allowing your frontend to call the AI flows.

### Potential Adjustments

*   **Function Memory/Timeout**: If your AI flows are complex or process large amounts of data, you might need to adjust the memory or timeout for the serverless functions on Vercel. This can be done in the Vercel project settings or by extending the `vercel.json` file. For example, to increase memory for Genkit API functions:
    ```json
    // vercel.json
    {
      "framework": "nextjs",
      "functions": {
        "api/genkit/**": { // Or a more specific path if known e.g. pages/api/genkit/[[...path]].ts
          "memory": 1024 // MB
        }
      }
    }
    ```
    Consult Vercel's documentation for the most up-to-date glob patterns for functions.
```