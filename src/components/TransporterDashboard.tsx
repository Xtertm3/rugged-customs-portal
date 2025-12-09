import React, { useState } from 'react';
import { Transporter, JobCard, PaymentRequest } from '../App';
import { TransporterPaymentModal } from './TransporterPaymentModal';

interface TransporterDashboardProps {
  transporter: Transporter;
  jobCards: JobCard[];
  paymentRequests: PaymentRequest[];
  onRequestPaymentForJob?: (jobCard: JobCard, amount: string) => void;
  onLogout: () => void;
}

const statusColors = {
  Assigned: 'bg-blue-100 text-blue-700 border-blue-300',
  'In Transit': 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Completed: 'bg-green-100 text-green-700 border-green-300',
};

const paymentStatusColors = {
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  Approved: 'bg-blue-100 text-blue-700 border-blue-300',
  Paid: 'bg-green-100 text-green-700 border-green-300',
};

export const TransporterDashboard: React.FC<TransporterDashboardProps> = ({ transporter, jobCards, paymentRequests, onRequestPaymentForJob, onLogout }) => {
  // Filter payment requests made by this transporter
  const myPaymentRequests = paymentRequests.filter(req => req.assignTo === transporter.id);
  
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<JobCard | null>(null);

  const handlePaymentSubmit = (amount: string) => {
    if (selectedJobForPayment && onRequestPaymentForJob) {
      onRequestPaymentForJob(selectedJobForPayment, amount);
    }
    setSelectedJobForPayment(null);
  };

  return (
    <>
      {selectedJobForPayment && (
        <TransporterPaymentModal
          jobCard={selectedJobForPayment}
          onClose={() => setSelectedJobForPayment(null)}
          onSubmit={handlePaymentSubmit}
        />
      )}
    
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-4 font-sans antialiased">
      <div className="w-full max-w-5xl mx-auto my-8">
        <div className="relative text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-amber-600 mb-2">
              Transporter Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome, <span className="font-bold text-blue-600">{transporter.contactPerson}</span>
            </p>
            <div className="absolute top-0 right-0">
               <button onClick={onLogout} className="text-sm px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Logout</button>
            </div>
        </div>

        {/* Job Cards Section */}
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-3">
          Your Assigned Jobs ({jobCards.length})
        </h2>
        {jobCards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">You have no jobs assigned.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobCards.map((card) => (
              <div key={card.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-grow space-y-3">
                    <div className="text-sm space-y-1">
                      <p className="text-gray-700">
                        <span className="font-semibold">From:</span> {card.pickFrom}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">To:</span> {card.dropPoints.join(', ')}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">Status:</span>{' '}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[card.status]}`}>
                          {card.status}
                        </span>
                      </p>
                    </div>
                    {card.description && (
                      <p className="text-xs text-gray-600 bg-white p-2 rounded-md border border-gray-200">{card.description}</p>
                    )}
                    <p className="text-xs text-gray-500">{card.timestamp}</p>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                    {onRequestPaymentForJob && (
                      <button
                        onClick={() => setSelectedJobForPayment(card)}
                        className="text-sm px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
                      >
                        Request Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Requests Section */}
      <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b border-gray-200 pb-3">
          My Payment Requests ({myPaymentRequests.length})
        </h2>
        {myPaymentRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">You have no payment requests.</p>
            <p className="text-sm mt-2">Use "Request Payment" on a job card to submit one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myPaymentRequests.map((req) => (
              <div key={req.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-grow">
                  <p className="font-semibold text-gray-900">{req.siteName}</p>
                  <p className="text-sm text-gray-600">₹{req.amount} • {req.paymentFor}</p>
                  <p className="text-xs text-gray-500">{req.timestamp}</p>
                </div>
                <div className={`text-xs font-medium px-3 py-1.5 rounded-full border self-start sm:self-center ${paymentStatusColors[req.status]}`}>
                  {req.status}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
    </>
  );
};
