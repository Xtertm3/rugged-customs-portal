import React, { useState } from 'react';
import { PaymentRequest, Site, TeamMember } from '../App';

interface DocumentLibraryProps {
  sites: Site[];
  paymentRequests: PaymentRequest[];
  teamMembers: TeamMember[];
  onBack: () => void;
}

export const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ sites, paymentRequests, teamMembers, onBack }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Helper to get team member name
  const getTeamMemberName = (assignTo?: string, transporterId?: string) => {
    if (assignTo) {
      const member = teamMembers.find(m => m.id === assignTo);
      return member?.name || 'Unknown';
    }
    if (transporterId) {
      const member = teamMembers.find(m => m.id === transporterId);
      return member?.name || 'Unknown Transporter';
    }
    return 'Unknown';
  };

  // Filter payment requests by selected site and only those with documents
  const filteredRequests = paymentRequests.filter(req => {
    const hasDocuments = (req.photos && req.photos.length > 0) || (req.documents && req.documents.length > 0);
    if (selectedSiteId === 'all') return hasDocuments;
    return req.siteName === selectedSiteId && hasDocuments;
  });

  // Get all photos and documents from filtered requests
  const allPhotos = filteredRequests.flatMap(req => 
    (req.photos || []).map(photo => ({
      ...photo,
      requestId: req.id,
      siteName: req.siteName,
      teamMember: getTeamMemberName(req.assignTo, req.transporterId),
      timestamp: req.timestamp
    }))
  );

  const allDocuments = filteredRequests.flatMap(req => 
    (req.documents || []).map(doc => ({
      ...doc,
      requestId: req.id,
      siteName: req.siteName,
      teamMember: getTeamMemberName(req.assignTo, req.transporterId),
      timestamp: req.timestamp
    }))
  );

  const downloadFile = (dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllPhotos = () => {
    allPhotos.forEach((photo, index) => {
      setTimeout(() => downloadFile(photo.dataUrl, `photo_${index + 1}_${photo.name}`), index * 100);
    });
  };

  const downloadAllDocuments = () => {
    allDocuments.forEach((doc, index) => {
      setTimeout(() => downloadFile(doc.dataUrl, doc.name), index * 100);
    });
  };

  return (
    <div className="w-full animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
          <p className="text-gray-600 mt-1">View and manage all documents across sites</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Site Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Site</label>
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2.5 px-4 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sites ({paymentRequests.filter(r => (r.photos && r.photos.length > 0) || (r.documents && r.documents.length > 0)).length} requests)</option>
              {sites.map(site => {
                const siteRequestCount = paymentRequests.filter(r => 
                  r.siteName === site.siteName && ((r.photos && r.photos.length > 0) || (r.documents && r.documents.length > 0))
                ).length;
                if (siteRequestCount === 0) return null;
                return (
                  <option key={site.id} value={site.siteName}>
                    {site.siteName} ({siteRequestCount} requests)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{allPhotos.length}</p>
              <p className="text-xs text-blue-700 font-medium">Photos</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-3 text-center">
              <p className="text-2xl font-bold text-green-600">{allDocuments.length}</p>
              <p className="text-xs text-green-700 font-medium">Documents</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{filteredRequests.length}</p>
              <p className="text-xs text-blue-700 font-medium">Requests</p>
            </div>
          </div>
        </div>

        {/* Bulk Download Buttons */}
        {(allPhotos.length > 0 || allDocuments.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            {allPhotos.length > 0 && (
              <button
                onClick={downloadAllPhotos}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download All Photos ({allPhotos.length})
              </button>
            )}
            {allDocuments.length > 0 && (
              <button
                onClick={downloadAllDocuments}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download All Documents ({allDocuments.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-600">No payment requests with documents for the selected site.</p>
        </div>
      ) : (
        <>
          {/* Photos Section */}
          {allPhotos.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Photos ({allPhotos.length})
              </h2>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allPhotos.map((photo, index) => (
                    <div key={index} className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                      <img 
                        src={photo.dataUrl} 
                        alt={photo.name}
                        className="w-full h-48 object-cover cursor-pointer"
                        onClick={() => setSelectedImage(photo.dataUrl)}
                      />
                      <div className="p-3">
                        <p className="text-xs font-semibold text-gray-900 truncate">{photo.siteName}</p>
                        <p className="text-xs text-gray-600 truncate">By: {photo.teamMember}</p>
                        <p className="text-xs text-gray-500 mt-1">{photo.timestamp}</p>
                        <button
                          onClick={() => downloadFile(photo.dataUrl, photo.name)}
                          className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {allPhotos.map((photo, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <img 
                        src={photo.dataUrl} 
                        alt={photo.name}
                        className="w-16 h-16 object-cover rounded cursor-pointer"
                        onClick={() => setSelectedImage(photo.dataUrl)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{photo.name}</p>
                        <p className="text-xs text-gray-600">Site: {photo.siteName} | By: {photo.teamMember}</p>
                        <p className="text-xs text-gray-500">{photo.timestamp}</p>
                      </div>
                      <button
                        onClick={() => downloadFile(photo.dataUrl, photo.name)}
                        className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents Section */}
          {allDocuments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                Documents ({allDocuments.length})
              </h2>
              <div className="space-y-2">
                {allDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-600">Site: {doc.siteName} | By: {doc.teamMember}</p>
                      <p className="text-xs text-gray-500">{doc.timestamp}</p>
                    </div>
                    <button
                      onClick={() => downloadFile(doc.dataUrl, doc.name)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
