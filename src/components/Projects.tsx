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
        if (!currentUser || currentUser.role === 'Admin' || currentUser.role === 'Manager' || currentUser.role === 'Accountant') {
            return projectSummaries;
        }
        if (currentUser.role === 'Civil' || currentUser.role === 'Electricals' || currentUser.role === 'Electrical + Civil' || currentUser.role === 'Supervisor') {
            return projectSummaries.filter(summary => {
                const site = sites.find(s => s.id === summary.id);
                return site?.siteManagerId === currentUser.id;
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

            <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-3">
                    Sites Overview
                </h2>
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
                                    className={`bg-white p-5 rounded-lg border flex flex-col justify-between cursor-pointer transition-all duration-200 hover:border-orange-500/80 ${statusStyle.border}`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <h3 className="font-bold text-lg text-gray-900 transition-colors truncate">{summary.name}</h3>
                                            {canManageSites && (
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onEditSite(site); }}
                                                        className="text-xs font-semibold text-gray-500 hover:text-white transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onDeleteSite(site.id); }}
                                                        className="text-xs font-semibold text-red-500 hover:text-red-400 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-baseline mt-2">
                                            <p className="text-sm text-gray-500">Manager:</p>
                                            <p className="font-semibold text-gray-800 truncate" title={manager}>{manager}</p>
                                        </div>
                                        <div className="flex justify-between items-baseline mt-1">
                                            <p className="text-sm text-gray-500">Submissions:</p>
                                            <p className="font-semibold text-gray-800">{summary.requestCount}</p>
                                        </div>
                                        <div className="flex justify-between items-baseline mt-1">
                                            <p className="text-sm text-gray-500">Total Paid:</p>
                                            <p className="font-semibold text-green-400">₹{summary.totalPaid.toLocaleString()}</p>
                                        </div>
                                        <div className="flex justify-between items-baseline mt-1">
                                            <p className="text-sm text-gray-500">Status:</p>
                                            <p className={`text-sm font-bold ${statusStyle.text}`}>{summary.siteStatus}</p>
                                        </div>
                                        {site.latitude && site.longitude && (
                                            <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                                <p className="text-xs font-semibold text-blue-700 mb-1">📍 Lat & Long (Navigation)</p>
                                                <p className="text-base font-bold text-blue-900 tracking-wide">
                                                    {site.latitude}, {site.longitude}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-200/50 flex justify-end items-center">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onCompletionSubmitClick(site.id); }}
                                            disabled={summary.siteStatus === 'Closed'}
                                            className="text-sm px-3 py-1 bg-orange-600/80 text-white font-semibold rounded-md hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
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
