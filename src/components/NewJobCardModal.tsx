import React, { useState, useCallback } from 'react';
import { Transporter, JobCard } from '../App';

interface NewJobCardModalProps {
  transporters: Transporter[];
  ongoingSites: string[];
  onClose: () => void;
  onSubmit: (data: Omit<JobCard, 'id' | 'status' | 'timestamp'>) => void;
}

export const NewJobCardModal: React.FC<NewJobCardModalProps> = ({ transporters, ongoingSites, onClose, onSubmit }) => {
  const [transporterId, setTransporterId] = useState(transporters.length > 0 ? transporters[0].id : '');
  const [pickFrom, setPickFrom] = useState('');
  const [dropPoints, setDropPoints] = useState<string[]>([ongoingSites.length > 0 ? ongoingSites[0] : '']);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddDropPoint = () => {
    if (dropPoints.length < 5) {
      const nextSite = ongoingSites.find(s => !dropPoints.includes(s)) || (ongoingSites.length > 0 ? ongoingSites[0] : '');
      setDropPoints([...dropPoints, nextSite]);
    }
  };

  const handleDropPointChange = (index: number, value: string) => {
    const newDropPoints = [...dropPoints];
    newDropPoints[index] = value;
    setDropPoints(newDropPoints);
  };

  const handleRemoveDropPoint = (index: number) => {
    if (dropPoints.length > 1) {
      const newDropPoints = dropPoints.filter((_, i) => i !== index);
      setDropPoints(newDropPoints);
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (transporters.length === 0) {
      setError("Cannot create a job: No transporters available. Please add a transporter first.");
      return;
    }
    if (ongoingSites.length === 0) {
      setError("Cannot create a job: There are no ongoing sites to select as a drop point.");
      return;
    }
    if (!transporterId || !pickFrom.trim() || dropPoints.some(dp => !dp.trim())) {
      setError("Please fill out all required fields and ensure no drop points are empty.");
      return;
    }

    onSubmit({ transporterId, pickFrom, dropPoints, description });
    onClose();
  }, [transporterId, pickFrom, dropPoints, description, onSubmit, onClose, transporters, ongoingSites]);

  const inputStyles = "w-full bg-zinc-700/50 border border-zinc-600 rounded-md py-2 px-3 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition";
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
          <h2 className="text-2xl font-bold text-zinc-100">Create New Job Card</h2>
          <button onClick={onClose} className="text-zinc-400 text-2xl font-bold hover:text-white transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="transporter-select" className={labelStyles}>Transporter</label>
            <select
              id="transporter-select"
              value={transporterId}
              onChange={(e) => setTransporterId(e.target.value)}
              className={inputStyles}
              disabled={transporters.length === 0}
            >
              {transporters.length > 0 ? (
                transporters.map(t => <option key={t.id} value={t.id}>{t.contactPerson}</option>)
              ) : (
                <option value="" disabled>No transporters available</option>
              )}
            </select>
          </div>
          <div>
            <label htmlFor="pick-from" className={labelStyles}>Pick From</label>
            <input
              id="pick-from"
              type="text"
              value={pickFrom}
              onChange={(e) => setPickFrom(e.target.value)}
              placeholder="e.g., Warehouse A"
              className={inputStyles}
            />
          </div>
          <div>
            <label className={labelStyles}>Drop Points (up to 5)</label>
            <div className="space-y-2">
              {dropPoints.map((dp, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={dp}
                    onChange={(e) => handleDropPointChange(index, e.target.value)}
                    className={inputStyles}
                    disabled={ongoingSites.length === 0}
                  >
                    {ongoingSites.length > 0 ? (
                      ongoingSites.map(site => (
                        <option key={site} value={site} className="bg-zinc-800 text-white">{site}</option>
                      ))
                    ) : (
                      <option value="" disabled>No ongoing sites available</option>
                    )}
                  </select>
                  {dropPoints.length > 1 && (
                    <button type="button" onClick={() => handleRemoveDropPoint(index)} className="text-red-500 hover:text-red-400 p-1 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {dropPoints.length < 5 && (
              <button type="button" onClick={handleAddDropPoint} className="mt-2 text-sm text-blue-500 font-semibold hover:text-blue-400">
                + Add Another Drop Point
              </button>
            )}
          </div>
          <div>
            <label htmlFor="description" className={labelStyles}>Description (Optional)</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 2 pallets of 95 Sq MM Red cable"
              className={inputStyles}
            ></textarea>
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
              disabled={transporters.length === 0 || ongoingSites.length === 0}
              className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-800 disabled:bg-blue-600/50 disabled:cursor-not-allowed transition-all"
            >
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
