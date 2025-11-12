import React, { useState, useCallback, useRef } from 'react';
import { Spinner } from './Spinner';

interface BulkUploadModalProps {
    onClose: () => void;
    onUpload: (file: File) => Promise<{success: number, failed: number, errors: string[]}>;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onClose, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadResult, setUploadResult] = useState<{success: number, failed: number, errors: string[]} | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
            setUploadResult(null); // Reset result when a new file is selected
        }
    };

    const handleUploadClick = useCallback(async () => {
        if (!selectedFile) return;
        setIsProcessing(true);
        setUploadResult(null);
        const result = await onUpload(selectedFile);
        setUploadResult(result);
        setIsProcessing(false);
    }, [selectedFile, onUpload]);
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.classList.add('border-orange-500', 'bg-zinc-700/50');
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.remove('border-orange-500', 'bg-zinc-700/50');
    }
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.classList.remove('border-orange-500', 'bg-zinc-700/50');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        setSelectedFile(e.dataTransfer.files[0]);
        setUploadResult(null);
        e.dataTransfer.clearData();
      }
    };

    return (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={onClose}
        >
            <div 
              className="bg-zinc-800 border border-zinc-700 w-full max-w-lg rounded-2xl shadow-2xl p-8 transform transition-all duration-300"
              onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-zinc-100">Bulk Upload Activities</h2>
                    <button onClick={onClose} className="text-zinc-400 text-2xl font-bold hover:text-white transition-colors">&times;</button>
                </div>
                
                {!uploadResult ? (
                  <>
                    <div className="mb-4 text-sm text-zinc-400 space-y-2">
                        <p>Upload a CSV file with the following 3 columns to add activities to <span className="font-bold text-amber-400">existing sites</span>. The file should <span className="font-bold text-amber-400">not</span> contain a header row.</p>
                        <code className="block bg-zinc-900/50 p-2 rounded-md text-zinc-300 text-xs overflow-x-auto">
                            siteName,assignTo,stage
                        </code>
                         <p className="pt-2 text-xs text-zinc-500">
                           The `siteName` must exactly match an existing site. The `stage` must be 'Civil' or 'Electricals'.
                        </p>
                    </div>

                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center cursor-pointer transition-all mb-4"
                    >
                        <input 
                            type="file" 
                            accept=".csv,text/csv" 
                            onChange={handleFileChange} 
                            ref={fileInputRef}
                            className="hidden"
                        />
                        {selectedFile ? (
                           <p className="text-green-400">File selected: <span className="font-semibold">{selectedFile.name}</span></p>
                        ) : (
                           <p className="text-zinc-400">Drag & drop a CSV file here, or click to select.</p>
                        )}
                    </div>
                    
                    <button
                        onClick={handleUploadClick}
                        disabled={!selectedFile || isProcessing}
                        className="w-full flex justify-center items-center px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700 disabled:bg-orange-500/50 disabled:cursor-not-allowed transition-all"
                    >
                        {isProcessing ? <><Spinner /> <span>Processing...</span></> : "Upload & Process File"}
                    </button>
                  </>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-200 mb-3">Upload Complete</h3>
                    <div className="bg-zinc-900/50 p-4 rounded-md space-y-2">
                        <p className="text-green-400">Successfully processed: <span className="font-bold">{uploadResult.success}</span> activities</p>
                        <p className="text-red-400">Failed to process: <span className="font-bold">{uploadResult.failed}</span> rows</p>
                        {uploadResult.errors.length > 0 && (
                          <div className="pt-2">
                            <h4 className="text-sm font-semibold text-zinc-300 mb-1">Error Details:</h4>
                            <ul className="list-disc list-inside text-xs text-zinc-400 max-h-32 overflow-y-auto bg-zinc-800 p-2 rounded-md">
                              {uploadResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full px-6 py-2 bg-zinc-600 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-all"
                    >
                        Close
                    </button>
                  </div>
                )}
            </div>
        </div>
    );
};