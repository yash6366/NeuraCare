
'use server';

import Twilio from 'twilio';
import { getCurrentUser } from '@/lib/auth'; // To get user's name

// Initialize Twilio client
// Ensure these environment variables are set in your .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const familyContactPhone = process.env.EMERGENCY_CONTACT_PHONE;
const emergencyServicesPhone = process.env.EMERGENCY_SERVICES_PHONE;

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
  userName: string | undefined,
  location: LocationData | null
): Promise<SmsResponse> {
  if (!accountSid || !authToken || !twilioPhoneNumber || !familyContactPhone || !emergencyServicesPhone) {
    console.error('Twilio environment variables are not properly configured.');
    return {
      success: false,
      message: 'Twilio service is not configured. Please contact support.',
    };
  }

  const client = Twilio(accountSid, authToken);
  const senderName = userName || 'A SmartCare Hub User';
  
  let locationInfo = 'Location not available.';
  if (location) {
    locationInfo = `Their approximate location is: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  const messageBody = `SOS Alert from SmartCare Hub: ${senderName} has triggered an emergency alert. ${locationInfo} Please respond immediately.`;

  const recipients = [familyContactPhone, emergencyServicesPhone];
  const smsPromises = recipients.map(recipient => {
    return client.messages
      .create({
        body: messageBody,
        from: twilioPhoneNumber,
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
      return { success: true, message: 'SOS alerts sent successfully to designated contacts.' };
    } else {
      return { 
        success: false, 
        message: `SOS alerts partially sent. Failed to send to: ${failedSends.map(f=>f.to).join(', ')}.`,
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
