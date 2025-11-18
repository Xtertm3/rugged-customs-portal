import React, { useMemo } from 'react';
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
    onCompletionSubmitClick
}) => {
    const displayedSummaries = useMemo(() => {
        // Admin-like roles see all sites
        if (!currentUser || currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Accountant') {
            return projectSummaries;
        }
        // Field roles see sites where they are part of any stage team OR legacy manager
        if (currentUser.role === 'Civil' || currentUser.role === 'Electricals' || currentUser.role === 'Electrical + Civil' || currentUser.role === 'Supervisor') {
            return projectSummaries.filter(summary => {
                const site = sites.find(s => s.id === summary.id);
                if (!site) return false;
                const isLegacyManager = site.siteManagerId === currentUser.id;
                const inCivilTeam = Array.isArray(site.stages?.civil?.assignedTeamIds) && site.stages.civil.assignedTeamIds.includes(currentUser.id);
                const inElectricalTeam = Array.isArray(site.stages?.electrical?.assignedTeamIds) && site.stages.electrical.assignedTeamIds.includes(currentUser.id);
                return isLegacyManager || inCivilTeam || inElectricalTeam;
            });
        }
        return [];
    }, [projectSummaries, currentUser, sites]);


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

                            return (
                                <div 
                                    key={summary.id} 
                                    onClick={() => onViewSiteDetails(summary.name)}
                                    className={`bg-white p-4 rounded-xl border flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:border-orange-400/70 ${statusStyle.border}`}
                                >
                                    <div className="flex items-start gap-2">
                                        <h3 className="font-semibold text-gray-900 truncate flex-1" title={summary.name}>{summary.name}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusStyle.text} ${statusStyle.border.replace('border-','border-')}`}>{summary.siteStatus}</span>
                                        {canManageSites && (
                                            <div className="flex items-center gap-2 ml-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onEditSite(site); }}
                                                    className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                                                >Edit</button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDeleteSite(site.id); }}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                                                >Delete</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-gray-500 truncate">{site.location}</div>

                                    {/* Compact info chips */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">Manager: <span className="font-semibold">{manager}</span></span>
                                        <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">Submissions: <span className="font-semibold">{summary.requestCount}</span></span>
                                        <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700">Paid: ₹{summary.totalPaid.toLocaleString()}</span>
                                        {site.paymentsLocked && (
                                            <span className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600">Payments Closed</span>
                                        )}
                                    </div>

                                    {/* Simple stage badges */}
                                    {site.currentStage && site.stages && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className={`px-2 py-1 rounded-md ${
                                                site.stages.civil.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                site.stages.civil.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                            }`}>Civil: {site.stages.civil.status.replace('-', ' ')}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className={`px-2 py-1 rounded-md ${
                                                site.stages.electrical.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                site.stages.electrical.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                                            }`}>Electrical: {site.stages.electrical.status.replace('-', ' ')}</span>
                                        </div>
                                    )}

                                    {/* Footer actions */}
                                    <div className="pt-2 flex items-center gap-2">
                                        {site.latitude && site.longitude && (
                                            <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                                {site.latitude}, {site.longitude}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onCompletionSubmitClick(site.id); }}
                                            disabled={!!site.paymentsLocked}
                                            className="ml-auto text-xs px-3 py-1.5 bg-orange-600 text-white font-semibold rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            Submit Completion
                                        </button>
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
