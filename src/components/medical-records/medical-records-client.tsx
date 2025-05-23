
"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; 
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, type Patient } from "@/lib/auth";
import { format } from "date-fns";
import { UploadCloud, ImageIcon, File as FileIcon, Trash2, Eye, FileText, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

interface MedicalRecordFile {
  id: string;
  name: string;
  type: "image" | "pdf" | "other";
  size: number; // in bytes
  uploadedAt: Date;
  filePreview?: string; // For image or PDF Data URI.
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function MedicalRecordsClient() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role === 'patient') {
      setCurrentUser(user as Patient);
      const storedRecordsJson = localStorage.getItem(`medical_records_${user.id}`);
      if (storedRecordsJson) {
        try {
          const storedRecords = JSON.parse(storedRecordsJson) as MedicalRecordFile[];
          setMedicalRecords(storedRecords.map(r => ({...r, uploadedAt: new Date(r.uploadedAt)})));
        } catch (e) {
          console.error("Error parsing medical records from localStorage", e);
          setMedicalRecords([]);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`medical_records_${currentUser.id}`, JSON.stringify(medicalRecords));
    }
  }, [medicalRecords, currentUser]);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `Please select a file smaller than ${MAX_FILE_SIZE / (1024*1024)}MB.`,
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
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    const fileType = selectedFile.type.startsWith("image/") ? "image" : selectedFile.type === "application/pdf" ? "pdf" : "other";
    
    let filePreviewDataUrl: string | undefined = undefined;
    if (fileType === "image" || fileType === "pdf") {
      try {
        filePreviewDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file."));
          reader.readAsDataURL(selectedFile);
        });
      } catch (error) {
        console.error("Error reading file for preview:", error);
        toast({
          title: "File Read Error",
          description: "Could not generate a preview for the file.",
          variant: "destructive",
        });
        setIsUploading(false);
        setUploadProgress(0);
        if(fileInputRef.current) fileInputRef.current.value = "";
        setSelectedFile(null);
        return;
      }
    }

    const newRecord: MedicalRecordFile = {
      id: String(Date.now()),
      name: selectedFile.name,
      type: fileType,
      size: selectedFile.size,
      uploadedAt: new Date(),
      filePreview: filePreviewDataUrl,
    };

    setMedicalRecords(prev => [newRecord, ...prev]);
    toast({
      title: "File Uploaded",
      description: `${selectedFile.name} has been successfully added to your records.`,
    });

    setSelectedFile(null);
    if(fileInputRef.current) fileInputRef.current.value = ""; 
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleDeleteRecord = (recordId: string) => {
    setMedicalRecords(prev => prev.filter(record => record.id !== recordId));
    toast({
      title: "Record Deleted",
      description: "The medical record has been removed.",
    });
  };

  const handleViewRecord = (record: MedicalRecordFile) => {
    if (record.filePreview) {
      if (record.type === "image") {
        const imageWindow = window.open("", "_blank");
        if (imageWindow) {
          imageWindow.document.write(`<html><head><title>${record.name}</title></head><body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background-color:#f0f0f0;"><img src="${record.filePreview}" style="max-width:100%; max-height:100vh;" alt="${record.name}"></body></html>`);
          imageWindow.document.close(); // Important for some browsers
        } else {
          toast({ title: "Popup Blocked", description: "Please allow popups to view the image."});
        }
      } else if (record.type === "pdf") {
        const pdfWindow = window.open(record.filePreview, "_blank"); 
        if (!pdfWindow) {
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

  if (!currentUser) {
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
          <CardDescription>Add images or PDF documents.</CardDescription>
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
              {selectedFile ? `Selected: ${selectedFile.name.substring(0,20)}...` : "Select File (Max 5MB)"}
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
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
            {isUploading ? "Uploading..." : "Upload Record"}
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6 text-primary" />
            Your Medical Records
          </CardTitle>
          <CardDescription>View and manage your uploaded documents.</CardDescription>
        </CardHeader>
        <CardContent>
          {medicalRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No medical records uploaded yet.</p>
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
                      <FileIcon className="h-10 w-10 text-red-600 flex-shrink-0" />
                    ) : (
                      <FileIcon className="h-10 w-10 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="flex-grow min-w-0"> {/* Added min-w-0 for better truncation */}
                      <p className="font-semibold truncate" title={record.name}>{record.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.type.toUpperCase()} - {(record.size / 1024).toFixed(1)} KB - Uploaded: {format(new Date(record.uploadedAt), "PPP p")}
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


    