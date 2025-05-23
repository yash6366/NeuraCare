
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'patient';
}

export interface Doctor extends User {
  role: 'doctor';
  specialty: string;
}

export interface Patient extends User {
  role: 'patient';
  assignedDoctorId: string | null;
}

export type AppUser = User | Doctor | Patient;

// Mock data structures (can be expanded)
export interface MockPatientRecord {
  id: string;
  name: string;
  dateOfBirth: string;
  assignedDoctorId: string;
  lastVisit?: string;
  upcomingAppointment?: string;
}

export interface MockDoctorRecord {
  id: string;
  name: string;
  specialty: string;
  email: string; // For contact, not login
  phone?: string;
}
