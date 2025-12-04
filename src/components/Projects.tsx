import React, { useMemo, useState } from 'react';
import { ProjectSummary, Site, TeamMember } from '../App';

interface ProjectsProps {
    sites: Site[];
    projectSummaries: ProjectSummary[];
    teamMembers: TeamMember[];
    onBulkUploadClick: () => void;
    onViewSiteDetails: (siteName: string) => void;
    canManageSites: boolean;
    onCreateSite: () => void;
    onEditSite: (site: Site) => void;
    onDeleteSite: (siteId: string) => void;
    currentUser: TeamMember | null;
    onCompletionSubmitClick: (siteId: string) => void;
    onRequestApproval?: (site: Site) => void;
}

const getSiteStatusStyle = (status: 'Open' | 'Closed' | 'No Activity') => {
    switch (status) {
        case 'Closed':
            return { border: 'border-green-500/50', text: 'text-green-400' };
        case 'Open':
            return { border: 'border-amber-500/50', text: 'text-amber-400' };
        default:
            return { border: 'border-gray-200', text: 'text-gray-500' };
    }
};

export const Projects: React.FC<ProjectsProps> = ({ 
    sites, 
    projectSummaries, 
    teamMembers, 
    onBulkUploadClick, 
    onViewSiteDetails, 
    canManageSites, 
    onCreateSite, 
    onEditSite,
    onDeleteSite,
    currentUser,
    onCompletionSubmitClick,
    onRequestApproval
}) => {
    const displayedSummaries = useMemo(() => {
        // Admin-like roles see all sites with full data
        if (!currentUser || currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Accountant') {
            return projectSummaries;
        }
        
        // Field roles see sites where they are part of any stage team OR legacy manager
        // AND need to override totalPaid based on their role
        if (currentUser.role === 'Civil' || currentUser.role === 'Electricals' || currentUser.role === 'Electrical + Civil' || currentUser.role === 'Supervisor') {
            return projectSummaries
                .filter(summary => {
                    const site = sites.find(s => s.id === summary.id);
                    if (!site) return false;
                    const isLegacyManager = site.siteManagerId === currentUser.id;
                    const inC1Team = Array.isArray(site.stages?.c1?.assignedTeamIds) && site.stages.c1.assignedTeamIds.includes(currentUser.id);
                    const inC2Team = Array.isArray(site.stages?.c2?.assignedTeamIds) && site.stages.c2.assignedTeamIds.includes(currentUser.id);
                    const inC1C2CombinedTeam = Array.isArray(site.stages?.c1_c2_combined?.assignedTeamIds) && site.stages.c1_c2_combined.assignedTeamIds.includes(currentUser.id);
                    const inElectricalTeam = Array.isArray(site.stages?.electrical?.assignedTeamIds) && site.stages.electrical.assignedTeamIds.includes(currentUser.id);
                    return isLegacyManager || inC1Team || inC2Team || inC1C2CombinedTeam || inElectricalTeam;
                })
                .map(summary => {
                    // Override totalPaid based on user's role/stage
                    if (currentUser.role === 'Civil') {
                        // Civil users see combined C1+C2+C1C2Combined payments
                        return { ...summary, totalPaid: summary.c1Paid + summary.c2Paid + summary.c1_c2_combinedPaid };
                    } else if (currentUser.role === 'Electricals') {
                        return { ...summary, totalPaid: summary.electricalPaid };
                    }
                    // Electrical + Civil and Supervisor see all
                    return summary;
                });
        }
        return [];
    }, [projectSummaries, currentUser, sites]);

    const [selectedStages, setSelectedStages] = useState<Record<string, 'c1' | 'c2' | 'c1_c2_combined' | 'electrical'>>({});

    const handleStageSelect = (siteId: string, stage: 'c1' | 'c2' | 'c1_c2_combined' | 'electrical') => {
        setSelectedStages(prev => ({ ...prev, [siteId]: stage }));
    };

    return (
        <div className="w-full animate-fade-in">
             {canManageSites && (
                <div className="flex flex-wrap justify-end items-center gap-4 mb-6">
                    <button
                        onClick={onBulkUploadClick}
                        className="text-sm px-4 py-2 bg-gray-100/60 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                    >
                        Bulk Upload (Legacy)
                    </button>
                    <button
                        onClick={onCreateSite}
                        className="text-sm px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                    >
                        Create New Site
                    </button>
                </div>
             )}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-3">Sites Overview</h2>
                {displayedSummaries.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">{canManageSites ? "No sites found." : "You have no sites assigned to you."}</p>
                        {canManageSites && <p className="mt-2 text-sm">Click "Create New Site" to get started.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayedSummaries.map((summary) => {
                            const site = sites.find(s => s.id === summary.id);
                            const manager = teamMembers.find(m => m.id === summary.siteManagerId)?.name || 'Unassigned';
                            if (!site) return null;
                            const statusStyle = getSiteStatusStyle(summary.siteStatus);

                            const raw = site.siteName || summary.name;
                            const siteIdMatch = raw.match(/\bIN-?\d+\b/i);
                            const rlIdMatch = raw.match(/\bR\/RL-?\d+\b/i);
                            const baseName = raw
                                .replace(siteIdMatch?.[0] || '', '')
                                .replace(rlIdMatch?.[0] || '', '')
                                .replace(/[-_]+/g, ' ')
                                .replace(/\s{2,}/g, ' ')
                                .trim();
                            const rlIdDisplay = (rlIdMatch?.[0] || '').toUpperCase();
                            const siteIdDisplay = (siteIdMatch?.[0] || site.id).toUpperCase();

                            return (
                                <div 
                                    key={summary.id} 
                                    onClick={() => onViewSiteDetails(summary.name)}
                                    className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 overflow-hidden ${statusStyle.border} hover:border-orange-400`}
                                >
                                    {/* Compact Header */}
                                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-4 py-3 border-b">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <h3 className="font-bold text-base text-gray-900 leading-tight truncate flex-1" title={baseName || summary.name}>
                                                {baseName || summary.name}
                                            </h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusStyle.text} ${statusStyle.border.replace('border-','bg-')} bg-opacity-20 whitespace-nowrap`}>
                                                {summary.siteStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-700 font-mono font-bold">
                                                {siteIdDisplay}
                                            </span>
                                            {rlIdDisplay && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-gray-300 text-gray-700 font-mono font-bold">
                                                    {rlIdDisplay}
                                                </span>
                                            )}
                                            {canManageSites && (
                                                <div className="ml-auto flex items-center gap-1.5">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onEditSite(site); }}
                                                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                                                    >Edit</button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteSite(site.id); }}
                                                        className="text-[10px] font-semibold text-red-600 hover:text-red-700"
                                                    >Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Compact Body */}
                                    <div className="p-2.5 space-y-2">
                                        {/* Info Row - Condensed */}
                                        <div className="flex items-center gap-3 text-[11px] text-gray-600">
                                            {site.vendorName && (
                                                <span className="flex items-center gap-1 truncate">
                                                    <span className="text-blue-600">🏢</span>
                                                    <span className="font-medium">{site.vendorName}</span>
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 truncate">
                                                <span className="text-red-500">📍</span>
                                                <span>{site.location}</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[11px] text-gray-700">
                                            <span>👤</span>
                                            <span className="truncate"><span className="font-bold text-gray-900">{manager}</span></span>
                                        </div>

                                        {/* Compact Stats */}
                                        {(() => {
                                            const isBillingUser = currentUser && ['Admin', 'Manager', 'Backoffice'].includes(currentUser.role);
                                            if (isBillingUser) {
                                                return (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className={`rounded-md p-1.5 border ${
                                                            site.billingStatus === 'WIP' ? 'bg-yellow-50 border-yellow-200' :
                                                            site.billingStatus === 'YTB' ? 'bg-gray-50 border-gray-200' :
                                                            site.billingStatus === 'ADD PR DONE' ? 'bg-blue-50 border-blue-200' :
                                                            site.billingStatus === 'WCC DONE' ? 'bg-purple-50 border-purple-200' :
                                                            site.billingStatus === 'BILLING DONE' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                        }`}>
                                                            <div className={`text-[9px] font-semibold ${
                                                                site.billingStatus === 'WIP' ? 'text-yellow-600' :
                                                                site.billingStatus === 'YTB' ? 'text-gray-600' :
                                                                site.billingStatus === 'ADD PR DONE' ? 'text-blue-600' :
                                                                site.billingStatus === 'WCC DONE' ? 'text-purple-600' :
                                                                site.billingStatus === 'BILLING DONE' ? 'text-green-600' : 'text-gray-600'
                                                            }`}>Billing Status</div>
                                                            <div className={`text-xs font-bold ${
                                                                site.billingStatus === 'WIP' ? 'text-yellow-700' :
                                                                site.billingStatus === 'YTB' ? 'text-gray-700' :
                                                                site.billingStatus === 'ADD PR DONE' ? 'text-blue-700' :
                                                                site.billingStatus === 'WCC DONE' ? 'text-purple-700' :
                                                                site.billingStatus === 'BILLING DONE' ? 'text-green-700' : 'text-gray-700'
                                                            }`}>{site.billingStatus || 'Not Set'}</div>
                                                        </div>
                                                        <div className={`rounded-md p-1.5 border ${
                                                            site.billingStatus === 'WIP' ? 'bg-yellow-50 border-yellow-200' :
                                                            site.billingStatus === 'YTB' ? 'bg-gray-50 border-gray-200' :
                                                            site.billingStatus === 'ADD PR DONE' ? 'bg-blue-50 border-blue-200' :
                                                            site.billingStatus === 'WCC DONE' ? 'bg-purple-50 border-purple-200' :
                                                            site.billingStatus === 'BILLING DONE' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                                                        }`}>
                                                            <div className={`text-[9px] font-semibold ${
                                                                site.billingStatus === 'WIP' ? 'text-yellow-600' :
                                                                site.billingStatus === 'YTB' ? 'text-gray-600' :
                                                                site.billingStatus === 'ADD PR DONE' ? 'text-blue-600' :
                                                                site.billingStatus === 'WCC DONE' ? 'text-purple-600' :
                                                                site.billingStatus === 'BILLING DONE' ? 'text-green-600' : 'text-gray-600'
                                                            }`}>Value</div>
                                                            <div className={`text-lg font-bold ${
                                                                site.billingStatus === 'WIP' ? 'text-yellow-700' :
                                                                site.billingStatus === 'YTB' ? 'text-gray-700' :
                                                                site.billingStatus === 'ADD PR DONE' ? 'text-blue-700' :
                                                                site.billingStatus === 'WCC DONE' ? 'text-purple-700' :
                                                                site.billingStatus === 'BILLING DONE' ? 'text-green-700' : 'text-gray-700'
                                                            }`}>₹{site.billingValue ? site.billingValue.toLocaleString() : '0'}</div>
                                                        </div>
                                                        <div className="bg-green-50 rounded-md p-1.5 border border-green-200">
                                                            <div className="text-[9px] text-green-600 font-semibold">Total Paid</div>
                                                            <div className="text-lg font-bold text-green-700">₹{(summary.civilPaid + summary.electricalPaid).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            // For all other roles: show only stage selector and total paid in a 2-column layout
                                            const currentSelectedStage = selectedStages[site.id] || site.currentStage;
                                            return (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg border border-blue-200 p-3">
                                                        <div className="text-[10px] font-semibold text-blue-600 mb-2">Select Stage</div>
                                                        <div className="flex gap-1 flex-wrap justify-center">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStageSelect(site.id, 'c1'); }}
                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${currentSelectedStage === 'c1' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-blue-50'}`}
                                                            >
                                                                {currentSelectedStage === 'c1' ? '✓ ' : ''}C1
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStageSelect(site.id, 'c2'); }}
                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${currentSelectedStage === 'c2' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-blue-50'}`}
                                                            >
                                                                {currentSelectedStage === 'c2' ? '✓ ' : ''}C2
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStageSelect(site.id, 'c1_c2_combined'); }}
                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${currentSelectedStage === 'c1_c2_combined' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-purple-50'}`}
                                                            >
                                                                {currentSelectedStage === 'c1_c2_combined' ? '✓ ' : ''}C1+C2
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleStageSelect(site.id, 'electrical'); }}
                                                                className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${currentSelectedStage === 'electrical' ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-amber-50'}`}
                                                            >
                                                                {currentSelectedStage === 'electrical' ? '⚡ ' : ''}Elec
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center justify-center bg-green-50 rounded-lg border border-green-200 p-3">
                                                        <div className="text-[10px] font-semibold text-green-600 mb-1">Total Paid</div>
                                                        <div className="text-xl font-bold text-green-700">₹{(summary.civilPaid + summary.electricalPaid).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Compact Stage Indicators - 4 Stages */}
                                        <div className="flex items-center gap-1">
                                            {site.currentStage && site.stages && (
                                                <>
                                                    <div className={`flex-1 text-center py-1 rounded text-[8px] font-bold ${
                                                        site.stages.c1?.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-400' :
                                                        site.stages.c1?.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border border-blue-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        C1 {site.stages.c1?.status === 'completed' ? '✓' : site.stages.c1?.status === 'in-progress' ? '⚙️' : '○'}
                                                    </div>
                                                    <span className="text-gray-400 text-[10px]">→</span>
                                                    <div className={`flex-1 text-center py-1 rounded text-[8px] font-bold ${
                                                        site.stages.c2?.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-400' :
                                                        site.stages.c2?.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border border-blue-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        C2 {site.stages.c2?.status === 'completed' ? '✓' : site.stages.c2?.status === 'in-progress' ? '⚙️' : '○'}
                                                    </div>
                                                    <span className="text-gray-400 text-[10px]">→</span>
                                                    <div className={`flex-1 text-center py-1 rounded text-[8px] font-bold ${
                                                        site.stages.c1_c2_combined?.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-400' :
                                                        site.stages.c1_c2_combined?.status === 'in-progress' ? 'bg-purple-100 text-purple-700 border border-purple-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        C1+C2 {site.stages.c1_c2_combined?.status === 'completed' ? '✓' : site.stages.c1_c2_combined?.status === 'in-progress' ? '⚙️' : '○'}
                                                    </div>
                                                    <span className="text-gray-400 text-[10px]">→</span>
                                                    <div className={`flex-1 text-center py-1 rounded text-[8px] font-bold ${
                                                        site.stages.electrical?.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-400' :
                                                        site.stages.electrical?.status === 'in-progress' ? 'bg-amber-100 text-amber-700 border border-amber-400' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        ELEC {site.stages.electrical?.status === 'completed' ? '✓' : site.stages.electrical?.status === 'in-progress' ? '⚡' : '○'}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Compact Coordinates */}
                                        {site.latitude && site.longitude && (
                                            <a
                                                href={`https://www.google.com/maps?q=${site.latitude},${site.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex items-center justify-center gap-1 py-1 px-2 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors text-[10px] font-medium text-blue-700"
                                            >
                                                <span>📍</span>
                                                <span className="truncate">{site.latitude}, {site.longitude}</span>
                                            </a>
                                        )}

                                        {/* Compact Vendor Billing */}
                                        {/* Billing Status Badge */}
                                        {currentUser && ['Admin', 'Manager', 'Backoffice'].includes(currentUser.role) && site.billingStatus && (
                                            <div className={`text-center py-1.5 px-2 rounded-md text-[10px] font-bold border ${
                                                site.billingStatus === 'WIP' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                                                site.billingStatus === 'YTB' ? 'bg-gray-50 text-gray-700 border-gray-300' :
                                                site.billingStatus === 'ADD PR DONE' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                                                site.billingStatus === 'WCC DONE' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                                                site.billingStatus === 'BILLING DONE' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-gray-50 text-gray-700 border-gray-300'
                                            }`}>
                                                📝 Billing: {site.billingStatus}
                                            </div>
                                        )}
                                    </div>

                                    {/* Compact Footer */}
                                    <div className="px-2.5 pb-2.5 flex gap-1.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onCompletionSubmitClick(site.id); }}
                                            disabled={!!site.paymentsLocked}
                                            className="flex-1 py-1.5 bg-orange-600 text-white font-bold rounded-md hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-[11px]"
                                        >
                                            Submit Completion
                                        </button>
                                        {currentUser && ['Admin', 'Manager', 'Backoffice'].includes(currentUser.role) && onRequestApproval && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onRequestApproval(site); }}
                                                className="flex-1 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-md hover:from-green-700 hover:to-green-800 transition-all text-[11px]"
                                            >
                                                📋 Request Approval
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
