import React, { useState, useCallback, useEffect } from 'react';
import { Transporter, JobCard } from '../App';

interface EditJobCardModalProps {
  jobCard: JobCard;
  transporters: Transporter[];
  ongoingSites: string[];
  onClose: () => void;
  onUpdate: (updatedCard: JobCard) => void;
}

export const EditJobCardModal: React.FC<EditJobCardModalProps> = ({ jobCard, transporters, ongoingSites, onClose, onUpdate }) => {
  const [transporterId, setTransporterId] = useState(jobCard.transporterId);
  const [pickFrom, setPickFrom] = useState(jobCard.pickFrom);
  const [dropPoints, setDropPoints] = useState(jobCard.dropPoints);
  const [description, setDescription] = useState(jobCard.description);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTransporterId(jobCard.transporterId);
    setPickFrom(jobCard.pickFrom);
    setDropPoints(jobCard.dropPoints);
    setDescription(jobCard.description);
  }, [jobCard]);

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

    if (!transporterId || !pickFrom.trim() || dropPoints.some(dp => !dp.trim())) {
      setError("Please fill out all required fields and ensure no drop points are empty.");
      return;
    }

    onUpdate({ ...jobCard, transporterId, pickFrom, dropPoints, description });
    onClose();
  }, [jobCard, transporterId, pickFrom, dropPoints, description, onUpdate, onClose]);

  const inputStyles = "w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition";
  const labelStyles = "block text-sm font-medium text-gray-700 mb-2";

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 w-full max-w-lg rounded-2xl shadow-2xl p-8 transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Job Card</h2>
          <button onClick={onClose} className="text-gray-600 text-2xl font-bold hover:text-gray-900 transition-colors">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-transporter-select" className={labelStyles}>Transporter</label>
            <select
              id="edit-transporter-select"
              value={transporterId}
              onChange={(e) => setTransporterId(e.target.value)}
              className={inputStyles}
            >
              {transporters.map(t => <option key={t.id} value={t.id}>{t.contactPerson}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-pick-from" className={labelStyles}>Pick From</label>
            <input
              id="edit-pick-from"
              type="text"
              value={pickFrom}
              onChange={(e) => setPickFrom(e.target.value)}
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
                  >
                    {[...new Set([...ongoingSites, dp])].sort().map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
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
            <label htmlFor="edit-description" className={labelStyles}>Description (Optional)</label>
            <textarea
              id="edit-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputStyles}
            ></textarea>
          </div>

          {error && <p className="text-red-400 text-sm pt-2">{error}</p>}

          <div className="flex justify-end pt-4 gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-800 transition-all"
            >
              Update Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
