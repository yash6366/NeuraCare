
// Potentially import ObjectId if you need to handle it on the client, though often it's converted to string.
// import type { ObjectId } from 'mongodb';

export interface User {
  id: string; // Typically string representation of MongoDB ObjectId
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
  // passwordHash should not be part of client-side AppUser type
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
}

export interface Patient extends User {
  role: 'patient';
  assignedDoctorId: string | null; // string representation of MongoDB ObjectId or null
  emergencyContactPhone?: string; // New field for emergency contact
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

