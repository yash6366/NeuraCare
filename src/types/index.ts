
// Potentially import ObjectId if you need to handle it on the client, though often it's converted to string.
// import type { ObjectId } from 'mongodb';

export interface User {
  id: string; // Typically string representation of MongoDB ObjectId
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  phoneNumber?: string; // General phone number
  address?: string;
  // passwordHash should not be part of client-side AppUser type
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
  medicalId?: string; // Added Medical ID
}

export interface Patient extends User {
  role: 'patient';
  assignedDoctorId: string | null; // string representation of MongoDB ObjectId or null
  emergencyContactPhone?: string; // Specific emergency contact
}

export type AppUser = User | Doctor | Patient;

// Mock data structures (can be expanded or phased out as DB integration progresses)
export interface MockPatientRecord {
  id: string;
  name: string;
  dateOfBirth: string;
  assignedDoctorId: string; // This would now be the doctor's AppUser.id
  lastVisit?: string;
  upcomingAppointment?: string;
}

export interface MockDoctorRecord {
  id: string; // This would be the AppUser.id
  name: string;
  specialty: string;
  email: string;
  phone?: string;
}

// Type for medical records stored and retrieved from the database (client-facing)
export interface MedicalRecordClientType {
  id: string; // MongoDB _id as string
  patientId: string; // patient's user ID as string
  name: string; // Original file name
  fileTypeDetail: string; // Full MIME type from DB (e.g., "image/png", "application/pdf")
  type: "image" | "pdf" | "other"; // Simplified type for client UI logic
  size: number; // in bytes
  uploadedAt: Date;
  filePreview: string; // Base64 data URI for preview/viewing
}
