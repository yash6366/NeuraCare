
'use server';

import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/mongodb';
import type { AppUser, Patient, Doctor, User } from '@/types';
import { ObjectId } from 'mongodb';

export async function registerUserWithCredentials(formData: {
  fullName: string;
  email: string;
  password: string;
  role?: 'patient' | 'doctor'; // Removed 'admin' role
  emergencyContactPhone?: string;
  medicalId?: string; // Added Medical ID
}): Promise<{ success: boolean; message: string; userId?: string }> {
  const { fullName, email, password, role = 'patient', emergencyContactPhone, medicalId } = formData;

  if (!fullName || !email || !password) {
    return { success: false, message: 'Full name, email, and password are required.' };
  }
  if (password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.'};
  }
  if (role === 'doctor' && (!medicalId || medicalId.trim() === '')) {
    return { success: false, message: 'Medical ID is required for doctors.' };
  }


  try {
    const db = await getDb();
    const usersCollection = db.collection<Omit<User, 'id'> & { _id?: ObjectId, passwordHash: string, specialty?: string, assignedDoctorId?: string | null, emergencyContactPhone?: string, phoneNumber?: string, address?: string, medicalId?: string }>('users');

    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { success: false, message: 'User with this email already exists.' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserDocument: Omit<User, 'id'> & { _id?: ObjectId, passwordHash: string, specialty?: string, assignedDoctorId?: string | null, emergencyContactPhone?: string, phoneNumber?: string, address?: string, medicalId?: string } = {
      name: fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      phoneNumber: '', 
      address: '',     
    };
    
    if (role === 'doctor') {
        (newUserDocument as Omit<Doctor, 'id'> & { passwordHash: string, medicalId?: string }).specialty = 'General Practice'; 
        if (medicalId) {
          (newUserDocument as Omit<Doctor, 'id'> & { passwordHash: string, medicalId?: string }).medicalId = medicalId.trim();
        }
    } else if (role === 'patient') {
        (newUserDocument as Omit<Patient, 'id'> & { passwordHash: string }).assignedDoctorId = null;
        if (emergencyContactPhone && emergencyContactPhone.trim() !== "") {
          (newUserDocument as Omit<Patient, 'id'> & { passwordHash: string }).emergencyContactPhone = emergencyContactPhone.trim();
        }
    }


    const result = await usersCollection.insertOne(newUserDocument);

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

    const appUser: AppUser = {
      id: userDocument._id.toString(),
      email: userDocument.email as string,
      name: userDocument.name as string,
      role: userDocument.role as AppUser['role'],
      phoneNumber: userDocument.phoneNumber as string || '', 
      address: userDocument.address as string || '',       
    };

    if (appUser.role === 'doctor') {
      (appUser as Doctor).specialty = userDocument.specialty as string || 'N/A';
      (appUser as Doctor).medicalId = userDocument.medicalId as string | undefined; // Add medicalId for doctor
    }
    if (appUser.role === 'patient') {
      (appUser as Patient).assignedDoctorId = userDocument.assignedDoctorId instanceof ObjectId 
        ? userDocument.assignedDoctorId.toString() 
        : userDocument.assignedDoctorId as string | null || null;
      (appUser as Patient).emergencyContactPhone = userDocument.emergencyContactPhone as string | undefined;
    }


    return { success: true, message: 'Login successful!', user: appUser };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'An unexpected error occurred during login.', user: null };
  }
}
