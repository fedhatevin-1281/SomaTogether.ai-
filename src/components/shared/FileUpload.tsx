import React, { useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { 
  Upload, 
  File, 
  Image, 
  X, 
  Loader2,
  Paperclip,
  Download
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
}

interface FileUploadProps {
  onFileSelect: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  maxFiles = 5,
  maxSize = 10,
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  disabled = false,
  className = ''
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Validate file count
    if (fileArray.length > maxFiles) {
      alert(`You can only upload ${maxFiles} files at once`);
      return;
    }

    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB`);
        return false;
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });

      if (!isValidType) {
        alert(`File ${file.name} is not a supported type`);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedFiles = await Promise.all(
        validFiles.map(file => uploadFile(file))
      );

      const newFiles = [...uploadedFiles, ...uploadedFiles];
      setUploadedFiles(newFiles);
      onFileSelect(newFiles);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `messages/${fileName}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('message-attachments')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('message-attachments')
      .getPublicUrl(filePath);

    // Generate preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    return {
      id: fileName,
      name: file.name,
      type: file.type,
      size: file.size,
      url: data.publicUrl,
      preview
    };
  };

  const removeFile = (fileId: string) => {
    const newFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(newFiles);
    onFileSelect(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-slate-600">Uploading files...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-sm text-slate-600 mb-1">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-slate-500">
                Max {maxFiles} files, {maxSize}MB each
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Attached Files</h4>
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center space-x-3">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                    {getFileIcon(file.type)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(file.url, '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



