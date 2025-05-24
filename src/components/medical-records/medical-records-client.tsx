
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, type Patient } from "@/lib/auth";
import { format } from "date-fns";
import { UploadCloud, File as FileIconLucide, Trash2, Eye, FileText, AlertTriangle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import type { MedicalRecordClientType } from "@/types";
import {
  uploadMedicalRecordToDB,
  getMedicalRecordsForPatientFromDB,
  deleteMedicalRecordFromDB,
} from "@/lib/actions/medical.actions";

const MAX_FILE_SIZE_CLIENT = 5 * 1024 * 1024; // 5MB

export function MedicalRecordsClient() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordClientType[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role === 'patient') {
      setCurrentUser(user as Patient);
      fetchRecords(user.id);
    } else {
      setIsLoadingRecords(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecords = async (patientId: string) => {
    setIsLoadingRecords(true);
    const records = await getMedicalRecordsForPatientFromDB(patientId);
    if (records) {
      setMedicalRecords(records);
    } else {
      toast({
        title: "Error Fetching Records",
        description: "Could not load your medical records from the database.",
        variant: "destructive",
      });
      setMedicalRecords([]);
    }
    setIsLoadingRecords(false);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE_CLIENT) {
        toast({
          title: "File Too Large",
          description: `Please select a file smaller than ${MAX_FILE_SIZE_CLIENT / (1024 * 1024)}MB.`,
          variant: "destructive",
        });
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) {
      toast({
        title: "No File Selected or User Error",
        description: "Please select a file to upload and ensure you are logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress for reading file, actual upload progress is not easily tracked with server actions
    await new Promise(resolve => setTimeout(() => { setUploadProgress(30); resolve(null); }, 200));


    let fileDataUrl: string;
    try {
      fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(selectedFile);
      });
      setUploadProgress(60);
    } catch (error) {
      console.error("Error reading file for upload:", error);
      toast({
        title: "File Read Error",
        description: "Could not process the file for upload.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
      if(fileInputRef.current) fileInputRef.current.value = "";
      setSelectedFile(null);
      return;
    }

    const result = await uploadMedicalRecordToDB(
      currentUser.id,
      selectedFile.name,
      selectedFile.type, // Full MIME type
      selectedFile.size,
      fileDataUrl
    );

    setUploadProgress(100);

    if (result.success && result.record) {
      setMedicalRecords(prev => [result.record!, ...prev].sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()));
      toast({
        title: "File Uploaded",
        description: `${selectedFile.name} has been successfully added to your records.`,
      });
    } else {
      toast({
        title: "Upload Failed",
        description: result.message || "Could not upload the file to the database.",
        variant: "destructive",
      });
    }

    setSelectedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!currentUser) return;
    const originalRecords = [...medicalRecords];
    setMedicalRecords(prev => prev.filter(record => record.id !== recordId)); // Optimistic update

    const result = await deleteMedicalRecordFromDB(recordId, currentUser.id);

    if (result.success) {
      toast({
        title: "Record Deleted",
        description: result.message,
      });
    } else {
      setMedicalRecords(originalRecords); // Revert on failure
      toast({
        title: "Deletion Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleViewRecord = (record: MedicalRecordClientType) => {
    if (record.filePreview) { // filePreview is the base64 data URI
      if (record.type === "image") {
        const imageWindow = window.open("", "_blank");
        if (imageWindow) {
          imageWindow.document.write(`<html><head><title>${record.name}</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background-color:#f0f0f0;"><img src="${record.filePreview}" style="max-width:100%; max-height:100vh;" alt="${record.name}"></body></html>`);
          imageWindow.document.close();
        } else {
          toast({ title: "Popup Blocked", description: "Please allow popups to view the image."});
        }
      } else if (record.type === "pdf") {
        const pdfWindow = window.open("", "_blank");
        if (pdfWindow) {
          pdfWindow.document.write(
            `<html><head><title>${record.name}</title><style>body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; } iframe { border: none; width: 100%; height: 100%; }</style></head><body><iframe src="${record.filePreview}"></iframe></body></html>`
          );
          pdfWindow.document.close();
        } else {
            toast({ title: "Popup Blocked", description: "Please allow popups to view the PDF."});
        }
      } else {
         toast({ title: "Preview Not Supported", description: `Cannot preview this file type (${record.type}) directly.` });
      }
    } else {
      toast({
        title: "No Preview Available",
        description: `No preview data found for ${record.name}. It might be an unsupported file type or an error occurred during upload.`,
      });
    }
  };

  if (!currentUser && !isLoadingRecords) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You must be logged in as a patient to view and manage medical records.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <Card className="md:col-span-1 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UploadCloud className="h-6 w-6 text-primary" />
            Upload New Record
          </CardTitle>
          <CardDescription>Add images or PDF documents (Max 5MB).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="sr-only">Choose file</Label>
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,application/pdf"
              className="hidden"
              disabled={isUploading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
              disabled={isUploading}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              {selectedFile ? `Selected: ${selectedFile.name.substring(0,20)}...` : "Select File"}
            </Button>
          </div>
          {selectedFile && (
            <div className="text-xs text-muted-foreground">
              Type: {selectedFile.type}, Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
          {isUploading && (
            <div className="space-y-1">
              <Label>Uploading...</Label>
              <Progress value={uploadProgress} className="w-full h-2" />
            </div>
          )}
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading || !currentUser} className="w-full">
            {isUploading ? "Uploading..." : "Upload to Database"}
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            Your Medical Records
          </CardTitle>
          <CardDescription>View and manage your documents stored in the database.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <div className="flex justify-center items-center py-10">
                <Activity className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading records...</p>
            </div>
          ) : medicalRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No medical records found in the database.</p>
          ) : (
            <ul className="space-y-4">
              {medicalRecords.map(record => (
                <li key={record.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 flex-grow">
                    {record.type === "image" && record.filePreview ? (
                      <Image
                        src={record.filePreview}
                        alt={record.name}
                        width={48}
                        height={48}
                        className="rounded object-cover h-12 w-12"
                        data-ai-hint="medical document"
                      />
                    ) : record.type === "pdf" ? (
                      <FileIconLucide className="h-10 w-10 text-red-600 flex-shrink-0" />
                    ) : (
                      <FileIconLucide className="h-10 w-10 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-grow min-w-0">
                      <p className="font-semibold truncate" title={record.name}>{record.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.fileTypeDetail.toUpperCase()} - {(record.size / 1024).toFixed(1)} KB - Uploaded: {format(new Date(record.uploadedAt), "PPP p")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleViewRecord(record)} disabled={!record.filePreview && record.type !== 'other'}>
                      <Eye className="mr-1 h-4 w-4" /> View
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteRecord(record.id)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
