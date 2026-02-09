import React, { useState, useCallback, useRef } from 'react';
import { Spinner } from './Spinner';
import { TeamMember, Vendor, Site } from '../App';
import { parseCSVContent } from '../utils/siteTemplateGenerator';
import * as XLSX from 'xlsx';

interface BulkSiteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (sites: Omit<Site, 'id'>[]) => Promise<void>;
  teamMembers: TeamMember[];
  vendors: Vendor[];
}

export const BulkSiteUploadModal: React.FC<BulkSiteUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  teamMembers,
  vendors
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSites, setParsedSites] = useState<Array<{ id: string; data: Omit<Site, 'id'>; errors: string[] }>>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const validateAndParseCSV = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      setUploadErrors([]);
      setParsedSites([]);

      let csvData: any[] = [];

      // Check file type and parse accordingly
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Parse Excel file
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
        csvData = jsonData;
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV file
        const content = await file.text();
        csvData = parseCSVContent(content);
      } else {
        setUploadErrors(['Please upload a CSV or Excel (.xlsx) file']);
        return;
      }

      if (csvData.length === 0) {
        setUploadErrors(['No valid data found in file']);
        return;
      }

      const validatedSites: Array<{ id: string; data: Omit<Site, 'id'>; errors: string[] }> = [];
      const errors: string[] = [];

      csvData.forEach((row, index) => {
        const rowIndex = index + 2; // Account for header row
        const rowErrors: string[] = [];

        // ============= REQUIRED FIELD VALIDATIONS =============
        
        // 1. Site Name (REQUIRED)
        if (!row.siteName?.trim()) {
          rowErrors.push('Site Name is required');
        }

        // 2. Site ID (REQUIRED)
        if (!row.siteId?.trim()) {
          rowErrors.push('Site ID is required');
        }

        // 3. RL ID (REQUIRED)
        if (!row.rlId?.trim()) {
          rowErrors.push('RL ID is required');
        }

        // 4. Location (REQUIRED)
        if (!row.location?.trim()) {
          rowErrors.push('Location is required');
        }

        // 5. Latitude (REQUIRED)
        if (!row.latitude?.trim()) {
          rowErrors.push('Latitude is required');
        } else {
          // Validate latitude format
          const latValue = parseFloat(row.latitude);
          if (isNaN(latValue) || latValue < -90 || latValue > 90) {
            rowErrors.push(`Latitude '${row.latitude}' is invalid. Must be between -90 and 90`);
          }
        }

        // 6. Longitude (REQUIRED)
        if (!row.longitude?.trim()) {
          rowErrors.push('Longitude is required');
        } else {
          // Validate longitude format
          const lngValue = parseFloat(row.longitude);
          if (isNaN(lngValue) || lngValue < -180 || lngValue > 180) {
            rowErrors.push(`Longitude '${row.longitude}' is invalid. Must be between -180 and 180`);
          }
        }

        // 7. Project Type (REQUIRED)
        const validProjectTypes = ['Solar', 'Wind', 'Hydro', 'Thermal', 'Battery', 'Biogas', 'Transmission', 'Distribution'];
        const projectType = row.projectType?.trim();
        if (!projectType) {
          rowErrors.push('Project Type is required');
        } else if (!validProjectTypes.includes(projectType)) {
          rowErrors.push(`Project Type '${projectType}' is invalid. Use one of: ${validProjectTypes.join(', ')}`);
        }

        // 8. Work Type (REQUIRED)
        const workType = row.workType?.trim();
        if (!workType) {
          rowErrors.push('Work Type is required');
        } else if (workType !== 'Civil' && workType !== 'Electrical') {
          rowErrors.push(`Work Type '${workType}' is invalid. Must be 'Civil' or 'Electrical'`);
        }

        // 9. Allocation Date (REQUIRED)
        if (!row.allocationDate?.trim()) {
          rowErrors.push('Allocation Date is required');
        } else {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(row.allocationDate)) {
            rowErrors.push(`Allocation Date '${row.allocationDate}' must be in YYYY-MM-DD format`);
          }
        }

        // 10. Vendor/Client (REQUIRED)
        let vendorId = '';
        let vendorName = '';
        if (row.vendorId?.trim()) {
          const vendor = vendors.find(v => v.id === row.vendorId);
          if (!vendor) {
            rowErrors.push(`Vendor ID '${row.vendorId}' not found`);
          } else {
            vendorId = vendor.id;
            vendorName = vendor.name;
          }
        } else if (row.vendorName?.trim()) {
          const vendor = vendors.find(v => v.name.toLowerCase() === row.vendorName.toLowerCase());
          if (!vendor) {
            rowErrors.push(`Vendor '${row.vendorName}' not found`);
          } else {
            vendorId = vendor.id;
            vendorName = vendor.name;
          }
        } else {
          rowErrors.push('Vendor/Client ID or Name is required');
        }

        // 11. Site Manager (REQUIRED)
        let siteManagerId = '';
        if (!row.siteManagerId?.trim()) {
          rowErrors.push('Site Manager ID is required');
        } else {
          const manager = teamMembers.find(m => m.id === row.siteManagerId);
          if (!manager) {
            rowErrors.push(`Site Manager ID '${row.siteManagerId}' not found`);
          } else {
            siteManagerId = manager.id;
          }
        }

        // 12. Technician Name (REQUIRED)
        if (!row.technicianName?.trim()) {
          rowErrors.push('Technician Name is required');
        }

        // 13. Technician Phone (REQUIRED)
        if (!row.technicianPhone?.trim()) {
          rowErrors.push('Technician Phone Number is required');
        }

        // 14. FSC Name (REQUIRED)
        if (!row.fscName?.trim()) {
          rowErrors.push('FSC Name is required');
        }

        // 15. FSC Phone (REQUIRED)
        if (!row.fscPhone?.trim()) {
          rowErrors.push('FSC Phone Number is required');
        }

        // 16. Planning Recommendation (REQUIRED)
        if (!row.planningRecommendation?.trim()) {
          rowErrors.push('Planning Recommendation is required');
        }

        if (rowErrors.length > 0) {
          errors.push(`Row ${rowIndex}: ${rowErrors.join('; ')}`);
        } else {
          // Create site data with ALL validated information
          const siteData: Omit<Site, 'id'> = {
            siteName: row.siteName!,
            siteId: row.siteId!.trim(),
            rlId: row.rlId!.trim(),
            location: row.location!,
            latitude: row.latitude!.trim(),
            longitude: row.longitude!.trim(),
            projectType: projectType!,
            workType: workType as 'Civil' | 'Electrical',
            initialMaterials: [],
            siteManagerId: siteManagerId,
            vendorId: vendorId,
            vendorName: vendorName,
            technicianName: row.technicianName!.trim(),
            technicianPhone: row.technicianPhone!.trim(),
            fscName: row.fscName!.trim(),
            fscPhone: row.fscPhone!.trim(),
            photos: [],
            documents: [],
            currentStage: 'c1',
            planningRecommendation: row.planningRecommendation!.trim(),
            allocationDate: row.allocationDate!.trim(),
            stages: {
              c1: {
                status: 'not-started',
                assignedTeamIds: siteManagerId ? [siteManagerId] : [],
                startDate: undefined,
                completionDate: undefined
              },
              c2: {
                status: 'not-started',
                assignedTeamIds: [],
                startDate: undefined,
                completionDate: undefined
              },
              c1_c2_combined: {
                status: 'not-started',
                assignedTeamIds: [],
                startDate: undefined,
                completionDate: undefined
              },
              electrical: {
                status: 'not-started',
                assignedTeamIds: [],
                startDate: undefined,
                completionDate: undefined
              }
            }
          };

          validatedSites.push({
            id: `row-${index}`,
            data: siteData,
            errors: rowErrors
          });
        }
      });

      if (errors.length > 0) {
        setUploadErrors(errors);
      }

      setParsedSites(validatedSites);
    } catch (error) {
      setUploadErrors([
        'Error parsing CSV file: ' + (error instanceof Error ? error.message : 'Unknown error')
      ]);
      setParsedSites([]);
    } finally {
      setIsProcessing(false);
    }
  }, [teamMembers, vendors]);

  const handleParseFile = async () => {
    if (!selectedFile) {
      setUploadErrors(['Please select a file']);
      return;
    }
    await validateAndParseCSV(selectedFile);
  };

  const handleConfirmUpload = async () => {
    if (parsedSites.length === 0) {
      setUploadErrors(['No valid sites to upload']);
      return;
    }

    try {
      setIsProcessing(true);
      const sitesToCreate = parsedSites.map(s => s.data);
      await onUpload(sitesToCreate);
      
      // Reset on success
      setSelectedFile(null);
      setParsedSites([]);
      setUploadErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadErrors([
        'Error uploading sites: ' + (error instanceof Error ? error.message : 'Unknown error')
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Upload Filled Template</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">Upload your filled CSV template to bulk create sites</p>
        </div>

        <div className="p-6 space-y-4">
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Select CSV File</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              {selectedFile ? (
                <div className="space-y-2">
                  <p className="text-green-600 font-semibold">✓ File selected: {selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 font-semibold">📁 Drag & drop CSV file here</p>
                  <p className="text-xs text-gray-500">or click to select</p>
                </div>
              )}
            </div>
          </div>

          {/* Parse Button */}
          {selectedFile && parsedSites.length === 0 && (
            <button
              onClick={handleParseFile}
              disabled={isProcessing}
              className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all"
            >
              {isProcessing ? (
                <>
                  <Spinner />
                  <span>Validating...</span>
                </>
              ) : (
                <span>✓ Validate & Preview</span>
              )}
            </button>
          )}

          {/* Error Messages */}
          {uploadErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-red-700 mb-2">⚠ Validation Errors:</h4>
              <ul className="space-y-1 max-h-64 overflow-y-auto">
                {uploadErrors.map((error, i) => (
                  <li key={i} className="text-xs text-red-600">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview Section */}
          {parsedSites.length > 0 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-700">
                  ✓ {parsedSites.length} valid site(s) ready to create
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Preview Sites</label>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Site Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Location</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Vendor</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Project Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedSites.map((site, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 text-gray-700">{i + 1}</td>
                          <td className="px-3 py-2 text-gray-700 font-semibold">{site.data.siteName}</td>
                          <td className="px-3 py-2 text-gray-600">{site.data.location}</td>
                          <td className="px-3 py-2 text-gray-600">{site.data.vendorName}</td>
                          <td className="px-3 py-2 text-blue-600">{site.data.projectType}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setParsedSites([]);
                    setUploadErrors([]);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Choose Another File
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={isProcessing}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Spinner />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>✓ Create {parsedSites.length} Site{parsedSites.length !== 1 ? 's' : ''}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Help Text */}
          {parsedSites.length === 0 && selectedFile === null && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 space-y-2">
              <p className="font-semibold">📋 How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Download the template using "Download Template File" button</li>
                <li>Fill in the required fields for each site row</li>
                <li>Use vendor IDs and manager IDs from the template reference section</li>
                <li>Upload the filled CSV file here</li>
                <li>Review the preview and confirm to create all sites at once</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
