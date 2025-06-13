
# VakCare: Your Intelligent Healthcare Companion

VakCare is a modern, AI-powered healthcare application designed to serve patients, doctors, and administrators. It offers a suite of tools for health management, information access, and communication, leveraging cutting-edge AI to provide intelligent assistance.

*This project was prototyped and assisted by the App Prototyper in Firebase Studio, your friendly AI coding partner!*

## Overview & Purpose

VakCare aims to be an intelligent healthcare companion. It's designed to serve multiple user roles (patients, doctors, and administrators) by providing a suite of tools for health management, information access, and communication, with a significant emphasis on AI-driven features.

## Core Features

VakCare provides a range of features tailored to different user roles:

*   **User Authentication & Role-Based Access:**
    *   Secure login and registration for patients, doctors, and administrators.
    *   Role-specific dashboards (Admin, Doctor, Patient).
*   **Dashboards:**
    *   **Admin:** System overview, user management (doctors & patients), and access to all platform features.
    *   **Doctor:** Patient management, (simulated) appointment overview, detailed patient view with medical records, and (simulated) chat functionality.
    *   **Patient:** Access to AI health tools, assigned doctor information, appointment booking, and medical record management.
*   **AI-Powered Tools:**
    *   **AI Symptom Checker:** Analyzes user-described symptoms to suggest potential conditions, explanations, and remedy options (allopathic, Ayurvedic, home remedies) with disclaimers.
    *   **AI Chat Assistant:** A versatile chatbot for:
        *   General conversation.
        *   Image analysis (upload images and ask questions).
        *   PDF document processing (text extraction, summarization, Q&A based on document content).
    *   **Health Information Hub:** Provides AI-generated answers to general health-related questions, with disclaimers.
    *   **Location-Based Care Finder:** Recommends nearby hospitals or specialists using Google Maps API (with mock data fallback).
    *   **Voice Command Processing:** Interprets speech for tasks like pre-filling appointment forms.
*   **Appointments Management:**
    *   Book new appointments with specific doctors.
    *   View upcoming and past appointments.
    *   (Simulated) cancellation and rescheduling.
*   **Telemedicine / Doctor Chat (Simulated):**
    *   **Patient-Doctor:** Simulated text-based chat between patients and selected doctors.
    *   **Admin-Doctor:** Simulated chat for admins with individual doctors or a broadcast feature to all doctors.
*   **Medical Records Management (Patient-focused):**
    *   Upload PDF and image documents.
    *   View and delete uploaded records.
    *   Save symptom checker analyses as text-based records.
*   **Emergency SOS Alert:**
    *   Triggers SMS alerts via Twilio to pre-configured and user-specific emergency contacts, attempting to include location.
*   **User Profile Management:** Users can update their name, phone number, and address.
*   **Multi-language Support:** UI and AI responses designed for translation, with a language selector.

## Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **AI Integration:** Genkit, Google Gemini Models (primarily `gemini-1.5-flash-latest`)
*   **Database:** MongoDB
*   **External APIs:**
    *   Twilio API (SMS for Emergency SOS)
    *   Google Maps Places API (Find Care feature)
*   **State Management:** React Component State, React Context (Language), localStorage (User Session)

## Architectural Highlights

*   **Modular Design:** Clear separation of concerns with dedicated directories for pages (`src/app`), UI components (`src/components`), AI flows (`src/ai/flows`), and shared logic (`src/lib`).
*   **Server Actions:** Utilized for database operations (user management, medical records) and secure backend logic, enhancing security and simplifying data mutations.
*   **Genkit Integration:** AI flows defined in TypeScript are exposed as Next.js API routes, callable from client components.
*   **Client-Side Authentication:** User session managed via localStorage, with server actions handling credential verification and user data storage.

## Key AI Flows

*   **`voice-symptom-checker.ts`:** Powers the AI Symptom Checker.
*   **`telemedicine-chat-flow.ts`:** Drives the general AI Chat Assistant (distinct from direct doctor-patient chat).
*   **`image-analysis-flow.ts`:** Enables image understanding for the AI Chat Assistant.
*   **`document-text-extraction-flow.ts`, `document-summarization-flow.ts`, `document-query-flow.ts`:** Provide document processing for the AI Chat Assistant.
*   **`health-info-query-flow.ts`:** Answers general health questions in the Health Information Hub.
*   **`voice-command-processing.ts`:** Extracts intent and entities from spoken commands, primarily for appointments.
*   **`location-based-recommendations.ts`:** Finds healthcare services based on user location.

## Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Set up Environment Variables**:
    Create a `.env` file in the root of your project by copying `.env.example` (if it exists, otherwise create it manually) and add the necessary environment variables (see "Environment Variables for Vercel" section below for a list; you'll need these for local development too).
    ```
    # .env
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING_HERE
    MONGODB_DB_NAME=smartcare_hub # Or your preferred DB name

    # Twilio Credentials (ensure these are the actual values, not placeholders)
    TWILIO_ACCOUNT_SID_ACTUAL=YOUR_ACTUAL_TWILIO_ACCOUNT_SID_STARTS_WITH_AC
    TWILIO_API_KEY_SID=YOUR_TWILIO_API_KEY_SID_STARTS_WITH_SK
    TWILIO_API_KEY_SECRET=YOUR_TWILIO_API_KEY_SECRET_HERE
    TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER_HERE # e.g., +1234567890

    # Emergency Contact
    EMERGENCY_CONTACT_PHONE=YOUR_PRIMARY_EMERGENCY_CONTACT_PHONE_HERE # e.g., 108 or family member

    # Google Maps API Key
    GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
    ```
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
    *   Vercel should automatically detect it as a Next.js project. The `vercel.json` file included in this project specifies `nextjs` as the framework.
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
    *   Vercel will typically use `npm run build` as the build command and `.next` as the output directory. These settings are usually correctly inferred for Next.js projects.
    *   Trigger a deployment. Vercel will build your Next.js application and deploy its pages and API routes (including Genkit flows) as serverless functions.
5.  **Access Your Deployed App**: Once deployed, Vercel will provide you with a URL.

### How Genkit Flows Work on Vercel

This project uses the `@genkit-ai/next` plugin. This plugin automatically exposes your Genkit flows (defined in `src/ai/flows/`) as Next.js API routes, typically under `/api/genkit/[flowName]`. Vercel deploys these API routes as serverless functions, allowing your frontend to call the AI flows.

### Potential Adjustments for Vercel

*   **Function Memory/Timeout**: If your AI flows are complex or process large amounts of data (especially image/document analysis), you might need to adjust the memory or timeout for the serverless functions on Vercel. This can be done in the Vercel project settings or by extending the `vercel.json` file. For example, to increase memory for Genkit API functions:
    ```json
    // vercel.json
    {
      "framework": "nextjs",
      "functions": {
        "api/genkit/**": { // Or a more specific path if known e.g., pages/api/genkit/[[...path]].ts
          "memory": 1024 // MB
        }
      }
    }
    ```
    Consult Vercel's documentation for the most up-to-date glob patterns for functions.

## Future Considerations & Potential Enhancements

*   **Real-time Features:** Implement real-time chat (e.g., WebSockets, Firebase) for Doctor-Patient communication.
*   **Database Schema & Relationships:** Formalize and expand database schemas for appointments, detailed patient-doctor assignments, and chat histories.
*   **Advanced State Management:** Consider libraries like Zustand or Jotai if client-side complexity significantly increases.
*   **Comprehensive Error Handling:** Implement a unified, user-friendly error reporting system.
*   **Testing:** Add unit, integration, and end-to-end tests for improved reliability.
*   **Security Hardening:**
    *   Implement robust session management (e.g., NextAuth.js).
    *   Conduct thorough input validation and sanitization.
    *   Implement detailed authorization checks for all server actions and API routes.
*   **Performance Optimization:** For large file uploads, consider direct-to-cloud storage solutions (e.g., Cloudinary, S3 pre-signed URLs).
*   **Accessibility (A11y):** Continue focusing on ARIA attributes, keyboard navigation, and semantic HTML.
*   **Video Consultations:** Integrate WebRTC or a third-party service for video calls.
*   **Prescription Management:** Securely manage and track prescriptions.
*   **Notifications System:** Implement in-app and push notifications for appointments, messages, etc.

This README should now provide a much better overview of the VakCare application!
