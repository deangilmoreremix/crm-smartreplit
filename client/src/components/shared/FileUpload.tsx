import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, FileText, Image, FileSpreadsheet, RefreshCw } from 'lucide-react';

interface FileUploadProps {
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  onFilesAdded: (files: File[]) => void;
  fileType?: 'document' | 'image' | 'any';
  className?: string;
  isUploading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept,
  maxFiles = 1,
  maxSize = 10485760, // 10MB default
  onFilesAdded,
  fileType = 'any',
  className = '',
  isUploading = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Default accepted file types by category
  const defaultAccept = {
    document: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt']
    },
    image: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    any: {
      'image/*': [],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'application/json': ['.json']
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const firstRejection = rejectedFiles[0];
      if (firstRejection.errors[0].code === 'file-too-large') {
        setError(`File too large. Maximum size is ${maxSize / 1048576}MB.`);
      } else if (firstRejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please check accepted formats.');
      } else {
        setError(firstRejection.errors[0].message);
      }
      return;
    }

    setError(null);
    
    if (acceptedFiles.length > 0) {
      const newFiles = [...uploadedFiles];
      
      // Handle maxFiles limit
      if (newFiles.length + acceptedFiles.length > maxFiles) {
        if (maxFiles === 1) {
          // Replace the current file
          newFiles.splice(0, newFiles.length);
        } else {
          // Remove oldest files to make room
          newFiles.splice(0, (newFiles.length + acceptedFiles.length) - maxFiles);
        }
      }
      
      const updatedFiles = [...newFiles, ...acceptedFiles];
      setUploadedFiles(updatedFiles);
      onFilesAdded(updatedFiles);
    }
  }, [maxFiles, maxSize, onFilesAdded, uploadedFiles]);

  const removeFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
    onFilesAdded(newFiles);
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: accept || defaultAccept[fileType]
  });

  // Get file icon based on type
  const getFileIcon = (file: File) => {
    const fileType = file.type;
    
    if (fileType.startsWith('image/')) {
      return <Image size={18} className="text-purple-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileSpreadsheet size={18} className="text-green-500" />;
    } else if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) {
      return <FileText size={18} className="text-blue-500" />;
    } else {
      return <File size={18} className="text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 cursor-pointer transition ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : uploadedFiles.length > 0 
              ? 'border-green-300 bg-green-50'
              : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="text-center py-4">
            <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600 font-medium">Uploading...</p>
            <p className="text-xs text-gray-500">Please wait while your files are being processed</p>
          </div>
        ) : uploadedFiles.length > 0 ? (
          <div>
            <ul className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center overflow-hidden">
                    {getFileIcon(file)}
                    <span className="ml-2 text-sm font-medium text-gray-700 truncate">{file.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
            {maxFiles > uploadedFiles.length && (
              <div className="text-center mt-4">
                <button className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center">
                  <Upload size={14} className="mr-1.5" />
                  Add more files
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload size={36} className="mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">
                {isDragActive 
                  ? 'Drop files here' 
                  : 'Drag & drop files here or click to browse'
                }
              </span>
            </p>
            <p className="text-xs text-gray-500">
              {fileType === 'document' && 'Supported formats: PDF, DOC, DOCX, PPT, TXT'}
              {fileType === 'image' && 'Supported formats: JPG, PNG, GIF, WebP'}
              {fileType === 'any' && 'Upload any files for processing'}
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUpload;