import React, { useState, useEffect, useMemo } from 'react';
import { Site, TeamMember } from '../App';
import { MaterialItem } from '../services/geminiService';
import { FileInput } from './FileInput';

interface SiteFormProps {
    onBack: () => void;
    onSubmit: (siteData: Site | Omit<Site, 'id'>) => Promise<void> | void;
    initialData?: Site | null;
    teamMembers: TeamMember[];
    canAddAttachments: boolean;
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
    initialMaterials: [],
    siteManagerId: '',
    photos: [],
    documents: [],
};

export const SiteForm: React.FC<SiteFormProps> = ({ onBack, onSubmit, initialData, teamMembers, canAddAttachments }) => {
    const [formData, setFormData] = useState(initialFormData);
    const [photos, setPhotos] = useState<File[]>([]);
    const [documents, setDocuments] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
                initialMaterials: initialData.initialMaterials || [],
                siteManagerId: initialData.siteManagerId || '',
                photos: initialData.photos || [],
                documents: initialData.documents || [],
            });
        } else {
            const defaultManagerId = assignableTeamMembers.length > 0 ? assignableTeamMembers[0].id : '';
            setFormData({ ...initialFormData, siteManagerId: defaultManagerId });
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
        if (!formData.siteManagerId) newErrors.siteManagerId = "A team member must be assigned to the site.";
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const photoAttachments = await Promise.all(photos.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })));
            const documentAttachments = await Promise.all(documents.map(async (file) => ({ name: file.name, dataUrl: await fileToDataUrl(file) })));

            const submissionData = {
                ...formData,
                photos: [...(formData.photos || []), ...photoAttachments],
                documents: [...(formData.documents || []), ...documentAttachments]
            };

            if (isEditing && initialData) {
                onSubmit({ ...submissionData, id: initialData.id });
            } else {
                onSubmit(submissionData);
            }
        }
    };

    const inputStyles = "w-full bg-zinc-700/50 border border-zinc-600 rounded-md py-2 px-3 text-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-zinc-300 mb-2";

    return (
        <div className="w-full animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-6">
                &larr; Back
            </button>
            <form onSubmit={handleSubmit} className="bg-zinc-800/50 border border-zinc-700 rounded-2xl shadow-2xl p-6 space-y-6">
                 <h2 className="text-2xl font-bold text-zinc-100 border-b border-zinc-600 pb-4">
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
                    <div>
                        <label htmlFor="latitude" className={labelStyles}>Latitude (Optional)</label>
                        <input id="latitude" name="latitude" type="text" value={formData.latitude} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="longitude" className={labelStyles}>Longitude (Optional)</label>
                        <input id="longitude" name="longitude" type="text" value={formData.longitude} onChange={handleChange} className={inputStyles} />
                    </div>
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
                        <label htmlFor="siteManagerId" className={labelStyles}>Assign To</label>
                        <select id="siteManagerId" name="siteManagerId" value={formData.siteManagerId} onChange={handleChange} className={inputStyles} disabled={assignableTeamMembers.length === 0}>
                            <option value="">{assignableTeamMembers.length > 0 ? 'Select a Team Member' : 'No Civil or Electrical members available'}</option>
                            {assignableTeamMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
                        </select>
                        {errors.siteManagerId && <p className="text-red-400 text-xs mt-1">{errors.siteManagerId}</p>}
                    </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-700/50">
                    <h3 className="text-lg font-semibold text-zinc-200 mb-3">Initial Materials Sent</h3>
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
                                    <label className="text-xs text-zinc-400">Units (m)</label>
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
                                    <label className="text-xs text-zinc-400">Used (m)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g., 20"
                                        value={mat.used}
                                        onChange={(e) => handleMaterialChange(index, 'used', e.target.value)}
                                        className={`${inputStyles} ${errors[`material_used_${index}`] ? 'border-red-500' : ''}`}
                                    />
                                    {errors[`material_used_${index}`] && <p className="text-red-400 text-xs mt-1 absolute">{errors[`material_used_${index}`]}</p>}
                                </div>
                                <button type="button" onClick={() => removeMaterialRow(index)} className="text-red-500 hover:text-red-400 font-semibold justify-self-start md:justify-self-center self-center pt-5">Remove</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addMaterialRow} className="mt-4 text-sm text-orange-400 font-semibold hover:text-orange-300">+ Add Material</button>
                </div>

                {canAddAttachments && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-700/50">
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
                
                 {isEditing && (formData.photos?.length || 0) + (formData.documents?.length || 0) > 0 && (
                     <div className="pt-4 border-t border-zinc-700/50">
                        <h3 className="text-lg font-semibold text-zinc-200 mb-3">Existing Attachments</h3>
                        <div className="space-y-2">
                            {formData.photos?.map(photo => (
                                <div key={photo.name} className="flex items-center justify-between bg-zinc-700/50 p-2 rounded-md text-sm text-zinc-300">
                                    <span className="truncate">{photo.name}</span>
                                    <button type="button" onClick={() => handleRemoveExistingAttachment('photos', photo.name)} className="text-red-500 hover:text-red-400">Remove</button>
                                </div>
                            ))}
                            {formData.documents?.map(doc => (
                                <div key={doc.name} className="flex items-center justify-between bg-zinc-700/50 p-2 rounded-md text-sm text-zinc-300">
                                    <span className="truncate">{doc.name}</span>
                                    <button type="button" onClick={() => handleRemoveExistingAttachment('documents', doc.name)} className="text-red-500 hover:text-red-400">Remove</button>
                                </div>
                            ))}
                        </div>
                     </div>
                 )}


                <div className="flex justify-end items-center gap-4 pt-4 border-t border-zinc-600">
                    <button type="button" onClick={onBack} className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-lg hover:bg-zinc-700">Cancel</button>
                    <button type="submit" className="w-48 flex justify-center items-center px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700">
                        {isEditing ? 'Update Site' : 'Create Site'}
                    </button>
                </div>
            </form>
        </div>
    );
};