
"use client";

import type { AppUser } from '@/types';
// mockUsers is no longer the source of truth for login. It can be kept for demo/reference or removed.
// import { mockUsers } from './mock-data'; 
import { loginUserWithCredentials } from './actions/auth.actions';


const USER_STORAGE_KEY = 'smartcare_user';

// This function is now a client-side wrapper that calls the server action
export const loginUser = async (email: string, password: string): Promise<AppUser | null> => {
  const result = await loginUserWithCredentials({ email, password });

  if (result.success && result.user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(result.user));
    }
    return result.user;
  }
  // Optionally, you could throw an error or return a more detailed error object
  // For now, just returning null on failure to match previous behavior.
  // The toast message will be handled in the component based on result.message.
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
