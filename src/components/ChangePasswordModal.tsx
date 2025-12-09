import React, { useState } from 'react';
import { Spinner } from './Spinner';

interface ChangePasswordModalProps {
    onClose: () => void;
    onSubmit: (newPassword: string) => Promise<void>;
    isForced?: boolean;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSubmit, isForced = false }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            setError('Both fields are required.');
            return;
        }
        if (newPassword.length < 4) {
            setError('Password must be at least 4 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await onSubmit(newPassword);
            // On success, App.tsx will handle closing the modal.
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const inputStyles = "w-full bg-zinc-700/50 border border-zinc-600 rounded-md py-2 px-3 text-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-zinc-300 mb-1";
    
    const modalContent = (
        <div 
          className="bg-zinc-800 border border-zinc-700 w-full max-w-md rounded-2xl shadow-2xl p-8 transform transition-all duration-300"
          onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-zinc-100">
                    {isForced ? 'Please set your new password' : 'Change Your Password'}
                </h2>
                {!isForced && (
                    <button onClick={onClose} className="text-zinc-400 text-2xl font-bold hover:text-white transition-colors">&times;</button>
                )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="new-password" className={labelStyles}>New Password</label>
                    <input 
                        id="new-password" 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={inputStyles} 
                    />
                </div>
                 <div>
                    <label htmlFor="confirm-password" className={labelStyles}>Confirm New Password</label>
                    <input 
                        id="confirm-password" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputStyles} 
                    />
                </div>
                {error && <p className="text-red-400 text-sm pt-1">{error}</p>}
                <div className="flex justify-end pt-4 gap-4">
                    {!isForced && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-zinc-600 text-white font-semibold rounded-lg hover:bg-zinc-700 transition-all"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-48 flex justify-center items-center px-6 py-2 bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-800 disabled:bg-blue-600/50"
                    >
                       {isLoading ? <Spinner /> : 'Set Password'}
                    </button>
                </div>
            </form>
        </div>
    );

    return (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={isForced ? undefined : onClose}
        >
          {modalContent}
        </div>
    );
};
