
'use server';

import { getDb } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth'; // To get current user on server for authorization
import type { MedicalRecordClientType } from '@/types';
import { ObjectId } from 'mongodb';

const MAX_FILE_SIZE_SERVER = 5 * 1024 * 1024; // 5MB, consistent with client

interface MedicalRecordDB {
  _id?: ObjectId;
  patientId: ObjectId;
  fileName: string;
  fileType: string; // Full MIME type
  fileSize: number;
  uploadedAt: Date;
  fileData: string; // Base64 data URI
}

function mapDbRecordToClient(dbRecord: MedicalRecordDB): MedicalRecordClientType {
  let simpleType: "image" | "pdf" | "other" = "other";
  if (dbRecord.fileType.startsWith("image/")) {
    simpleType = "image";
  } else if (dbRecord.fileType === "application/pdf") {
    simpleType = "pdf";
  }

  return {
    id: dbRecord._id!.toString(),
    patientId: dbRecord.patientId.toString(),
    name: dbRecord.fileName,
    fileTypeDetail: dbRecord.fileType,
    type: simpleType,
    size: dbRecord.fileSize,
    uploadedAt: new Date(dbRecord.uploadedAt), // Ensure it's a Date object
    filePreview: dbRecord.fileData,
  };
}

export async function uploadMedicalRecordToDB(
  patientId: string,
  fileName: string,
  fileType: string, // Full MIME type
  fileSize: number,
  fileData: string // Base64 data URI
): Promise<{ success: boolean; record?: MedicalRecordClientType; message: string }> {
  const currentUser = getCurrentUser(); // This will be null on server, action needs direct user from client call or other auth
                                    // For now, we trust patientId passed if called from client with logged in user.
                                    // A better approach would be to get user from server session if available.

  if (!patientId || !ObjectId.isValid(patientId)) {
    return { success: false, message: 'Invalid patient ID.' };
  }
  // In a real app, ensure the calling user IS the patientId or has rights.
  // For now, assuming client calls this for their own patientId.

  if (fileSize > MAX_FILE_SIZE_SERVER) {
    return { success: false, message: `File is too large (max ${MAX_FILE_SIZE_SERVER / (1024 * 1024)}MB).` };
  }

  try {
    const db = await getDb();
    const recordsCollection = db.collection<MedicalRecordDB>('medical_records');

    const newRecord: Omit<MedicalRecordDB, '_id'> = {
      patientId: new ObjectId(patientId),
      fileName,
      fileType,
      fileSize,
      uploadedAt: new Date(),
      fileData,
    };

    const result = await recordsCollection.insertOne(newRecord as MedicalRecordDB);

    if (result.insertedId) {
      const insertedRecord = await recordsCollection.findOne({ _id: result.insertedId });
      if (insertedRecord) {
        return {
          success: true,
          record: mapDbRecordToClient(insertedRecord),
          message: 'Medical record uploaded successfully.',
        };
      }
    }
    return { success: false, message: 'Failed to upload medical record.' };
  } catch (error) {
    console.error('Error uploading medical record to DB:', error);
    return { success: false, message: 'An unexpected error occurred during upload.' };
  }
}

export async function getMedicalRecordsForPatientFromDB(patientId: string): Promise<MedicalRecordClientType[] | null> {
  if (!patientId || !ObjectId.isValid(patientId)) {
    console.error('Invalid patientId for getMedicalRecordsForPatientFromDB');
    return null;
  }

  // Again, ensure calling user is this patient or authorized.
  // For now, assuming client calls for their own ID.

  try {
    const db = await getDb();
    const recordsCollection = db.collection<MedicalRecordDB>('medical_records');
    const records = await recordsCollection.find({ patientId: new ObjectId(patientId) }).sort({ uploadedAt: -1 }).toArray();
    return records.map(mapDbRecordToClient);
  } catch (error) {
    console.error('Error fetching medical records from DB:', error);
    return null;
  }
}

export async function deleteMedicalRecordFromDB(recordId: string, patientId: string): Promise<{ success: boolean; message: string }> {
   if (!recordId || !ObjectId.isValid(recordId) || !patientId || !ObjectId.isValid(patientId)) {
    return { success: false, message: 'Invalid record or patient ID.' };
  }
  // Security: Ensure the current user is 'patientId' or an authorized role.
  // For now, we assume client correctly passes patientId for their own record.
  
  try {
    const db = await getDb();
    const recordsCollection = db.collection<MedicalRecordDB>('medical_records');
    
    // Important: Ensure the record belongs to the patient trying to delete it.
    const result = await recordsCollection.deleteOne({ _id: new ObjectId(recordId), patientId: new ObjectId(patientId) });

    if (result.deletedCount === 1) {
      return { success: true, message: 'Medical record deleted successfully.' };
    } else {
      return { success: false, message: 'Record not found or you do not have permission to delete it.' };
    }
  } catch (error) {
    console.error('Error deleting medical record from DB:', error);
    return { success: false, message: 'An unexpected error occurred while deleting the record.' };
  }
}

// Action for doctors to get patient records.
// This action should include authorization checks.
export async function getMedicalRecordsForPatientByDoctor(patientId: string, doctorId: string): Promise<MedicalRecordClientType[] | null> {
  if (!patientId || !ObjectId.isValid(patientId) || !doctorId || !ObjectId.isValid(doctorId)) {
    console.error('Invalid patientId or doctorId for getMedicalRecordsForPatientByDoctor');
    return null;
  }

  try {
    const db = await getDb();
    // Authorization Step 1: Check if the doctor is assigned to the patient.
    const usersCollection = db.collection('users');
    const patientDoc = await usersCollection.findOne({ _id: new ObjectId(patientId), role: 'patient' });

    if (!patientDoc) {
        console.warn(`Patient not found: ${patientId}`);
        return []; // Or null, depending on how you want to handle "patient not found"
    }

    // The assignedDoctorId in the patient document should be a string representation of the doctor's ObjectId.
    // If it's stored as an ObjectId, direct comparison is fine. If string, compare string representations.
    const patientAssignedDoctorId = patientDoc.assignedDoctorId instanceof ObjectId 
                                   ? patientDoc.assignedDoctorId.toString() 
                                   : patientDoc.assignedDoctorId;

    if (patientAssignedDoctorId !== doctorId) {
      console.warn(`Doctor ${doctorId} is not authorized to view records for patient ${patientId}. Assigned: ${patientAssignedDoctorId}`);
      // For now, returning empty. In a real app, might throw an error or return a specific status.
      // Returning empty array for now to avoid breaking UI if doctor accidentally clicks on unassigned patient.
      // A more robust solution would be to prevent the button from appearing for unassigned patients.
      return []; 
    }

    const recordsCollection = db.collection<MedicalRecordDB>('medical_records');
    const records = await recordsCollection.find({ patientId: new ObjectId(patientId) }).sort({ uploadedAt: -1 }).toArray();
    return records.map(mapDbRecordToClient);

  } catch (error) {
    console.error('Error fetching medical records for patient by doctor:', error);
    return null;
  }
}
