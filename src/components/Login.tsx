import React, { useState } from 'react';

interface LoginProps {
  onLogin: (mobile: string, pass: string) => boolean;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForgotMessage, setShowForgotMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!mobile || !password) {
      setError('Please enter both mobile number and password.');
      return;
    }
    const success = onLogin(mobile, password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
    }
  };

  const inputStyles = "w-full bg-slate-100 border border-border rounded-lg py-3 px-4 text-text-primary focus:ring-2 focus:ring-primary focus:outline-none transition-colors";

  return (
    <div className="min-h-screen bg-white text-text-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto text-center">
        <header className="mb-10 animate-fade-in">
          <h1 className="text-5xl font-extrabold text-orange-500">
            Rugged Customs
          </h1>
        </header>
        
        <main className="w-full animate-slide-up">
           <p className="text-text-secondary text-lg mb-8">
            Please log in to continue.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label htmlFor="mobile" className="block text-sm font-medium text-text-secondary mb-2">Mobile Number</label>
              <input
                id="mobile"
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Enter your mobile number"
                className={inputStyles}
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className={inputStyles}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-center text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary/50"
              >
                Login
              </button>
            </div>
             <div className="text-center mt-4">
                <button
                    type="button"
                    onClick={() => setShowForgotMessage(!showForgotMessage)}
                    className="text-sm text-text-secondary hover:text-primary transition-colors"
                >
                    Forgot Password?
                </button>
            </div>
            {showForgotMessage && (
                <div className="mt-4 p-3 bg-blue-500/10 text-blue-700 border border-blue-500/20 rounded-md text-sm text-center">
                    Please contact your manager or a system administrator to have your password reset.
                </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
};