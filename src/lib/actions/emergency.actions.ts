
'use server';

import Twilio from 'twilio';
import { getDb } from '@/lib/mongodb';
import type { Patient } from '@/types';
import { ObjectId } from 'mongodb';

const actualAccountSid = process.env.TWILIO_ACCOUNT_SID_ACTUAL;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const fixedEmergencyContactPhone = process.env.EMERGENCY_CONTACT_PHONE; // e.g., 108 or primary family member

interface SmsResponse {
  success: boolean;
  message: string;
  error?: any;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

export async function sendSosSmsAction(
  userId: string,
  userNameFromClient: string | undefined, // User name from client-side auth
  location: LocationData | null
): Promise<SmsResponse> {
  
  if (actualAccountSid === "YOUR_ACTUAL_TWILIO_ACCOUNT_SID_STARTS_WITH_AC") {
    const errorMessage = "Twilio Account SID is not configured. Please update TWILIO_ACCOUNT_SID_ACTUAL in your .env file with your actual Twilio Account SID (starts with AC).";
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }

  let missingEnvVars = [];
  if (!actualAccountSid) missingEnvVars.push('TWILIO_ACCOUNT_SID_ACTUAL');
  if (!apiKeySid) missingEnvVars.push('TWILIO_API_KEY_SID');
  if (!apiKeySecret) missingEnvVars.push('TWILIO_API_KEY_SECRET');
  if (!twilioPhoneNumber) missingEnvVars.push('TWILIO_PHONE_NUMBER');
  if (!fixedEmergencyContactPhone) missingEnvVars.push('EMERGENCY_CONTACT_PHONE');

  if (missingEnvVars.length > 0) {
    const errorMessage = `Twilio service is not configured correctly. Missing environment variables: ${missingEnvVars.join(', ')}. Please contact support or check your .env file.`;
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }
  
  if (actualAccountSid && !actualAccountSid.startsWith('AC')) {
    const errorMessage = 'Invalid TWILIO_ACCOUNT_SID_ACTUAL. It must start with "AC". Please check your .env file.';
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }

  let patientEmergencyContact: string | undefined | null = null;
  let senderName = userNameFromClient || 'A VakCare User'; // Updated app name

  try {
    if (ObjectId.isValid(userId)) {
      const db = await getDb();
      const usersCollection = db.collection('users');
      const userDoc = await usersCollection.findOne({ _id: new ObjectId(userId) });

      if (userDoc) {
        senderName = userDoc.name as string || senderName; // Prefer name from DB
        if (userDoc.role === 'patient') {
          patientEmergencyContact = (userDoc as Omit<Patient, 'id'> & { _id: ObjectId }).emergencyContactPhone;
        }
      }
    }
  } catch (dbError) {
    console.error("Error fetching user's emergency contact from DB:", dbError);
    // Continue without it, but log the error
  }

  const client = Twilio(apiKeySid!, apiKeySecret!, { accountSid: actualAccountSid! });
  
  let locationInfo = 'Location not available.';
  if (location) {
    locationInfo = `Their approximate location is: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  const messageBody = `SOS Alert from VakCare: ${senderName} has triggered an emergency alert. ${locationInfo} Please respond immediately.`; // Updated app name

  const recipients: string[] = [];
  if (fixedEmergencyContactPhone) {
    recipients.push(fixedEmergencyContactPhone);
  }
  if (patientEmergencyContact) {
    recipients.push(patientEmergencyContact);
  }
  
  const uniqueRecipients = Array.from(new Set(recipients.filter(Boolean))); // Ensure unique and non-empty

  if (uniqueRecipients.length === 0) {
    return { success: false, message: "No valid recipient phone numbers configured or found for the user." };
  }

  const smsPromises = uniqueRecipients.map(recipient => {
    return client.messages
      .create({
        body: messageBody,
        from: twilioPhoneNumber!,
        to: recipient,
      })
      .then(message => ({ sid: message.sid, to: recipient, status: 'sent' }))
      .catch(error => {
        console.error(`Failed to send SMS to ${recipient}:`, error);
        return { to: recipient, status: 'failed', error: error.message };
      });
  });

  try {
    const results = await Promise.all(smsPromises);
    const allSuccessful = results.every(r => r.status === 'sent');
    const failedSends = results.filter(r => r.status === 'failed');

    if (allSuccessful) {
      return { success: true, message: `SOS alerts sent successfully to ${uniqueRecipients.join(', ')}.` };
    } else {
      return { 
        success: false, 
        message: `SOS alerts partially sent. Failed to send to: ${failedSends.map(f=>f.to).join(', ')}. Sent successfully to others.`,
        error: failedSends.map(f => ({to: f.to, error: f.error}))
      };
    }
  } catch (error: any) {
    console.error('Error sending SOS SMS via Twilio:', error);
    return {
      success: false,
      message: 'Failed to send SOS alerts due to a system error.',
      error: error.message,
    };
  }
}
