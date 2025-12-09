import React, { useMemo } from 'react';
import { Transporter, JobCard } from '../App';

interface TransporterDetailProps {
  transporter: Transporter;
  jobCards: JobCard[];
  transporters: Transporter[];
  onBack: () => void;
  onUpdateStatus?: (cardId: string, status: 'Assigned' | 'In Transit' | 'Completed') => void;
  onDownloadReport?: (transporterId: string) => void;
  onEditJobCard?: (jobCard: JobCard) => void;
  canEdit: boolean;
}

const statusColors = {
  Assigned: 'bg-blue-100 text-blue-700 border-blue-300',
  'In Transit': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Completed: 'bg-green-100 text-green-700 border-green-300',
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
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-400 font-semibold transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Transporter List
        </button>
      </div>

      <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-6 transition-all duration-500">
        <div className="border-b border-gray-200 pb-4 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{transporter.contactPerson}</h2>
            <p className="text-md text-gray-600 mt-1">{transporter.contactNumber}</p>
          </div>
          {onDownloadReport && (
            <button
              onClick={() => onDownloadReport(transporter.id)}
              className="w-full sm:w-auto text-sm px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              Download Job Report
            </button>
          )}
        </div>

        <h3 className="text-xl font-semibold mb-4 text-gray-900">
          Assigned Job Cards ({assignedJobs.length})
        </h3>

        {assignedJobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No jobs have been assigned to {transporter.contactPerson}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedJobs.map((card) => (
              <div key={card.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-grow space-y-3">
                        <div className="text-sm">
                            <p className="text-gray-700">
                            <span className="font-semibold">From:</span> {card.pickFrom}
                            </p>
                            <p className="text-gray-700">
                            <span className="font-semibold">To:</span> {card.dropPoints.join(', ')}
                            </p>
                        </div>
                        <p className="text-xs text-gray-600 bg-white p-2 rounded-md border border-gray-200">{card.description || 'No description.'}</p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                        {onUpdateStatus ? (
                          <select
                              value={card.status}
                              onChange={(e) => onUpdateStatus(card.id, e.target.value as 'Assigned' | 'In Transit' | 'Completed')}
                              className={`cursor-pointer text-xs font-medium px-3 py-1.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${statusColors[card.status]}`}
                              aria-label={`Update status for job ${card.id}`}
                          >
                              <option value="Assigned">Assigned</option>
                              <option value="In Transit">In Transit</option>
                              <option value="Completed">Completed</option>
                          </select>
                        ) : (
                          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColors[card.status]}`}>
                            {card.status}
                          </span>
                        )}
                        <p className="text-xs text-gray-500">{card.timestamp}</p>
                    </div>
                </div>
                 <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-end">
                    {/* FIX: Conditionally render the edit button based on the canEdit prop */}
                    {canEdit && onEditJobCard && (
                      <button onClick={() => onEditJobCard(card)} className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1">
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
