import React, { useState } from 'react';
import { PaymentRequest, TeamMember } from '../App';

interface PaymentRequestDetailProps {
  request: PaymentRequest;
  onBack: () => void;
  currentUser?: TeamMember | null;
}

export const PaymentRequestDetail: React.FC<PaymentRequestDetailProps> = ({ request, onBack, currentUser }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Access control: Teams can only see their own requests, Admin/Manager/Backoffice/Accountant can see all
  const canViewRequest = () => {
    if (!currentUser) return false;
    
    // Admin, Manager, Backoffice, and Accountant can see all requests
    if (['Admin', 'Manager', 'Backoffice', 'Accountant'].includes(currentUser.role)) {
      return true;
    }
    
    // Team members and transporters can only see their own requests
    return request.assignTo === currentUser.id || request.transporterId === currentUser.id;
  };

  if (!canViewRequest()) {
    return (
      <div className="w-full animate-fade-in">
        <div className="mb-6">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to view this payment request.</p>
          </div>
        </div>
      </div>
    );
  }

  const downloadFile = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusColors = {
    Pending: { text: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-300' },
    Approved: { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' },
    Paid: { text: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-300' },
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Payment Request Details Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{request.siteName}</h1>
            <p className="text-gray-600">{request.location}</p>
            {request.projectType && <p className="text-sm text-gray-500 mt-1">Project Type: {request.projectType}</p>}
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <span className={`text-sm font-bold px-4 py-2 rounded-full border ${statusColors[request.status].text} ${statusColors[request.status].bg} ${statusColors[request.status].border}`}>
              {request.status}
            </span>
            <p className="text-xs text-gray-500">{request.timestamp}</p>
          </div>
        </div>

        {/* Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Payment For</p>
            <p className="text-lg text-gray-900">{request.paymentFor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-1">Amount</p>
            <p className="text-3xl font-bold text-blue-600">₹{request.amount?.toLocaleString()}</p>
          </div>
        </div>

        {/* Reasons */}
        {request.reasons && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 font-semibold mb-2">Reasons / Description</p>
            <p className="text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200">{request.reasons}</p>
          </div>
        )}

        {/* Coordinates */}
        {(request.latitude || request.longitude) && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 font-semibold mb-2">Coordinates</p>
            <div className="flex gap-4 text-sm text-gray-700">
              {request.latitude && <span>Latitude: {request.latitude}</span>}
              {request.longitude && <span>Longitude: {request.longitude}</span>}
            </div>
          </div>
        )}

        {/* Status History */}
        {request.statusHistory && request.statusHistory.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 font-semibold mb-3">Status History</p>
            <div className="space-y-2">
              {request.statusHistory.map((entry, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[entry.status].text} ${statusColors[entry.status].bg}`}>
                    {entry.status}
                  </span>
                  <span className="text-gray-600">{entry.userName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{entry.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Photos Section */}
      {request.photos && request.photos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Photos ({request.photos.length})
            </h2>
            <button
              onClick={() => request.photos.forEach((photo, i) => downloadFile(photo.dataUrl, photo.name || `photo-${i + 1}`))}
              className="text-sm px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download All Photos
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {request.photos.map((photo, index) => (
              <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-orange-500 transition-colors cursor-pointer">
                <img
                  src={photo.dataUrl}
                  alt={photo.name || `Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onClick={() => setSelectedImage(photo.dataUrl)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(photo.dataUrl, photo.name || `photo-${index + 1}`);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white rounded-full hover:bg-blue-600 hover:text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                  {photo.name || `Photo ${index + 1}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {request.documents && request.documents.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Documents ({request.documents.length})
            </h2>
            <button
              onClick={() => request.documents.forEach((doc, i) => downloadFile(doc.dataUrl, doc.name || `document-${i + 1}`))}
              className="text-sm px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download All Documents
            </button>
          </div>
          <div className="space-y-3">
            {request.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-500 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{doc.name || `Document ${index + 1}`}</p>
                    <p className="text-xs text-gray-500">Click download to save</p>
                  </div>
                </div>
                <button
                  onClick={() => downloadFile(doc.dataUrl, doc.name || `document-${index + 1}`)}
                  className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-orange-500 transition-colors"
          >
            &times;
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
