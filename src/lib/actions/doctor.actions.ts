
'use server';

import { getDb } from '@/lib/mongodb';
import type { Patient } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Fetches patients assigned to a specific doctor.
 * @param doctorId The ID of the doctor.
 * @returns A promise that resolves to an array of Patient objects or null if an error occurs.
 */
export async function getAssignedPatients(doctorId: string): Promise<Patient[] | null> {
  if (!ObjectId.isValid(doctorId)) {
    console.error('Invalid doctorId provided to getAssignedPatients');
    return null; 
  }

  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find users who are patients and are assigned to this doctor
    const patientDocuments = await usersCollection.find({
      role: 'patient',
      assignedDoctorId: doctorId, // In the DB, assignedDoctorId should be stored as a string matching the doctor's _id.toString()
    }).toArray();

    if (!patientDocuments) {
      return [];
    }

    const patients: Patient[] = patientDocuments.map(doc => ({
      id: doc._id.toString(),
      name: doc.name as string,
      email: doc.email as string,
      role: 'patient',
      assignedDoctorId: doc.assignedDoctorId as string | null,
      // Other patient-specific fields like dateOfBirth, lastVisit can be added here
      // if they are present in the document. For now, they are not in the base User schema.
    }));

    return patients;
  } catch (error) {
    console.error('Error fetching assigned patients:', error);
    return null; // Or throw error
  }
}
