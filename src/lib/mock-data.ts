
import type { MockDoctorRecord, MockPatientRecord } from '@/types';

export const mockDoctors: MockDoctorRecord[] = [
  { id: 'doc1', name: 'Dr. Stephen Strange', specialty: 'Neurosurgery', email: 's.strange@clinic.com', phone: '555-0101' },
  { id: 'doc2', name: 'Dr. Meredith Grey', specialty: 'General Surgery', email: 'm.grey@clinic.com', phone: '555-0102' },
  { id: 'doc3', name: 'Dr. Alisha Khan', specialty: 'Pediatrics', email: 'a.khan@clinic.com', phone: '555-0103' },
  { id: 'doc4', name: 'Dr. Rohan Sharma', specialty: 'Cardiology', email: 'r.sharma@clinic.com', phone: '555-0104' },
  { id: 'doc5', name: 'Dr. Priya Patel', specialty: 'Dermatology', email: 'p.patel@clinic.com', phone: '555-0105' },
];

export const mockPatients: MockPatientRecord[] = [
  { id: 'pat1', name: 'John Doe', dateOfBirth: '1985-07-22', assignedDoctorId: 'doc1', lastVisit: '2024-03-15', upcomingAppointment: '2024-08-10 at 10:00 AM' },
  { id: 'pat2', name: 'Jane Smith', dateOfBirth: '1992-11-05', assignedDoctorId: 'doc1', lastVisit: '2024-05-01', upcomingAppointment: '2024-09-05 at 02:30 PM' },
  { id: 'pat3', name: 'Peter Parker', dateOfBirth: '2001-08-10', assignedDoctorId: 'doc2', lastVisit: '2024-06-20' },
  { id: 'pat4', name: 'Mary Jane Watson', dateOfBirth: '2002-01-15', assignedDoctorId: 'doc2', upcomingAppointment: '2024-07-30 at 11:00 AM'},
  { id: 'pat5', name: 'Amit Singh', dateOfBirth: '1978-03-12', assignedDoctorId: 'doc4', lastVisit: '2024-07-01' },
  { id: 'pat6', name: 'Sunita Rao', dateOfBirth: '1995-09-25', assignedDoctorId: 'doc3', upcomingAppointment: '2024-08-15 at 03:00 PM' },
];

// Sample User Credentials for Login
export const mockUsers = [
  { id: 'admin01', email: 'admin123@gmail.com', password: 'Admin@123', name: 'Admin User', role: 'admin' },
  { id: 'doc1', email: 'doctor.strange@example.com', password: 'Doctor@123', name: 'Dr. Stephen Strange', role: 'doctor', specialty: 'Neurosurgery' },
  { id: 'pat1', email: 'patient.doe@example.com', password: 'Patient@123', name: 'John Doe', role: 'patient', assignedDoctorId: 'doc1' },
  { id: 'doc2', email: 'doctor.grey@example.com', password: 'Doctor@123', name: 'Dr. Meredith Grey', role: 'doctor', specialty: 'General Surgery' },
  { id: 'pat2', email: 'patient.smith@example.com', password: 'Patient@123', name: 'Jane Smith', role: 'patient', assignedDoctorId: 'doc1' },
];

