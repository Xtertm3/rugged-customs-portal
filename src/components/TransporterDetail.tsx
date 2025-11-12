import React, { useMemo } from 'react';
import { Transporter, JobCard } from '../App';

interface TransporterDetailProps {
  transporter: Transporter;
  jobCards: JobCard[];
  transporters: Transporter[];
  onBack: () => void;
  onUpdateStatus: (cardId: string, status: 'Assigned' | 'In Transit' | 'Completed') => void;
  onDownloadReport?: (transporterId: string) => void;
  onEditJobCard: (jobCard: JobCard) => void;
  canEdit: boolean;
}

const statusColors = {
  Assigned: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'In Transit': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const statusArrowColors = {
  Assigned: '60a5fa',
  'In Transit': 'facc15',
  Completed: '4ade80',
};

export const TransporterDetail: React.FC<TransporterDetailProps> = ({ transporter, jobCards, onBack, onUpdateStatus, onDownloadReport, onEditJobCard, canEdit }) => {

  const assignedJobs = useMemo(() => {
    return jobCards
      .filter(job => job.transporterId === transporter.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [jobCards, transporter.id]);

  return (
    <div className="w-full animate-fade-in">
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 font-semibold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Transporter List
        </button>
      </div>

      <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl p-6 transition-all duration-500">
        <div className="border-b border-zinc-600 pb-4 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-zinc-100">{transporter.contactPerson}</h2>
            <p className="text-md text-zinc-400 mt-1">{transporter.contactNumber}</p>
          </div>
          {onDownloadReport && (
            <button
              onClick={() => onDownloadReport(transporter.id)}
              className="w-full sm:w-auto text-sm px-4 py-2 bg-zinc-700/60 text-zinc-300 font-semibold rounded-lg hover:bg-zinc-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              Download Job Report
            </button>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-4 text-zinc-200">
          Assigned Job Cards ({assignedJobs.length})
        </h3>

        {assignedJobs.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-lg">No jobs have been assigned to {transporter.contactPerson}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedJobs.map((card) => (
              <div key={card.id} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-grow space-y-3">
                        <div className="text-sm">
                            <p className="text-zinc-400">
                            <span className="font-semibold">From:</span> {card.pickFrom}
                            </p>
                            <p className="text-zinc-400">
                            <span className="font-semibold">To:</span> {card.dropPoints.join(', ')}
                            </p>
                        </div>
                        <p className="text-xs text-zinc-500 bg-zinc-800/50 p-2 rounded-md">{card.description || 'No description.'}</p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                        <select
                            value={card.status}
                            onChange={(e) => onUpdateStatus(card.id, e.target.value as 'Assigned' | 'In Transit' | 'Completed')}
                            className={`cursor-pointer text-xs font-medium pl-3 pr-8 py-1 rounded-full border appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors duration-300 ${statusColors[card.status]}`}
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${statusArrowColors[card.status]}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                            aria-label={`Update status for job ${card.id}`}
                        >
                            <option className="bg-zinc-800 text-white" value="Assigned">Assigned</option>
                            <option className="bg-zinc-800 text-white" value="In Transit">In Transit</option>
                            <option className="bg-zinc-800 text-white" value="Completed">Completed</option>
                        </select>
                        <p className="text-xs text-zinc-500">{card.timestamp}</p>
                    </div>
                </div>
                 <div className="mt-4 pt-3 border-t border-zinc-700/50 flex items-center justify-end">
                    {/* FIX: Conditionally render the edit button based on the canEdit prop */}
                    {canEdit && (
                      <button onClick={() => onEditJobCard(card)} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                          Edit
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};