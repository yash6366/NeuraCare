
'use server';

import { getDb } from '@/lib/mongodb';
import type { AppUser, Doctor, Patient, User } from '@/types';
import { ObjectId } from 'mongodb';

/**
 * Fetches all users from the database, excluding sensitive information.
 * @returns A promise that resolves to an array of AppUser objects or null if an error occurs.
 */
export async function getAllUsers(): Promise<AppUser[] | null> {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    // Fetch all users, explicitly excluding the passwordHash
    const userDocuments = await usersCollection.find({}, { projection: { passwordHash: 0 } }).toArray();

    if (!userDocuments) {
      return [];
    }

    const allUsers: AppUser[] = userDocuments.map(doc => {
      const baseUser: User = {
        id: doc._id.toString(),
        name: doc.name as string,
        email: doc.email as string,
        role: doc.role as User['role'],
      };

      if (baseUser.role === 'doctor') {
        return {
          ...baseUser,
          role: 'doctor',
          specialty: doc.specialty as string || 'N/A', // Provide default if specialty is missing
        } as Doctor;
      } else if (baseUser.role === 'patient') {
        return {
          ...baseUser,
          role: 'patient',
          assignedDoctorId: doc.assignedDoctorId instanceof ObjectId
            ? doc.assignedDoctorId.toString()
            : doc.assignedDoctorId as string | null,
        } as Patient;
      }
      return baseUser as AppUser; // For admin or other roles
    });

    return allUsers;
  } catch (error) {
    console.error('Error fetching all users:', error);
    return null;
  }
}
