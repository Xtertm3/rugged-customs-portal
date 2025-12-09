import React, { useState } from 'react';
import { JobCard } from '../App';

interface TransporterPaymentModalProps {
  jobCard: JobCard;
  onClose: () => void;
  onSubmit: (amount: string) => void;
}

export const TransporterPaymentModal: React.FC<TransporterPaymentModalProps> = ({ jobCard, onClose, onSubmit }) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    onSubmit(amount);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white border border-gray-200 w-full max-w-md rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Request Payment</h2>
          <button 
            onClick={onClose} 
            className="text-gray-600 text-2xl font-bold hover:text-gray-900 transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">From:</span> {jobCard.pickFrom}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">To:</span> {jobCard.dropPoints.join(', ')}
            </p>
            {jobCard.description && (
              <p className="text-xs text-gray-600 mt-2">{jobCard.description}</p>
            )}
          </div>

          <div>
            <label htmlFor="payment-amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount (₹)
            </label>
            <input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="Enter amount"
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
