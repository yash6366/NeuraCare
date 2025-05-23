
"use client";

import type { AppUser } from '@/types';
import { mockUsers } from './mock-data';

const USER_STORAGE_KEY = 'smartcare_user';

export const loginUser = (email: string, password: string): AppUser | null => {
  const foundUser = mockUsers.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (foundUser) {
    const userToStore: AppUser = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role as AppUser['role'],
      ...(foundUser.role === 'doctor' && { specialty: (foundUser as any).specialty }),
      ...(foundUser.role === 'patient' && { assignedDoctorId: (foundUser as any).assignedDoctorId }),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userToStore));
    }
    return userToStore;
  }
  return null;
};

export const logoutUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export const getCurrentUser = (): AppUser | null => {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson) as AppUser;
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem(USER_STORAGE_KEY); // Clear corrupted data
        return null;
      }
    }
  }
  return null;
};
