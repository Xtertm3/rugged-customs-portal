import React, { useState, useEffect } from 'react';
import { Transporter } from '../App';

interface EditTransporterModalProps {
    transporter: Transporter;
    onClose: () => void;
    onUpdate: (updatedTransporter: Transporter) => void;
}

export const EditTransporterModal: React.FC<EditTransporterModalProps> = ({ transporter, onClose, onUpdate }) => {
    const [contactPerson, setContactPerson] = useState(transporter.contactPerson);
    const [contactNumber, setContactNumber] = useState(transporter.contactNumber);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setContactPerson(transporter.contactPerson);
        setContactNumber(transporter.contactNumber);
        setPassword('');
    }, [transporter]);

    const handleUpdateClick = () => {
        if (!contactPerson.trim() || !contactNumber.trim()) {
            setError('Contact person and number cannot be empty.');
            return;
        }
        setError('');
        onUpdate({ ...transporter, contactPerson, contactNumber, password: password || undefined });
    };

    const inputStyles = "w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-gray-700 mb-1";

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white border border-gray-200 w-full max-w-lg rounded-2xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Transporter</h2>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="edit-transporter-name" className={labelStyles}>Contact Person</label>
                        <input id="edit-transporter-name" type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="edit-transporter-number" className={labelStyles}>Contact Number</label>
                        <input id="edit-transporter-number" type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className={inputStyles} />
                    </div>
                     <div>
                        <label htmlFor="edit-transporter-password" className={labelStyles}>New Password</label>
                        <input
                            id="edit-transporter-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep unchanged"
                            className={inputStyles}
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <div className="flex justify-end pt-4 gap-4">
                         <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors">Cancel</button>
                         <button onClick={handleUpdateClick} className="px-8 py-2 bg-blue-700 text-white font-semibold rounded-lg">Update Transporter</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
