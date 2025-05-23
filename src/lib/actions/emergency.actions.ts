
'use server';

import Twilio from 'twilio';

// Ensure these environment variables are set in your .env file
const actualAccountSid = process.env.TWILIO_ACCOUNT_SID_ACTUAL; // Main Account SID (starts with AC)
const apiKeySid = process.env.TWILIO_API_KEY_SID; // API Key SID (starts with SK)
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET; // API Key Secret
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
  if (!actualAccountSid || !apiKeySid || !apiKeySecret || !twilioPhoneNumber || !familyContactPhone || !emergencyServicesPhone) {
    let missingVars = [];
    if (!actualAccountSid) missingVars.push('TWILIO_ACCOUNT_SID_ACTUAL');
    if (!apiKeySid) missingVars.push('TWILIO_API_KEY_SID');
    if (!apiKeySecret) missingVars.push('TWILIO_API_KEY_SECRET');
    if (!twilioPhoneNumber) missingVars.push('TWILIO_PHONE_NUMBER');
    if (!familyContactPhone) missingVars.push('EMERGENCY_CONTACT_PHONE');
    if (!emergencyServicesPhone) missingVars.push('EMERGENCY_SERVICES_PHONE');
    
    const errorMessage = `Twilio service is not configured correctly. Missing environment variables: ${missingVars.join(', ')}. Please contact support or check your .env file.`;
    console.error(errorMessage);
    return {
      success: false,
      message: errorMessage,
    };
  }

  if (!actualAccountSid.startsWith('AC')) {
    const errorMessage = 'Invalid TWILIO_ACCOUNT_SID_ACTUAL. It must start with "AC". Please check your .env file.';
    console.error(errorMessage);
    return { success: false, message: errorMessage };
  }


  const client = Twilio(apiKeySid, apiKeySecret, { accountSid: actualAccountSid });
  const senderName = userName || 'A SmartCare Hub User';
  
  let locationInfo = 'Location not available.';
  if (location) {
    locationInfo = `Their approximate location is: https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  const messageBody = `SOS Alert from SmartCare Hub: ${senderName} has triggered an emergency alert. ${locationInfo} Please respond immediately.`;

  const recipients = [familyContactPhone, emergencyServicesPhone].filter(Boolean); // Filter out potentially empty string for second recipient
  
  if (recipients.length === 0) {
    return { success: false, message: "No recipient phone numbers configured." };
  }

  const smsPromises = recipients.map(recipient => {
    if (!recipient) return Promise.resolve({ to: 'undefined', status: 'skipped', error: 'Recipient number undefined'}); // Should not happen due to filter
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
