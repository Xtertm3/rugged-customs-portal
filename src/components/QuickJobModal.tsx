import React, { useState, useCallback, useMemo } from 'react';
import { ProjectSummary, TeamMember } from '../App';
import { Spinner } from './Spinner';

interface QuickJobModalProps {
    transporterName: string;
    sites: ProjectSummary[];
    teamMembers: TeamMember[];
    onClose: () => void;
    onSubmit: (data: { siteName: string; assignTo: string; stage: 'Civil' | 'Electricals' }) => Promise<void>;
}

export const QuickJobModal: React.FC<QuickJobModalProps> = ({ transporterName, sites, teamMembers, onClose, onSubmit }) => {
    const [siteName, setSiteName] = useState(sites.length > 0 ? sites[0].name : '');
    const [stage, setStage] = useState<'Civil' | 'Electricals'>('Civil');
    const [assignTo, setAssignTo] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const filteredTeamMembers = useMemo(() => {
        return teamMembers.filter(m => m.role === stage || m.role === 'Electrical + Civil' || m.role === 'Manager' || m.role === 'Supervisor');
    }, [teamMembers, stage]);

    useState(() => {
      if (filteredTeamMembers.length > 0) {
        setAssignTo(filteredTeamMembers[0].id);
      } else {
        setAssignTo('');
      }
    });

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!siteName || !assignTo || !stage) {
            setError("Please fill out all fields.");
            return;
        }

        setIsProcessing(true);
        try {
            await onSubmit({ siteName, assignTo, stage });
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsProcessing(false);
        }
    }, [siteName, assignTo, stage, onSubmit]);
    
    const inputStyles = "w-full bg-zinc-700/50 border border-zinc-600 rounded-md py-2 px-3 text-zinc-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-zinc-300 mb-2";

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
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100">Assign New Job</h2>
                        <p className="text-sm text-zinc-400">To: <span className="font-semibold text-orange-400">{transporterName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 text-2xl font-bold hover:text-white transition-colors">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="site-select" className={labelStyles}>Site Name</label>
                        <select 
                            id="site-select"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            className={inputStyles}
                            disabled={sites.length === 0}
                        >
                           {sites.length > 0 ? (
                             sites.map(site => <option key={site.name} value={site.name}>{site.name}</option>)
                           ) : (
                             <option value="" disabled>No sites available</option>
                           )}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="stage-select" className={labelStyles}>Stage</label>
                        <select 
                            id="stage-select"
                            value={stage}
                            onChange={(e) => setStage(e.target.value as 'Civil' | 'Electricals')}
                            className={inputStyles}
                        >
                           <option value="Civil">Civil</option>
                           <option value="Electricals">Electricals</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="assignTo-select" className={labelStyles}>Assign To</label>
                        <select 
                            id="assignTo-select"
                            value={assignTo}
                            onChange={(e) => setAssignTo(e.target.value)}
                            className={inputStyles}
                            disabled={filteredTeamMembers.length === 0}
                        >
                           {filteredTeamMembers.length > 0 ? (
                             filteredTeamMembers.map(member => <option key={member.id} value={member.id}>{member.name}</option>)
                           ) : (
                             <option value="">No team members for this stage</option>
                           )}
                        </select>
                    </div>
                    
                    {error && <p className="text-red-400 text-sm pt-2">{error}</p>}

                    <div className="flex justify-end pt-4 gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isProcessing || sites.length === 0 || filteredTeamMembers.length === 0}
                            className="w-full flex justify-center items-center px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-lg hover:bg-orange-700 disabled:bg-orange-500/50 disabled:cursor-not-allowed transition-all"
                        >
                            {isProcessing ? <><Spinner /> <span>Assigning...</span></> : "Assign Job"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};