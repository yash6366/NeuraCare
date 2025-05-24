
'use server';

import { getDb } from '@/lib/mongodb';
import type { AppUser, User, Doctor, Patient } from '@/types';
import { ObjectId } from 'mongodb';

interface UpdateProfileData {
  name?: string;
  phoneNumber?: string;
  address?: string;
  // Email updates are complex (verification, uniqueness) and are omitted for now
}

export async function updateUserProfile(
  userId: string,
  dataToUpdate: UpdateProfileData
): Promise<{ success: boolean; message: string; updatedUser?: AppUser }> {
  if (!userId || !ObjectId.isValid(userId)) {
    return { success: false, message: 'Invalid user ID.' };
  }

  const fieldsToUpdate: Partial<User> = {};
  if (dataToUpdate.name && dataToUpdate.name.trim() !== '') {
    fieldsToUpdate.name = dataToUpdate.name.trim();
  }
  // Allow empty string to clear phone/address
  if (dataToUpdate.phoneNumber !== undefined) {
    fieldsToUpdate.phoneNumber = dataToUpdate.phoneNumber.trim();
  }
  if (dataToUpdate.address !== undefined) {
    fieldsToUpdate.address = dataToUpdate.address.trim();
  }

  if (Object.keys(fieldsToUpdate).length === 0) {
    return { success: false, message: 'No changes to update.' };
  }

  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: fieldsToUpdate },
      { returnDocument: 'after', projection: { passwordHash: 0 } } // Exclude passwordHash
    );

    if (result) {
      // Map the MongoDB document to AppUser type
      const userDoc = result;
      let appUser: AppUser = {
        id: userDoc._id.toString(),
        email: userDoc.email as string,
        name: userDoc.name as string,
        role: userDoc.role as User['role'],
        phoneNumber: userDoc.phoneNumber as string | undefined,
        address: userDoc.address as string | undefined,
      };

      if (appUser.role === 'doctor') {
        (appUser as Doctor).specialty = userDoc.specialty as string || 'N/A';
      } else if (appUser.role === 'patient') {
        (appUser as Patient).assignedDoctorId = userDoc.assignedDoctorId instanceof ObjectId
          ? userDoc.assignedDoctorId.toString()
          : userDoc.assignedDoctorId as string | null;
        (appUser as Patient).emergencyContactPhone = userDoc.emergencyContactPhone as string | undefined;
      }

      return { success: true, message: 'Profile updated successfully.', updatedUser: appUser };
    } else {
      return { success: false, message: 'User not found or update failed.' };
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Check for specific MongoDB errors, e.g., duplicate key for email if we were updating it
    return { success: false, message: 'An unexpected error occurred while updating profile.' };
  }
}
