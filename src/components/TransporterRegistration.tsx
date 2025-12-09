import React, { useState } from 'react';

interface TransporterRegistrationProps {
  onRegister: (data: { contactPerson: string; contactNumber: string; password: string }) => { success: boolean; message: string };
  onNavigateToLogin: () => void;
}

export const TransporterRegistration: React.FC<TransporterRegistrationProps> = ({ onRegister, onNavigateToLogin }) => {
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!contactPerson || !contactNumber || !password || !confirmPassword) {
      setError('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = onRegister({ contactPerson, contactNumber, password });
    if (result.success) {
      setSuccess(result.message);
      setContactPerson('');
      setContactNumber('');
      setPassword('');
      setConfirmPassword('');
    } else {
      setError(result.message);
    }
  };

  const inputStyles = "w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-600 mb-2">
            Transporter Registration
          </h1>
          <p className="text-gray-600 text-lg">
            Create an account to manage your jobs.
          </p>
        </div>

        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-8 transition-all duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
              <input type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputStyles} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
              <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className={inputStyles} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} />
            </div>
            
            {error && <div className="text-center text-red-400 font-medium">{error}</div>}
            {success && <div className="text-center text-green-400 font-medium">{success}</div>}

            <button type="submit" className="w-full px-8 py-3 bg-blue-700 text-white font-bold rounded-lg">Register</button>
          </form>
           <div className="text-center mt-6">
                <button onClick={onNavigateToLogin} className="text-sm text-blue-500 hover:text-blue-400 font-semibold">
                    &larr; Back to Login
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
