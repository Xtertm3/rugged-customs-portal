import React, { useState } from 'react';
import { cleanupFirestore } from '../utils/cleanupFirestore';

interface CleanupButtonProps {
  isAdmin: boolean;
}

export const CleanupButton: React.FC<CleanupButtonProps> = ({ isAdmin }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isAdmin) {
    return null;
  }

  const handleCleanup = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL data except team members. Are you absolutely sure?')) {
      setShowConfirm(false);
      return;
    }

    if (!window.confirm('This action CANNOT be undone. Type YES to confirm.')) {
      setShowConfirm(false);
      return;
    }

    setIsDeleting(true);
    setLogs([]);
    
    try {
      await cleanupFirestore((message) => {
        setLogs(prev => [...prev, message]);
      });
      alert('✅ Cleanup completed successfully!');
    } catch (error) {
      alert(`❌ Error during cleanup: ${error}`);
      console.error(error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium"
        >
          🗑️ Cleanup Database
        </button>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-2xl border-2 border-red-500 max-w-md">
          <h3 className="text-lg font-bold text-red-600 mb-2">⚠️ Danger Zone</h3>
          <p className="text-sm text-gray-700 mb-4">
            This will delete:
            <br />• All sites
            <br />• All payment requests
            <br />• All job cards
            <br />• All transporters
            <br />• All inventory data
            <br /><br />
            <strong>Team members will be preserved.</strong>
          </p>
          
          {logs.length > 0 && (
            <div className="bg-gray-100 p-3 rounded mb-4 max-h-40 overflow-y-auto text-xs font-mono">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCleanup}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
