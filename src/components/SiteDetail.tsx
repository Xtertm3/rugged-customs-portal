import React, { useState, useMemo } from 'react';
import { PaymentRequest, TeamMember, Site, SiteAttachment, RequestAttachment } from '../App';
import * as firebaseService from '../services/firebaseService';

const cardStatusColors = {
  Pending: 'bg-amber-900/20 border-amber-500/30',
  Approved: 'bg-green-900/20 border-green-500/30',
  Paid: 'bg-blue-900/20 border-blue-500/30',
};

interface SiteDetailProps {
  site: Site;
  requests: PaymentRequest[];
  teamMembers: TeamMember[];
  onBack: () => void;
  onUpdateRequestStatus: (requestId: string, newStatus: 'Pending' | 'Approved' | 'Paid') => void;
  onEditRequest: (request: PaymentRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  canApprove: boolean;
  canEdit: boolean;
  canEditMaterials?: boolean;
  onEditSite: (site: Site) => void;
}

export const SiteDetail: React.FC<SiteDetailProps> = ({ site, requests, teamMembers, onBack, onUpdateRequestStatus, onEditRequest, onDeleteRequest, canApprove, canEdit, canEditMaterials, onEditSite }) => {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  const [workType, setWorkType] = useState<'Civil' | 'Electrical' | ''>(site.workType || '');
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [editedUsedValue, setEditedUsedValue] = useState<string>('');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialUnits, setNewMaterialUnits] = useState('');
  const [newMaterialUsed, setNewMaterialUsed] = useState('0');

  const siteRequests = useMemo(() => {
    return requests.filter(r => r.siteName === site.siteName).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [requests, site.siteName]);

  const siteStatus = useMemo(() => {
    if (siteRequests.length === 0) return 'No Activity';
    if (siteRequests.every(r => r.status === 'Paid')) return 'Closed';
    return 'Open';
  }, [siteRequests]);

  const materialUsage = useMemo(() => {
    // Map: material name -> { initial: number, used: number }
    const usageMap = new Map<string, { initial: number; used: number }>();

    // Start with site initial materials (if any)
    if (site.initialMaterials) {
      site.initialMaterials.forEach(mat => {
        usageMap.set(mat.name, { initial: Number(mat.units || 0), used: Number(mat.used || 0) });
      });
    }

    // Also include assignedMaterials from the site manager (team-level opening balances)
    const manager = teamMembers.find(m => m.id === site.siteManagerId);
    if (manager && manager.assignedMaterials && manager.assignedMaterials.length > 0) {
      manager.assignedMaterials.forEach(mat => {
        const existing = usageMap.get(mat.name) || { initial: 0, used: 0 };
        existing.initial += Number(mat.units || 0);
        existing.used += Number(mat.used || 0);
        usageMap.set(mat.name, existing);
      });
    }

    // Apply usage from requests (this increments the 'used' amount)
    siteRequests.forEach(req => {
      (req.materials || []).forEach(usedMat => {
        const current = usageMap.get(usedMat.name) || { initial: 0, used: 0 };
        current.used += Number(usedMat.used || 0);
        usageMap.set(usedMat.name, current);
      });
    });

    return usageMap;
  }, [site.initialMaterials, siteRequests, teamMembers, site.siteManagerId]);

  const managerName = useMemo(() => teamMembers.find(m => m.id === site.siteManagerId)?.name, [teamMembers, site.siteManagerId]);

  const handleSaveMaterialUsed = async (materialName: string) => {
    const newUsedValue = parseFloat(editedUsedValue);
    if (isNaN(newUsedValue) || newUsedValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    // Update the site's initialMaterials with the new used value
    const updatedMaterials = site.initialMaterials.map(mat => 
      mat.name === materialName ? { ...mat, used: editedUsedValue } : mat
    );

    // Persist directly to Firestore so all reports reflect the change
    try {
      await firebaseService.updateSite(site.id, { initialMaterials: updatedMaterials });
    } catch (e) {
      console.error('Failed to update material usage', e);
      alert('Failed to save changes. Please try again.');
      return;
    }
    setEditingMaterial(null);
    setEditedUsedValue('');
  };

  const handleAddMaterial = async () => {
    if (!newMaterialName.trim()) {
      alert('Please enter material name');
      return;
    }

    const units = parseFloat(newMaterialUnits);
    const used = parseFloat(newMaterialUsed);

    if (isNaN(units) || units < 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (isNaN(used) || used < 0) {
      alert('Please enter a valid used quantity');
      return;
    }

    // Check if material already exists
    const existingMaterials = site.initialMaterials || [];
    if (existingMaterials.some(mat => mat.name.toLowerCase() === newMaterialName.trim().toLowerCase())) {
      alert('Material already exists. Please edit the existing material instead.');
      return;
    }

    // Add new material to site's initialMaterials
    const updatedMaterials = [
      ...existingMaterials,
      {
        id: `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newMaterialName.trim(),
        units: newMaterialUnits,
        used: newMaterialUsed
      }
    ];

    try {
      await firebaseService.updateSite(site.id, { initialMaterials: updatedMaterials });
    } catch (e) {
      console.error('Failed to add material', e);
      alert('Failed to add material. Please try again.');
      return;
    }
    
    // Reset form
    setNewMaterialName('');
    setNewMaterialUnits('');
    setNewMaterialUsed('0');
    setShowAddMaterial(false);
  };

  if (!site) {
    return (
        <div className="w-full animate-fade-in text-center py-12">
            <p className="text-lg text-gray-500">Site details not found.</p>
            <button onClick={onBack} className="mt-4 text-sm text-orange-400 hover:text-orange-300 font-semibold">
                &larr; Go Back
            </button>
        </div>
    );
  }
  
  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({...prev, [id]: !prev[id]}));
  };
  
  const SiteAttachmentList: React.FC<{ title: string; attachments: SiteAttachment[] }> = ({ title, attachments }) => (
      <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
          {attachments.length === 0 ? (
              <p className="text-sm text-gray-600">No {title.toLowerCase()} attached.</p>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {attachments.map((file) => (
                      <a 
                          key={file.name} 
                          href={file.dataUrl} 
                          download={file.name}
                          className="bg-gray-50 p-2 rounded-md text-sm text-gray-700 flex items-center gap-2 hover:bg-gray-200 transition-colors truncate"
                      >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          <span className="truncate" title={file.name}>{file.name}</span>
                      </a>
                  ))}
              </div>
          )}
      </div>
  );

    const RequestAttachmentList: React.FC<{ attachments: RequestAttachment[] }> = ({ attachments }) => (
        <ul className="list-disc list-inside text-gray-500 space-y-1">
            {attachments.map((file, i) => (
                <li key={i}>
                    <a href={file.dataUrl} download={file.name} className="hover:text-orange-400 underline">
                        {file.name}
                    </a>
                </li>
            ))}
        </ul>
    );

  return (
    <div className="w-full animate-fade-in">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold mb-6">
            &larr; Back
        </button>
        <div className="bg-white/50 p-6 rounded-2xl space-y-6">
            <div className="border-b border-gray-300 pb-4 flex justify-between items-start">
              <div>
                 <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold text-gray-900">{site.siteName}</h2>
                    {siteStatus === 'Closed' && (
                        <span className="text-sm font-semibold bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                            Closed
                        </span>
                    )}
                 </div>
                <p className="text-md text-gray-500">{site.location}</p>
                {managerName && <p className="text-sm text-gray-700 font-medium mt-1">Managed by: <span className="text-orange-400">{managerName}</span></p>}
                 {site.latitude && site.longitude && (
                   <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 inline-block">
                     <p className="text-xs font-semibold text-blue-700 mb-1">📍 Lat & Long (Navigation)</p>
                     <p className="text-lg font-bold text-blue-900 tracking-wide">
                       {site.latitude}, {site.longitude}
                     </p>
                   </div>
                 )}
                 
                 {/* Work Type Dropdown */}
                 <div className="mt-3">
                   <label className="block text-sm font-semibold text-gray-700 mb-1">Work Type</label>
                   <select
                     value={workType}
                     onChange={(e) => {
                       const newWorkType = e.target.value as 'Civil' | 'Electrical' | '';
                       setWorkType(newWorkType);
                       // Update the site immediately
                       onEditSite({ ...site, workType: newWorkType || undefined });
                     }}
                     className="w-48 bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                   >
                     <option value="">Select Work Type</option>
                     <option value="Civil">Civil</option>
                     <option value="Electrical">Electrical</option>
                   </select>
                 </div>
              </div>
              {canEdit && (
                <button onClick={() => onEditSite(site)} className="text-sm px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300">
                    Edit Site Details
                </button>
              )}
            </div>
            
            {(site.photos?.length || 0) > 0 || (site.documents?.length || 0) > 0 ? (
                <div>
                     <h3 className="text-xl font-semibold mb-3 text-gray-800">Site Attachments</h3>
                     <div className="bg-gray-50/50 p-4 rounded-md space-y-4">
                         {site.photos && site.photos.length > 0 && <SiteAttachmentList title="Photos" attachments={site.photos} />}
                         {site.documents && site.documents.length > 0 && <SiteAttachmentList title="Documents" attachments={site.documents} />}
                     </div>
                </div>
            ) : null}

            {site.initialMaterials && site.initialMaterials.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-800">Initial Materials & Usage</h3>
                        {canEditMaterials && (
                            <button
                                onClick={() => setShowAddMaterial(!showAddMaterial)}
                                className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                {showAddMaterial ? '✕ Cancel' : '+ Add Material'}
                            </button>
                        )}
                    </div>

                    {showAddMaterial && (
                        <div className="mb-4 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Add New Material</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input
                                    type="text"
                                    placeholder="Material Name"
                                    value={newMaterialName}
                                    onChange={(e) => setNewMaterialName(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity (m)"
                                    value={newMaterialUnits}
                                    onChange={(e) => setNewMaterialUnits(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Used (m)"
                                    value={newMaterialUsed}
                                    onChange={(e) => setNewMaterialUsed(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                                <button
                                    onClick={handleAddMaterial}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    ✓ Add Material
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto bg-gray-50/50 p-3 rounded-md">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-2">Material</th>
                                    <th className="px-4 py-2 text-right">Initially Sent (m)</th>
                                    <th className="px-4 py-2 text-right">Total Used (m)</th>
                                    <th className="px-4 py-2 text-right">Remaining (m)</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-800">
                                {Array.from(materialUsage.entries()).map(([name, data]) => (
                                    <tr key={name} className="border-t border-gray-200/50">
                                        <td className="px-4 py-2 font-medium">{name}</td>
                                        <td className="px-4 py-2 text-right">{data.initial.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-right text-amber-400">
                                            {canEditMaterials && editingMaterial === name ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        value={editedUsedValue}
                                                        onChange={(e) => setEditedUsedValue(e.target.value)}
                                                        className="w-24 px-2 py-1 border border-amber-400 rounded text-right focus:ring-2 focus:ring-amber-500"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleSaveMaterialUsed(name)}
                                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setEditingMaterial(null);
                                                            setEditedUsedValue('');
                                                        }}
                                                        className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    <span>{data.used.toLocaleString()}</span>
                                                    {canEditMaterials && (
                                                        <button
                                                            onClick={() => {
                                                                setEditingMaterial(name);
                                                                setEditedUsedValue(data.used.toString());
                                                            }}
                                                            className="text-xs text-blue-500 hover:text-blue-700 ml-2"
                                                            title="Edit total used"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right font-bold text-green-400">{(data.initial - data.used).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {(!site.initialMaterials || site.initialMaterials.length === 0) && canEditMaterials && (
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-800">Initial Materials & Usage</h3>
                        <button
                            onClick={() => setShowAddMaterial(!showAddMaterial)}
                            className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                        >
                            {showAddMaterial ? '✕ Cancel' : '+ Add Material'}
                        </button>
                    </div>

                    {showAddMaterial ? (
                        <div className="mb-4 p-4 bg-blue-50/50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Add New Material</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input
                                    type="text"
                                    placeholder="Material Name"
                                    value={newMaterialName}
                                    onChange={(e) => setNewMaterialName(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity (m)"
                                    value={newMaterialUnits}
                                    onChange={(e) => setNewMaterialUnits(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Used (m)"
                                    value={newMaterialUsed}
                                    onChange={(e) => setNewMaterialUsed(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
                                />
                                <button
                                    onClick={handleAddMaterial}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    ✓ Add Material
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50/50 rounded-lg border border-gray-200">
                            No materials added yet. Click "Add Material" to get started.
                        </div>
                    )}
                </div>
            )}

            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Completion Submissions</h3>
              <div className="space-y-4">
                {siteRequests.map((req) => (
                    <div key={req.id} className={`p-4 rounded-lg border ${cardStatusColors[req.status]}`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          <div>
                            <p className="text-sm text-gray-700 font-semibold">{req.paymentFor}</p>
                            <p className="text-lg font-bold text-amber-400">{req.amount}</p>
                            {req.reasons && <p className="text-xs text-gray-500 italic">"{req.reasons}"</p>}
                          </div>
                          
                          <div>{/* Placeholder for grid alignment */}</div>

                          <div className="flex flex-col items-start md:items-end">
                            <select
                              value={req.status}
                              onChange={(e) => onUpdateRequestStatus(req.id, e.target.value as any)}
                              disabled={!canApprove}
                              className={`cursor-pointer text-xs font-medium rounded-full px-3 py-1 border focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Paid">Paid</option>
                            </select>
                            <p className="text-xs text-gray-600 mt-2">{req.timestamp}</p>
                          </div>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center justify-between">
                          <div>
                            {(req.photos.length > 0 || req.documents.length > 0) && (
                                <button onClick={() => toggleDetails(req.id)} className="text-xs font-semibold text-orange-400 hover:text-orange-300">
                                    {expandedDetails[req.id] ? 'Hide Details' : 'Show Details'}
                                </button>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {canEdit && (
                              <>
                                <button onClick={() => onEditRequest(req)} className="text-xs font-semibold text-gray-500 hover:text-white">
                                  Edit
                                </button>
                                <button onClick={() => onDeleteRequest(req.id)} className="text-xs font-semibold text-red-500 hover:text-red-400">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                      </div>
                      {expandedDetails[req.id] && (
                        <div className="mt-3 bg-gray-50/50 p-3 rounded-md animate-fade-in text-xs space-y-3">
                             {req.photos.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-1">Photos:</h4>
                                <RequestAttachmentList attachments={req.photos} />
                            </div>
                            )}
                            {req.documents.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-gray-700 mb-1">Documents:</h4>
                                 <RequestAttachmentList attachments={req.documents} />
                            </div>
                            )}
                        </div>
                      )}
                    </div>
                ))}
              </div>
            </div>
        </div>
    </div>
  );
};
