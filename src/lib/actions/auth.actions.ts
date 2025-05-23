
'use server';

import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import type { AppUser, Patient, Doctor, User } from '@/types';
import { ObjectId } from 'mongodb';

export async function registerUserWithCredentials(formData: {
  fullName: string;
  email: string;
  password: string;
  role?: 'patient' | 'doctor' | 'admin'; // Default to patient if not provided
}): Promise<{ success: boolean; message: string; userId?: string }> {
  const { fullName, email, password, role = 'patient' } = formData;

  if (!fullName || !email || !password) {
    return { success: false, message: 'All fields are required.' };
  }

  try {
    const db = await getDb();
    const usersCollection = db.collection<Omit<User, 'id'> & { _id?: ObjectId, passwordHash: string, specialty?: string, assignedDoctorId?: string | null }>('users');

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { success: false, message: 'User with this email already exists.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: Omit<User, 'id'> & { passwordHash: string, specialty?: string, assignedDoctorId?: string | null } = {
      name: fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
    };
    
    // Add role-specific fields (you might want more sophisticated logic for this)
    if (role === 'doctor') {
        // For now, new doctors won't have a specialty pre-filled or it could be part of registration form
        (newUser as Omit<Doctor, 'id'> & { passwordHash: string }).specialty = 'General Practice'; 
    } else if (role === 'patient') {
        // New patients won't have an assigned doctor initially
        (newUser as Omit<Patient, 'id'> & { passwordHash: string }).assignedDoctorId = null;
    }


    const result = await usersCollection.insertOne(newUser);

    if (result.insertedId) {
      return { success: true, message: 'Registration successful!', userId: result.insertedId.toString() };
    } else {
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'An unexpected error occurred during registration.' };
  }
}

export async function loginUserWithCredentials(formData: {
  email: string;
  password: string;
}): Promise<{ success: boolean; message: string; user?: AppUser | null }> {
  const { email, password } = formData;

  if (!email || !password) {
    return { success: false, message: 'Email and password are required.' };
  }

  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    const userDocument = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!userDocument) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const passwordMatch = await bcrypt.compare(password, userDocument.passwordHash as string);

    if (!passwordMatch) {
      return { success: false, message: 'Invalid email or password.' };
    }

    // Construct the AppUser object
    const appUser: AppUser = {
      id: userDocument._id.toString(),
      email: userDocument.email as string,
      name: userDocument.name as string,
      role: userDocument.role as AppUser['role'],
    };

    if (appUser.role === 'doctor' && userDocument.specialty) {
      (appUser as Doctor).specialty = userDocument.specialty as string;
    }
    if (appUser.role === 'patient' && userDocument.assignedDoctorId) {
       // Ensure assignedDoctorId is a string or null. MongoDB might store it as ObjectId.
      (appUser as Patient).assignedDoctorId = userDocument.assignedDoctorId instanceof ObjectId 
        ? userDocument.assignedDoctorId.toString() 
        : userDocument.assignedDoctorId as string | null;
    } else if (appUser.role === 'patient') {
      (appUser as Patient).assignedDoctorId = null;
    }


    return { success: true, message: 'Login successful!', user: appUser };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An unexpected error occurred during login.', user: null };
  }
}
