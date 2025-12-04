import React, { useState, useEffect, useMemo } from 'react';
import { Site, TeamMember, Vendor } from '../App';
import { MaterialItem } from '../services/geminiService';
import { FileInput } from './FileInput';

interface SiteFormProps {
    onBack: () => void;
    onSubmit: (siteData: Site | Omit<Site, 'id'>) => Promise<void> | void;
    initialData?: Site | null;
    teamMembers: TeamMember[];
    vendors: Vendor[];
    onAddVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
    canAddAttachments: boolean;
    currentUser: any;
}

const predefinedMaterials = [
  "95 Sq MM Black", "95 Sq MM Red", "70 Sq MM Black", "70 Sq MM Red",
  "50 Sq MM Black", "50 Sq MM Red", "35 Sq MM Black", "35 Sq MM Red",
  "16 Sq MM Green", "4 Sq MM 2Core Copper", "6 Sq MM 2 Core Copper",
  "16 Sq MM 2 Core Copper", "2.5 Sq MM 2 Core Copper", "0.5 Alaram Cable",
  "35 Sq MM 2 Core Copper", "GI Strip", "HDPE Pipe", "25 MM Flexible",
  "40 MM Flexible", "10 Pair Alaram Cable"
];

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

const initialFormData: Omit<Site, 'id'> = {
    siteName: '',
    location: '',
    latitude: '',
    longitude: '',
    projectType: 'Solar',
    workType: undefined,
    initialMaterials: [],
    siteManagerId: '',
    vendorId: '',
    vendorName: '',
    photos: [],
    documents: [],
    currentStage: 'c1', // Start with C1 stage (Civil Phase 1)
    stages: {
        c1: {
            status: 'not-started',
            assignedTeamIds: [],
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

export const SiteForm: React.FC<SiteFormProps> = ({ onBack, onSubmit, initialData, teamMembers, vendors, onAddVendor, canAddAttachments, currentUser }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [photos, setPhotos] = useState<File[]>([]);
    const [documents, setDocuments] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');

    const isEditing = !!initialData;

    const assignableTeamMembers = useMemo(() => {
        return teamMembers.filter(member => 
            member.role === 'Civil' || member.role === 'Electricals' || member.role === 'Electrical + Civil'
        );
    }, [teamMembers]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                siteName: initialData.siteName,
                location: initialData.location,
                latitude: initialData.latitude || '',
                longitude: initialData.longitude || '',
                projectType: initialData.projectType,
                workType: initialData.workType,
                initialMaterials: initialData.initialMaterials || [],
                siteManagerId: initialData.siteManagerId || '',
                vendorId: initialData.vendorId || '',
                vendorName: initialData.vendorName || '',
                photos: initialData.photos || [],
                documents: initialData.documents || [],
                // Handle backward compatibility for sites created before 4-stage tracking
                currentStage: initialData.currentStage || 'c1',
                stages: initialData.stages || {
                    c1: {
                        status: 'not-started',
                        assignedTeamIds: initialData.siteManagerId ? [initialData.siteManagerId] : [],
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
            });
        } else {
            const defaultManagerId = assignableTeamMembers.length > 0 ? assignableTeamMembers[0].id : '';
            setFormData({ 
                ...initialFormData, 
                siteManagerId: defaultManagerId,
                stages: {
                    ...initialFormData.stages,
                    c1: {
                        ...initialFormData.stages.c1,
                        assignedTeamIds: defaultManagerId ? [defaultManagerId] : []
                    }
                }
            });
        }
    }, [initialData, assignableTeamMembers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMaterialChange = (index: number, field: keyof MaterialItem, value: string) => {
        const newMaterials = [...formData.initialMaterials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setFormData(prev => ({ ...prev, initialMaterials: newMaterials }));
    };

    const addMaterialRow = () => {
        setFormData(prev => ({ 
            ...prev, 
            initialMaterials: [...prev.initialMaterials, { id: Date.now().toString(), name: predefinedMaterials[0], units: '', used: '0' }] 
        }));
    };

    const removeMaterialRow = (index: number) => {
        setFormData(prev => ({ 
            ...prev, 
            initialMaterials: prev.initialMaterials.filter((_, i) => i !== index) 
        }));
    };

    const handleRemoveExistingAttachment = (type: 'photos' | 'documents', name: string) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type]?.filter(attachment => attachment.name !== name) || []
        }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.siteName.trim()) newErrors.siteName = "Site Name is required.";
        if (!formData.location.trim()) newErrors.location = "Location is required.";
        // Relax legacy requirement: require EITHER a legacy manager OR at least one stage team assignment
        const hasAnyTeamAssigned = (formData.stages?.c1?.assignedTeamIds?.length || 0) > 0 || 
                                   (formData.stages?.c2?.assignedTeamIds?.length || 0) > 0 ||
                                   (formData.stages?.c1_c2_combined?.assignedTeamIds?.length || 0) > 0 ||
                                   (formData.stages?.electrical?.assignedTeamIds?.length || 0) > 0;
        if (!formData.siteManagerId && !hasAnyTeamAssigned) {
            newErrors.siteManagerId = "Assign a legacy manager or at least one stage team.";
        }
        formData.initialMaterials.forEach((mat, index) => {
            if (!mat.units.trim() || isNaN(Number(mat.units))) {
                newErrors[`material_units_${index}`] = "Must be a number.";
            }
             if (mat.used.trim() && isNaN(Number(mat.used))) {
                newErrors[`material_used_${index}`] = "Must be a number.";
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAddVendorQuick = async () => {
        if (!newVendorName.trim()) {
            alert('Please enter vendor name');
            return;
        }

        try {
            const vendorData = {
                name: newVendorName.trim(),
                createdAt: new Date().toISOString(),
                createdBy: currentUser.id
            };
            
            await onAddVendor(vendorData);
            
            // Find the newly added vendor (it will be in the vendors list after the promise resolves)
            // Since we don't have the ID here, we'll need to wait a moment for the subscription to update
            setTimeout(() => {
                const newVendor = vendors.find(v => v.name === newVendorName.trim());
                if (newVendor) {
                    setFormData({
                        ...formData,
                        vendorId: newVendor.id,
                        vendorName: newVendor.name
                    });
                }
                setNewVendorName('');
                setIsAddVendorModalOpen(false);
            }, 500);
        } catch (error) {
            console.error('Error adding vendor:', error);
            alert('Failed to add vendor');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('=== FORM SUBMITTED ===');
        const isValid = validate();
        console.log('Validation passed:', isValid);
        if (!isValid) {
            console.log('Validation errors:', errors);
            alert('Please fill all required fields');
            return;
        }
        
        try {
            console.log('=== SITE FORM SUBMIT DEBUG ===');
            console.log('Photos to upload:', photos.length);
            console.log('Documents to upload:', documents.length);
            
            // Convert files to data URLs only if they exist
            let photoAttachments: { name: string; dataUrl: string }[] = [];
            let documentAttachments: { name: string; dataUrl: string }[] = [];
            
            if (photos.length > 0) {
                console.log('Converting photos to dataUrl...');
                photoAttachments = await Promise.all(photos.map(async (file) => {
                    const dataUrl = await fileToDataUrl(file);
                    console.log(`Photo converted: ${file.name}, size: ${dataUrl.length}`);
                    return { name: file.name, dataUrl };
                }));
            }
            
            if (documents.length > 0) {
                console.log('Converting documents to dataUrl...');
                documentAttachments = await Promise.all(documents.map(async (file) => {
                    const dataUrl = await fileToDataUrl(file);
                    console.log(`Document converted: ${file.name}, size: ${dataUrl.length}`);
                    return { name: file.name, dataUrl };
                }));
            }

            console.log('Photo attachments created:', photoAttachments.length);
            console.log('Document attachments created:', documentAttachments.length);

            let submissionData: Omit<Site, 'id'> = {
                ...formData,
                photos: [...(formData.photos || []), ...photoAttachments],
                documents: [...(formData.documents || []), ...documentAttachments],
                // Initialize C1 stage as 'in-progress' if team members are assigned
                stages: {
                    ...formData.stages,
                    c1: {
                        ...formData.stages.c1,
                        status: formData.stages.c1.assignedTeamIds.length > 0 ? 'in-progress' : 'not-started',
                        startDate: formData.stages.c1.assignedTeamIds.length > 0 && !formData.stages.c1.startDate 
                            ? new Date().toISOString() 
                            : formData.stages.c1.startDate
                    }
                }
            };

            console.log('Submission data prepared, calling onSubmit...');
            if (isEditing && initialData) {
                await onSubmit({ ...submissionData, id: initialData.id });
            } else {
                await onSubmit(submissionData);
            }
            console.log('Site submission completed successfully');
        } catch (error) {
            console.error('Error submitting site:', error);
            alert('Error creating site: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // Updated modern light theme styles
    const inputStyles = "w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-semibold text-gray-700 mb-2";

    return (
        <div className="w-full animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-6">
                &larr; Back
            </button>
          <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 space-y-8">
              <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                   {isEditing ? 'Edit Site' : 'Create New Site'}
                 </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="siteName" className={labelStyles}>Site Name</label>
                        <input id="siteName" name="siteName" type="text" value={formData.siteName} onChange={handleChange} className={inputStyles} />
                        {errors.siteName && <p className="text-red-400 text-xs mt-1">{errors.siteName}</p>}
                    </div>
                    <div>
                        <label htmlFor="location" className={labelStyles}>Location</label>
                        <input id="location" name="location" type="text" value={formData.location} onChange={handleChange} className={inputStyles} />
                        {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
                    </div>
                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Coordinates (Optional)</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <input aria-label="Latitude" placeholder="Latitude" name="latitude" type="text" value={formData.latitude} onChange={handleChange} className={inputStyles + ' text-sm'} />
                                            </div>
                                            <div>
                                                <input aria-label="Longitude" placeholder="Longitude" name="longitude" type="text" value={formData.longitude} onChange={handleChange} className={inputStyles + ' text-sm'} />
                                            </div>
                                        </div>
                                        {(formData.latitude || formData.longitude) && (
                                            <p className="mt-2 text-xs text-gray-500">Lat: {formData.latitude || '—'} | Lng: {formData.longitude || '—'}</p>
                                        )}
                                    </div>
                                </div>
                {/* Vendor Selection */}
                <div>
                    <label htmlFor="vendorId" className={labelStyles}>Vendor/Client <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <select 
                            id="vendorId" 
                            name="vendorId" 
                            value={formData.vendorId} 
                            onChange={(e) => {
                                const selectedVendor = vendors.find(v => v.id === e.target.value);
                                setFormData({
                                    ...formData,
                                    vendorId: e.target.value,
                                    vendorName: selectedVendor?.name || ''
                                });
                            }} 
                            className={inputStyles}
                            required
                        >
                            <option value="">Select Vendor/Client</option>
                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                        <button
                            type="button"
                            onClick={() => setIsAddVendorModalOpen(true)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition-all whitespace-nowrap"
                            title="Add new vendor"
                        >
                            ➕ New
                        </button>
                    </div>
                    {errors.vendorId && <p className="text-red-400 text-xs mt-1">{errors.vendorId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="projectType" className={labelStyles}>Project Type</label>
                        <select id="projectType" name="projectType" value={formData.projectType} onChange={handleChange} className={inputStyles}>
                            <option>Solar</option>
                            <option>DG</option>
                            <option>5G</option>
                            <option>GBT</option>
                            <option>Sharing</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="workType" className={labelStyles}>Work Type</label>
                        <select id="workType" name="workType" value={formData.workType || ''} onChange={handleChange} className={inputStyles}>
                            <option value="">Select Work Type</option>
                            <option value="Civil">Civil</option>
                            <option value="Electrical">Electrical</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="siteManagerId" className={labelStyles}>Site Manager (Legacy)</label>
                        <select id="siteManagerId" name="siteManagerId" value={formData.siteManagerId} onChange={handleChange} className={inputStyles} disabled={assignableTeamMembers.length === 0}>
                            <option value="">{assignableTeamMembers.length > 0 ? 'Select a Team Member' : 'No Civil or Electrical members available'}</option>
                            {assignableTeamMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                        </select>
                        {errors.siteManagerId && <p className="text-red-400 text-xs mt-1">{errors.siteManagerId}</p>}
                    </div>
                </div>
                
                {/* Work Stage Team Assignment */}
                <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Stage Team Assignment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* C1 Stage Team */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <label className={labelStyles + " text-blue-800"}>
                                C1 Stage Team (Civil Phase 1)
                                <span className="ml-2 text-xs font-normal text-blue-600">(Stage 1)</span>
                            </label>
                            <select 
                                multiple
                                size={5}
                                value={formData.stages.c1.assignedTeamIds}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        stages: {
                                            ...prev.stages,
                                            c1: { ...prev.stages.c1, assignedTeamIds: selected }
                                        }
                                    }));
                                }}
                                className={inputStyles + " h-32"}
                            >
                                {assignableTeamMembers
                                    .filter(m => m.role === 'Civil' || m.role === 'Electrical + Civil')
                                    .map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))}
                            </select>
                            <p className="text-xs text-blue-600 mt-2">Hold Ctrl/Cmd to select multiple team members</p>
                            {formData.stages.c1.assignedTeamIds.length > 0 && (
                                <div className="mt-2 text-xs text-blue-700">
                                    Selected: {formData.stages.c1.assignedTeamIds.length} member(s)
                                </div>
                            )}
                        </div>
                        
                        {/* Electrical Stage Team */}
                        <div className="bg-amber-50 p-4 rounded-lg">
                            <label className={labelStyles + " text-amber-800"}>
                                Electrical Stage Team
                                <span className="ml-2 text-xs font-normal text-amber-600">(Stage 2)</span>
                            </label>
                            <select 
                                multiple
                                size={5}
                                value={formData.stages.electrical.assignedTeamIds}
                                onChange={(e) => {
                                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        stages: {
                                            ...prev.stages,
                                            electrical: { ...prev.stages.electrical, assignedTeamIds: selected }
                                        }
                                    }));
                                }}
                                className={inputStyles + " h-32"}
                            >
                                {assignableTeamMembers
                                    .filter(m => m.role === 'Electricals' || m.role === 'Electrical + Civil')
                                    .map(m => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                    ))}
                            </select>
                            <p className="text-xs text-amber-600 mt-2">Hold Ctrl/Cmd to select multiple team members</p>
                            {formData.stages.electrical.assignedTeamIds.length > 0 && (
                                <div className="mt-2 text-xs text-amber-700">
                                    Selected: {formData.stages.electrical.assignedTeamIds.length} member(s)
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        💡 <strong>Tip:</strong> Assign civil team now. You can add electrical team later when civil work completes.
                    </p>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Initial Materials Sent</h3>
                    <div className="space-y-3">
                        {formData.initialMaterials.map((mat, index) => (
                            <div key={mat.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                                <select 
                                    value={mat.name} 
                                    onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                                    className={`${inputStyles} md:col-span-2`}
                                >
                                    {predefinedMaterials.map(name => <option key={name} value={name}>{name}</option>)}
                                </select>
                                <div className="relative">
                                    <label className="text-xs text-gray-500">Units (m)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., 100"
                                        value={mat.units}
                                        onChange={(e) => handleMaterialChange(index, 'units', e.target.value)}
                                        className={`${inputStyles} ${errors[`material_units_${index}`] ? 'border-red-500' : ''}`}
                                    />
                                    {errors[`material_units_${index}`] && <p className="text-red-400 text-xs mt-1 absolute">{errors[`material_units_${index}`]}</p>}
                                </div>
                                <div className="relative">
                                    <label className="text-xs text-gray-500">Used (m)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., 20"
                                        value={mat.used}
                                        onChange={(e) => handleMaterialChange(index, 'used', e.target.value)}
                                        className={`${inputStyles} ${errors[`material_used_${index}`] ? 'border-red-500' : ''}`}
                                    />
                                    {errors[`material_used_${index}`] && <p className="text-red-400 text-xs mt-1 absolute">{errors[`material_used_${index}`]}</p>}
                                </div>
                                <button type="button" onClick={() => removeMaterialRow(index)} className="text-red-600 hover:text-red-500 font-semibold justify-self-start md:justify-self-center self-center pt-5">Remove</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addMaterialRow} className="mt-4 inline-flex items-center gap-1 text-sm text-orange-600 font-semibold hover:text-orange-700">+ Add Material</button>
                </div>

                {canAddAttachments && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                        <FileInput 
                            id="photos"
                            label="Add Photos"
                            files={photos}
                            onFilesChange={setPhotos}
                            acceptedFileTypes="image/*"
                            iconColorClass="text-blue-400"
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>}
                        />
                             <FileInput 
                                id="documents"
                                label="Add Documents"
                                files={documents}
                                onFilesChange={setDocuments}
                                acceptedFileTypes=".pdf,.doc,.docx,.xls,.xlsx"
                                iconColorClass="text-purple-400"
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h2a2 2 0 002-2V4a2 2 0 00-2-2H9z" /><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm10.293-9.293a1 1 0 00-1.414 1.414L13 7.414V13a1 1 0 102 0V7.414l-.293.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" /></svg>}
                                showCameraButton={true}
                            />
                    </div>
                )}

                {/* Stage transitions are now managed from the Site Detail page */}
                
                 {isEditing && (formData.photos?.length || 0) + (formData.documents?.length || 0) > 0 && (
                            <div className="pt-6 border-t border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Existing Attachments</h3>
                        <div className="space-y-2">
                            {formData.photos?.map(photo => (
                                <div key={photo.name} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm text-gray-700 border border-gray-200">
                                    <span className="truncate">{photo.name}</span>
                                    <button type="button" onClick={() => handleRemoveExistingAttachment('photos', photo.name)} className="text-red-500 hover:text-red-400">Remove</button>
                                </div>
                            ))}
                            {formData.documents?.map(doc => (
                                <div key={doc.name} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm text-gray-700 border border-gray-200">
                                    <span className="truncate">{doc.name}</span>
                                    <button type="button" onClick={() => handleRemoveExistingAttachment('documents', doc.name)} className="text-red-500 hover:text-red-400">Remove</button>
                                </div>
                            ))}
                        </div>
                     </div>
                 )}


                <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
                    <button type="button" onClick={onBack} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="w-48 flex justify-center items-center px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700">
                        {isEditing ? 'Update Site' : 'Create Site'}
                    </button>
                </div>
            </form>

            {/* Quick Add Vendor Modal */}
            {isAddVendorModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
                            <h3 className="text-xl font-bold">➕ Quick Add Vendor</h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vendor Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newVendorName}
                                    onChange={(e) => setNewVendorName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                    placeholder="Enter vendor/client name"
                                    autoFocus
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddVendorQuick();
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can add more details (contact, phone, etc.) from the Vendors page later.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewVendorName('');
                                        setIsAddVendorModalOpen(false);
                                    }}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleAddVendorQuick}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ripple"
                                >
                                    Add Vendor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};