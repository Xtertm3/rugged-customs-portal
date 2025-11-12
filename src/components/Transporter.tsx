import React, { useState } from 'react';
import { Transporter as TransporterType } from '../App';

interface TransporterProps {
    transporters: TransporterType[];
    onAddTransporter: (contactPerson: string, contactNumber: string, password?: string) => void;
    onDeleteTransporter: (id: string) => void;
    onNewJobCard: () => void;
    onDownloadTransportersReport?: () => void;
    onViewDetails: (id: string) => void;
    onEditTransporter: (transporter: TransporterType) => void;
}

export const Transporter: React.FC<TransporterProps> = ({ 
    transporters, 
    onAddTransporter, 
    onDeleteTransporter, 
    onNewJobCard,
    onDownloadTransportersReport,
    onViewDetails,
    onEditTransporter,
}) => {
    const [contactPerson, setContactPerson] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleAddClick = () => {
        if (!contactPerson.trim() || !contactNumber.trim()) {
            setError('Please fill out all fields.');
            return;
        }
        setError('');
        onAddTransporter(contactPerson, contactNumber, password);
        setContactPerson('');
        setContactNumber('');
        setPassword('');
    };

    const inputStyles = "w-full bg-background border border-border rounded-lg py-2.5 px-3 text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition";
    const labelStyles = "block text-sm font-medium text-text-secondary mb-2";
    
    return (
      <div className="space-y-8">
        <div className="bg-surface border border-border rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4 mb-6">
              <h2 className="text-2xl font-semibold text-text-primary">Manage Transporters</h2>
              <div className="flex items-center gap-4">
                  {onDownloadTransportersReport && (
                      <button onClick={onDownloadTransportersReport} className="text-sm px-4 py-2 bg-surface hover:bg-border/50 border border-border text-text-secondary font-semibold rounded-lg transition-colors">Download Report</button>
                  )}
                  <button onClick={onNewJobCard} className="text-sm px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors">+ New Job Card</button>
              </div>
          </div>

          <div className="mb-8 p-4 bg-background/50 border border-border rounded-xl">
            <h3 className="font-semibold text-lg text-text-primary mb-4">Add New Transporter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label htmlFor="contact-person" className={labelStyles}>Contact Person</label>
                <input id="contact-person" type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputStyles} placeholder="e.g., John Doe"/>
              </div>
              <div>
                <label htmlFor="contact-number" className={labelStyles}>Contact Number</label>
                <input id="contact-number" type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className={inputStyles} placeholder="e.g., 9876543210"/>
              </div>
              <div>
                <label htmlFor="password" className={labelStyles}>Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} placeholder="Defaults to mobile number"/>
              </div>
              <button onClick={handleAddClick} className="w-full md:w-auto px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors self-end">Add</button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="space-y-3">
              {transporters.map(t => (
                  <div key={t.id} className="flex items-center gap-4 bg-background p-4 rounded-xl border border-border">
                      <div onClick={() => onViewDetails(t.id)} className="flex-grow cursor-pointer">
                          <p className="font-semibold text-text-primary">{t.contactPerson}</p>
                          <p className="text-sm text-text-secondary">{t.contactNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEditTransporter(t)} className="text-text-secondary hover:text-text-primary p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => onDeleteTransporter(t.id)} className="text-red-500/80 hover:text-red-500 p-1 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                  </div>
              ))}
          </div>
        </div>
      </div>
    );
};
