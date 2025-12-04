import React, { useState, useRef } from 'react';
import { CameraModal } from './CameraModal';

interface FileInputProps {
  id: string;
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  acceptedFileTypes: string;
  multiple?: boolean;
  icon: React.ReactNode;
  iconColorClass: string;
  showCameraButton?: boolean;
}

export const FileInput: React.FC<FileInputProps> = ({
  id,
  label,
  files,
  onFilesChange,
  acceptedFileTypes,
  multiple = true,
  icon,
  iconColorClass,
  showCameraButton = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      console.log(`[FileInput ${id}] Selected files:`, newFiles.map(f => f.name));
      const uniqueNewFiles = newFiles.filter(newFile => 
        !files.some(existingFile => 
          existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      );
      console.log(`[FileInput ${id}] Unique new files:`, uniqueNewFiles.map(f => f.name));
      onFilesChange([...files, ...uniqueNewFiles]);
    }
  };
  
  const handleCapture = (capturedFile: File) => {
    onFilesChange([...files, capturedFile]);
    setIsCameraOpen(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (fileNameToRemove: string, fileLastModified: number) => {
    onFilesChange(files.filter(file => !(file.name === fileNameToRemove && file.lastModified === fileLastModified)));
  };
  
  const labelStyles = "block text-sm font-medium text-zinc-300 mb-2";

  return (
    <div>
      <label htmlFor={id} className={labelStyles}>{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-orange-500 bg-zinc-700/50' : 'border-zinc-600 hover:border-zinc-500'}`}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          multiple={multiple}
          accept={acceptedFileTypes}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center text-zinc-400">
           <div className={`w-10 h-10 mb-2 ${iconColorClass}`}>
             {icon}
           </div>
           <p className="text-sm">
            <span className="font-semibold text-orange-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-zinc-500 mt-1">{acceptedFileTypes.replace('image/*', 'Image files').replace(/\./g, ' ')}</p>
           {showCameraButton && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsCameraOpen(true); }}
              className="mt-3 text-sm px-3 py-1 bg-blue-600/20 text-blue-300 font-semibold rounded-md hover:bg-blue-600/40"
            >
              Use Camera
            </button>
          )}
        </div>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between bg-zinc-700/50 p-2 rounded-md text-sm text-zinc-300">
                <div className="flex items-center gap-2 overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                    <span className="truncate" title={file.name}>{file.name}</span>
                </div>
              <button
                type="button"
                onClick={() => handleRemoveFile(file.name, file.lastModified)}
                className="ml-2 text-red-500 hover:text-red-400 transition-colors flex-shrink-0"
                aria-label={`Remove ${file.name}`}
              >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      {isCameraOpen && <CameraModal onCapture={handleCapture} onClose={() => setIsCameraOpen(false)} />}
    </div>
  );
};