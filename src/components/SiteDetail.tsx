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
  onRequestApproval?: (siteId: string) => void;
  currentUser?: any;
  billings?: any[];
  onViewBilling?: (billingId: string) => void;
}

export const SiteDetail: React.FC<SiteDetailProps> = ({ site, requests, teamMembers, onBack, onUpdateRequestStatus, onEditRequest, onDeleteRequest, canApprove, canEdit, canEditMaterials, onEditSite, onRequestApproval, currentUser, billings = [], onViewBilling }) => {
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

  // Aggregates for Transactions Table
  const totals = useMemo(() => {
    const paidTotal = siteRequests
      .filter(r => r.status === 'Paid')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const approvedTotal = siteRequests
      .filter(r => r.status === 'Approved')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const pendingTotal = siteRequests
      .filter(r => r.status === 'Pending')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    const approvalsSent = siteRequests.filter(r => r.status === 'Approved').length;
    const paymentsDone = siteRequests.filter(r => r.status === 'Paid').length;
    const billingRecord = (billings || []).find(b => b.siteId === site.id);

    // Calculate combined billing value: Total Paid + Material Pricing
    const materialsBilling = site.billingValue || 0;
    const combinedBillingValue = paidTotal + materialsBilling;

    return {
      paidTotal,
      approvedTotal,
      pendingTotal,
      approvalsSent,
      paymentsDone,
      billingStatus: site.billingStatus || billingRecord?.status || undefined,
      billingValue: combinedBillingValue,
      vendorName: site.vendorName || 'N/A'
    };
  }, [siteRequests, billings, site.id, site.billingStatus, site.billingValue, site.vendorName]);

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
              <div className="flex-1">
                 <div className="flex items-center gap-4 flex-wrap">
                    {(() => {
                      const raw = site.siteName || '';
                      const siteIdMatch = raw.match(/\bIN-?\d+\b/i);
                      const rlIdMatch = raw.match(/\bR\/RL-?\d+\b/i);
                      const baseName = raw
                        .replace(siteIdMatch?.[0] || '', '')
                        .replace(rlIdMatch?.[0] || '', '')
                        .replace(/[-_]+/g, ' ')
                        .replace(/\s{2,}/g, ' ')
                        .trim();
                      const rlIdDisplay = rlIdMatch?.[0]?.toUpperCase();
                      const siteIdDisplay = (siteIdMatch?.[0] || site.id).toUpperCase();
                      return (
                        <>
                          <h2 className="text-3xl font-bold text-gray-900">{baseName || site.siteName}</h2>
                          <span className="text-sm px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300" title="Site ID">{siteIdDisplay}</span>
                          {rlIdDisplay && (
                            <span className="text-sm px-2 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300" title="RL ID">{rlIdDisplay}</span>
                          )}
                        </>
                      );
                    })()}
                    {siteStatus === 'Closed' && (
                        <span className="text-sm font-semibold bg-green-900/50 text-green-300 px-3 py-1 rounded-full">
                            Closed
                        </span>
                    )}
                    {/* Billing Status Badge */}
                    {(() => {
                      const siteBilling = billings.find(b => b.siteId === site.id);
                      if (siteBilling) {
                        const statusColors: Record<string, string> = {
                          'Quotation Sent': 'bg-blue-100 text-blue-700',
                          'Yet To Bill': 'bg-yellow-100 text-yellow-700',
                          'Approval Pending': 'bg-orange-100 text-orange-700',
                          'Add PR Process': 'bg-purple-100 text-purple-700',
                          'Add PR Done': 'bg-indigo-100 text-indigo-700',
                          'Waiting For Amendment': 'bg-amber-100 text-amber-700',
                          'WCC Done': 'bg-teal-100 text-teal-700',
                          'Billing Completed': 'bg-green-100 text-green-700'
                        };
                        return (
                          <span 
                            className={`text-xs font-semibold px-3 py-1 rounded-full cursor-pointer ${statusColors[siteBilling.status] || 'bg-gray-100 text-gray-700'}`}
                            onClick={() => onViewBilling && onViewBilling(siteBilling.id)}
                            title="Click to view billing details"
                          >
                            💰 {siteBilling.status}
                          </span>
                        );
                      }
                      return null;
                    })()}
                 </div>
                {site.vendorName && (
                  <p className="text-md text-gray-700 font-medium mb-2">
                    🏢 Vendor: <span className="text-orange-600">{site.vendorName}</span>
                  </p>
                )}
                <p className="text-md text-gray-500">📍 {site.location}</p>
                {managerName && <p className="text-sm text-gray-700 font-medium mt-1">Managed by: <span className="text-orange-400">{managerName}</span></p>}
                
                {/* Request Approval Button */}
                {currentUser && ['Admin', 'Manager', 'Backoffice'].includes(currentUser.role) && !billings.find(b => b.siteId === site.id) && (
                  <button
                    onClick={() => onRequestApproval && onRequestApproval(site.id)}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2"
                  >
                    <span className="text-lg">✅</span>
                    Request Approval for Billing
                  </button>
                )}
                
                {/* Work Stage Initialization for Old Sites */}
                {canEdit && (!site.currentStage || !site.stages) && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <h4 className="text-sm font-semibold text-yellow-800 mb-2">⚠️ Work Stage Tracking Not Set Up</h4>
                    <p className="text-xs text-yellow-700 mb-3">
                      This site was created before work stage tracking. Click below to initialize 4-stage workflow (C1 → C2 → C1+C2 Combined → Electrical).
                    </p>
                    <button
                      onClick={() => {
                        if (confirm('Initialize 4-Stage Work Tracking?\n\nThis will:\n- Start C1 stage (Civil Phase 1)\n- Set up C2, C1+C2 Combined, and Electrical stages\n- Keep all existing data intact')) {
                          const updatedSite = {
                            ...site,
                            currentStage: 'c1' as const,
                            stages: {
                              c1: {
                                status: 'in-progress' as const,
                                assignedTeamIds: site.siteManagerId ? [site.siteManagerId] : [],
                                startDate: new Date().toISOString(),
                                completionDate: undefined
                              },
                              c2: {
                                status: 'not-started' as const,
                                assignedTeamIds: [],
                                startDate: undefined,
                                completionDate: undefined
                              },
                              c1_c2_combined: {
                                status: 'not-started' as const,
                                assignedTeamIds: [],
                                startDate: undefined,
                                completionDate: undefined
                              },
                              electrical: {
                                status: 'not-started' as const,
                                assignedTeamIds: [],
                                startDate: undefined,
                                completionDate: undefined
                              }
                            }
                          };
                          onEditSite(updatedSite);
                        }
                      }}
                      className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      ✓ Initialize 4-Stage Workflow (C1 → C2 → C1+C2 → Electrical)
                    </button>
                  </div>
                )}
                
                {/* Work Stage Progress Indicator - 4 Stages: C1 → C2 → C1+C2 → Electrical */}
                {site.currentStage && site.stages && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-amber-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 Work Stage Progress (C1 → C2 → C1+C2 Combined → Electrical)</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* C1 Stage Badge */}
                      <div className={`flex-1 min-w-[120px] p-2 rounded-lg border-2 ${
                        site.stages.c1?.status === 'completed' ? 'bg-green-100 border-green-500' :
                        site.stages.c1?.status === 'in-progress' ? 'bg-blue-100 border-blue-500' :
                        'bg-gray-100 border-gray-300'
                      }`}>
                        <div className="text-[10px] font-bold text-gray-600 mb-0.5">C1</div>
                        <div className="text-xs font-bold">
                          {site.stages.c1?.status === 'completed' && '✓ Done'}
                          {site.stages.c1?.status === 'in-progress' && '⚙️ Active'}
                          {site.stages.c1?.status === 'not-started' && '⏸ Pending'}
                        </div>
                      </div>
                      <div className="text-lg text-gray-400">→</div>

                      {/* C2 Stage Badge */}
                      <div className={`flex-1 min-w-[120px] p-2 rounded-lg border-2 ${
                        site.stages.c2?.status === 'completed' ? 'bg-green-100 border-green-500' :
                        site.stages.c2?.status === 'in-progress' ? 'bg-blue-100 border-blue-500' :
                        'bg-gray-100 border-gray-300'
                      }`}>
                        <div className="text-[10px] font-bold text-gray-600 mb-0.5">C2</div>
                        <div className="text-xs font-bold">
                          {site.stages.c2?.status === 'completed' && '✓ Done'}
                          {site.stages.c2?.status === 'in-progress' && '⚙️ Active'}
                          {site.stages.c2?.status === 'not-started' && '⏸ Pending'}
                        </div>
                      </div>
                      <div className="text-lg text-gray-400">→</div>

                      {/* C1+C2 Combined Stage Badge */}
                      <div className={`flex-1 min-w-[120px] p-2 rounded-lg border-2 ${
                        site.stages.c1_c2_combined?.status === 'completed' ? 'bg-green-100 border-green-500' :
                        site.stages.c1_c2_combined?.status === 'in-progress' ? 'bg-purple-100 border-purple-500' :
                        'bg-gray-100 border-gray-300'
                      }`}>
                        <div className="text-[10px] font-bold text-gray-600 mb-0.5">C1+C2 COMBINED</div>
                        <div className="text-xs font-bold">
                          {site.stages.c1_c2_combined?.status === 'completed' && '✓ Done'}
                          {site.stages.c1_c2_combined?.status === 'in-progress' && '⚙️ Active'}
                          {site.stages.c1_c2_combined?.status === 'not-started' && '⏸ Pending'}
                        </div>
                      </div>
                      <div className="text-lg text-gray-400">→</div>
                      
                      {/* Electrical Stage Badge */}
                      <div className={`flex-1 min-w-[120px] p-2 rounded-lg border-2 ${
                        site.stages.electrical?.status === 'completed' ? 'bg-green-100 border-green-500' :
                        site.stages.electrical?.status === 'in-progress' ? 'bg-amber-100 border-amber-500' :
                        'bg-gray-100 border-gray-300'
                      }`}>
                        <div className="text-[10px] font-bold text-gray-600 mb-0.5">ELECTRICAL</div>
                        <div className="text-xs font-bold">
                          {site.stages.electrical?.status === 'completed' && '✓ Done'}
                          {site.stages.electrical?.status === 'in-progress' && '⚡ Active'}
                          {site.stages.electrical?.status === 'not-started' && '⏸ Pending'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Complete Stage Buttons */}
                    {canEdit && site.currentStage === 'c1' && site.stages.c1?.status === 'in-progress' && (
                      <button
                        onClick={async () => {
                          if (confirm('Complete C1 Stage and move to C2?\n\nThis will mark C1 as completed and start C2.')) {
                            const updatedSite = {
                              ...site,
                              currentStage: 'c2' as const,
                              stages: {
                                ...site.stages,
                                c1: { ...site.stages.c1, status: 'completed' as const, completionDate: new Date().toISOString() },
                                c2: { ...site.stages.c2, status: 'in-progress' as const, startDate: new Date().toISOString() }
                              }
                            };
                            onEditSite(updatedSite);
                          }
                        }}
                        className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ✓ Complete C1 & Start C2
                      </button>
                    )}

                    {canEdit && site.currentStage === 'c2' && site.stages.c2?.status === 'in-progress' && (
                      <button
                        onClick={async () => {
                          if (confirm('Complete C2 Stage and move to C1+C2 Combined?\n\nThis will mark C2 as completed and start C1+C2 Combined stage.')) {
                            const updatedSite = {
                              ...site,
                              currentStage: 'c1_c2_combined' as const,
                              stages: {
                                ...site.stages,
                                c2: { ...site.stages.c2, status: 'completed' as const, completionDate: new Date().toISOString() },
                                c1_c2_combined: { ...site.stages.c1_c2_combined, status: 'in-progress' as const, startDate: new Date().toISOString() }
                              }
                            };
                            onEditSite(updatedSite);
                          }
                        }}
                        className="mt-3 w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        ✓ Complete C2 & Start C1+C2 Combined
                      </button>
                    )}

                    {canEdit && site.currentStage === 'c1_c2_combined' && site.stages.c1_c2_combined?.status === 'in-progress' && (
                      <button
                        onClick={async () => {
                          if (confirm('Complete C1+C2 Combined and move to Electrical?\n\nThis will mark C1+C2 Combined as completed and start Electrical stage.')) {
                            const updatedSite = {
                              ...site,
                              currentStage: 'electrical' as const,
                              stages: {
                                ...site.stages,
                                c1_c2_combined: { ...site.stages.c1_c2_combined, status: 'completed' as const, completionDate: new Date().toISOString() },
                                electrical: { ...site.stages.electrical, status: 'in-progress' as const, startDate: new Date().toISOString() }
                              }
                            };
                            onEditSite(updatedSite);
                          }
                        }}
                        className="mt-3 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        ✓ Complete C1+C2 Combined & Start Electrical
                      </button>
                    )}
                    
                    {canEdit && site.currentStage === 'electrical' && site.stages.electrical?.status === 'in-progress' && (
                      <button
                        onClick={async () => {
                          if (confirm('Complete Electrical Stage?\n\nThis will mark the entire site as completed.')) {
                            const updatedSite = {
                              ...site,
                              currentStage: 'completed' as const,
                              stages: {
                                ...site.stages,
                                electrical: { ...site.stages.electrical, status: 'completed' as const, completionDate: new Date().toISOString() }
                              }
                            };
                            onEditSite(updatedSite);
                          }
                        }}
                        className="mt-3 w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                      >
                        ✓ Complete Electrical Stage
                      </button>
                    )}
                  </div>
                )}
                 {site.latitude && site.longitude && (
                   <a
                     href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 inline-block hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all cursor-pointer"
                     title="Open in Google Maps"
                   >
                     <p className="text-xs font-semibold text-blue-700 mb-1">📍 Lat & Long (Click to Navigate)</p>
                     <p className="text-lg font-bold text-blue-900 tracking-wide">
                       {site.latitude}, {site.longitude}
                     </p>
                   </a>
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
            
            {/* Site Transactions */}
            <div>
              <h3 className="text-xl font-semibold mb-3 text-gray-800">Site Transactions</h3>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Summary Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
                  <div className="rounded-md p-3 bg-green-50 border border-green-200">
                    <div className="text-[11px] text-green-600 font-semibold">Total Paid</div>
                    <div className="text-lg font-bold text-green-700">₹{totals.paidTotal.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md p-3 bg-yellow-50 border border-yellow-200">
                    <div className="text-[11px] text-yellow-700 font-semibold">Approved (Not Paid)</div>
                    <div className="text-lg font-bold text-yellow-800">₹{totals.approvedTotal.toLocaleString()}</div>
                  </div>
                  <div className="rounded-md p-3 bg-amber-50 border border-amber-200">
                    <div className="text-[11px] text-amber-700 font-semibold">Pending</div>
                    <div className="text-lg font-bold text-amber-800">₹{totals.pendingTotal.toLocaleString()}</div>
                  </div>
                  {currentUser && ['Admin', 'Manager', 'Backoffice'].includes(currentUser.role) && (
                    <div className="rounded-md p-3 bg-blue-50 border border-blue-200">
                      <div className="text-[11px] text-blue-700 font-semibold">Billing Status</div>
                      <div className="text-xs font-bold text-blue-800">{totals.billingStatus || 'Not Set'}</div>
                      {totals.billingValue !== undefined && (
                        <div className="text-sm font-semibold text-blue-900">₹{Number(totals.billingValue).toLocaleString()}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Detail Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-left">Vendor</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Billing row (if present) - Only for Admin, Manager, Backoffice */}
                      {currentUser && ['Admin', 'Manager', 'Backoffice'].includes(currentUser.role) && (() => {
                        const billingRecord = (billings || []).find(b => b.siteId === site.id);
                        if (!billingRecord && !site.billingStatus) return null;
                        const status = site.billingStatus || billingRecord?.status || 'Not Set';
                        const amount = site.billingValue ?? billingRecord?.actualBillingTotal ?? 0;
                        const date = billingRecord?.updatedAt ? new Date(billingRecord.updatedAt).toLocaleString() : '-';
                        return (
                          <tr>
                            <td className="px-4 py-2 font-medium text-blue-800">Billing</td>
                            <td className="px-4 py-2 text-gray-700">Status: {status}</td>
                            <td className="px-4 py-2 text-gray-700">{totals.vendorName}</td>
                            <td className="px-4 py-2 text-right text-blue-700">₹{Number(amount).toLocaleString()}</td>
                            <td className="px-4 py-2">
                              <span className="inline-block px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-semibold">{status}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{date}</td>
                          </tr>
                        );
                      })()}

                      {/* Approval/Billing Requests as payments */}
                      {siteRequests.map(req => (
                        <tr key={req.id}>
                          <td className="px-4 py-2 font-medium text-gray-800">Payment</td>
                          <td className="px-4 py-2 text-gray-700">{req.paymentFor}</td>
                          <td className="px-4 py-2 text-gray-700">{totals.vendorName}</td>
                          <td className={`px-4 py-2 text-right font-semibold ${req.status === 'Paid' ? 'text-green-700' : req.status === 'Approved' ? 'text-yellow-800' : 'text-amber-800'}`}>₹{Number(req.amount).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              req.status === 'Paid' ? 'bg-green-100 text-green-700' :
                              req.status === 'Approved' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>{req.status}</span>
                          </td>
                          <td className="px-4 py-2 text-gray-600">{req.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                                    <th className="px-4 py-2 text-right">Opening Material (m)</th>
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
