import React from 'react';
import { JobCard, Transporter } from '../App';

interface JobCardsPageProps {
  jobCards: JobCard[];
  transporters: Transporter[];
  onUpdateStatus: (cardId: string, status: 'Assigned' | 'In Transit' | 'Completed') => void;
  onNewJobCard: () => void;
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

export const JobCardsPage: React.FC<JobCardsPageProps> = ({ jobCards, transporters, onUpdateStatus, onNewJobCard }) => {
  const getTransporterName = (id: string) => {
    return transporters.find(t => t.id === id)?.contactPerson || 'Unknown';
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex justify-end items-center gap-4 mb-6">
        <button
          onClick={onNewJobCard}
          className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-800 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Create New Job Card
        </button>
      </div>

      <div className="bg-zinc-800/50 backdrop-blur-sm border border-zinc-700 rounded-2xl shadow-2xl p-6 transition-all duration-500">
        <h2 className="text-2xl font-semibold mb-4 text-zinc-200 border-b border-zinc-600 pb-3">
          Transporter Job Cards
        </h2>
        {jobCards.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <p className="text-lg">No job cards found.</p>
            <p className="mt-2">Create your first job card to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobCards.map((card) => (
              <div key={card.id} className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-grow space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-500 text-lg">{getTransporterName(card.transporterId)}</span>
                  </div>
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
                    className={`cursor-pointer text-xs font-medium pl-3 pr-8 py-1 rounded-full border appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors duration-300 ${statusColors[card.status]}`}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
