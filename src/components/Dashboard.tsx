import React, { useState, useMemo } from 'react';
import { PaymentRequest, JobCard, Transporter, TeamMember, Site } from '../App';
import { PaymentHistory } from './PaymentHistory';

interface DashboardProps {
  requests: PaymentRequest[];
  stats: {
    ongoingProjects: number;
    completedThisMonth: number;
  };
  currentUser?: TeamMember | null;
  onOpenTransactionsReport?: () => void;
  sites: Site[];
  onUpdateRequestStatus: (requestId: string, newStatus: 'Pending' | 'Approved' | 'Paid') => void;
  onViewRequestDetails?: (requestId: string) => void;
  onEditRequest: (request: PaymentRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  canApprove: boolean;
  canEdit: boolean;
  jobCards: JobCard[];
  transporters: Transporter[];
  onUpdateJobCardStatus: (cardId: string, status: 'Assigned' | 'In Transit' | 'Completed') => void;
  canManageTransporters: boolean;
  onDownloadMyInventoryReport: () => void;
  onCreateRequest: (siteId: string) => void;
}

const cardStatusColors = {
  Pending: 'bg-amber-50 border-amber-300',
  Approved: 'bg-green-50 border-green-300',
  Paid: 'bg-blue-50 border-blue-300',
};

const statusColors = {
  Pending: { text: 'text-amber-700', bg: 'bg-amber-100', ring: 'ring-amber-400' },
  Approved: { text: 'text-green-700', bg: 'bg-green-100', ring: 'ring-green-400' },
  Paid: { text: 'text-blue-700', bg: 'bg-blue-100', ring: 'ring-blue-400' },
};

const jobCardStatusColors = {
  Assigned: 'bg-blue-50 border-blue-300',
  'In Transit': 'bg-amber-50 border-amber-300',
  Completed: 'bg-green-50 border-green-300',
};

const jobStatusArrowColors = {
  Assigned: '60a5fa', // blue-400
  'In Transit': 'facc15', // yellow-400
  Completed: '4ade80', // green-400
};


export const Dashboard: React.FC<DashboardProps> = ({ 
  requests, 
  stats, 
  currentUser,
  onOpenTransactionsReport,
  sites,
  onUpdateRequestStatus, 
  onViewRequestDetails,
  onEditRequest, 
  onDeleteRequest, 
  canApprove, 
  canEdit,
  jobCards,
  transporters,
  onUpdateJobCardStatus,
  canManageTransporters,
  onDownloadMyInventoryReport,
  onCreateRequest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Paid'>('All');
  
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<'All' | 'Assigned' | 'In Transit' | 'Completed'>('All');

  const paymentOnlyRequests = requests.filter(req => req.amount && req.paymentFor);

  // Filter out Paid requests from approval queue and sort by newest first
  const filteredRequests = paymentOnlyRequests
    .filter(req => req.status !== 'Paid') // Hide paid requests from approval queue
    .filter(req => statusFilter === 'All' || req.status === statusFilter)
    .filter(req => 
      req.siteName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by timestamp, newest first
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
    
  // Limit approval queue visibility for non-admin users to only sites they manage / are assigned to
  const visibleRequests = (() => {
    if (!currentUser) return filteredRequests;
    const role = currentUser.role;
    // Admin/Manager/Accountant see all
    if (role === 'Admin' || role === 'Manager' || role === 'Accountant') return filteredRequests;
    // Civil/Electrical/Electrical + Civil/Supervisor see only requests for sites they manage
    if (role === 'Civil' || role === 'Electricals' || role === 'Electrical + Civil' || role === 'Supervisor') {
      const managedSiteNames = sites.filter((s: Site) => s.siteManagerId === currentUser.id).map((s: Site) => s.siteName);
      return filteredRequests.filter(req => managedSiteNames.includes(req.siteName));
    }
    // Other roles see none
    return [] as typeof filteredRequests;
  })();
    
  const getTransporterName = (id: string) => {
    return transporters.find(t => t.id === id)?.contactPerson || 'Unknown';
  };

  const filteredJobCards = useMemo(() => {
    return jobCards
      .filter(card => jobStatusFilter === 'All' || card.status === jobStatusFilter)
      .filter(card => 
        getTransporterName(card.transporterId).toLowerCase().includes(jobSearchTerm.toLowerCase())
      );
  }, [jobCards, jobStatusFilter, jobSearchTerm, transporters]);

  // Hide transporter job cards from team-role users (Civil/Electrical/Supervisor)
  const isTeamRole = currentUser ? ['Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'].includes(currentUser.role) : false;
  const jobCardsToDisplay = isTeamRole ? [] : filteredJobCards;

  // Team Dashboard View: Site selector and payment request button
  if (isTeamRole && currentUser) {
    const managedSites = sites.filter(s => s.siteManagerId === currentUser.id);
    const [selectedSiteId, setSelectedSiteId] = useState<string>(managedSites.length > 0 ? managedSites[0].id : '');
    
    const sitePaymentRequests = visibleRequests.filter(req => {
      const site = sites.find(s => s.siteName === req.siteName);
      return site?.id === selectedSiteId;
    });

    return (
      <div className="w-full animate-fade-in space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg">
            <p className="text-sm text-white/90 font-medium">Ongoing Projects</p>
            <p className="text-4xl font-bold text-white mt-2">{stats.ongoingProjects}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg">
            <p className="text-sm text-white/90 font-medium">Completed This Month</p>
            <p className="text-4xl font-bold text-white mt-2">{stats.completedThisMonth}</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-lg flex flex-col justify-center items-center">
              <div className="w-full flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={onDownloadMyInventoryReport}
                  className="flex-1 text-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download My Inventory Report
                </button>
                {/* Transactions report button - visible to roles except transporters and team roles */}
                {currentUser && !['Transporter','Civil','Electricals','Electrical + Civil','Supervisor'].includes(currentUser.role) && onOpenTransactionsReport && (
                  <button onClick={onOpenTransactionsReport} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:brightness-95">View Transactions</button>
                )}
              </div>
          </div>
        </div>

        {/* Site Selector and Payment Request Button */}
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 transition-all duration-500">
          <h2 className="text-2xl font-semibold mb-6 text-gray-900 border-b border-gray-300 pb-3">
            Payment Requests
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Site Selector */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Site</label>
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 px-4 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                {managedSites.length === 0 ? (
                  <option value="">No sites assigned</option>
                ) : (
                  managedSites.map(site => (
                    <option key={site.id} value={site.id}>{site.siteName}</option>
                  ))
                )}
              </select>
            </div>

            {/* Request Payment Button */}
            <div className="flex items-end">
              <button
                onClick={() => selectedSiteId && onCreateRequest(selectedSiteId)}
                disabled={!selectedSiteId}
                className="w-full sm:w-auto px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Request Payment
              </button>
            </div>
          </div>

          {/* Site Documents from Admin/Manager */}
          {selectedSiteId && (() => {
            const selectedSite = managedSites.find(s => s.id === selectedSiteId);
            const sitePhotos = selectedSite?.photos || [];
            const siteDocs = selectedSite?.documents || [];
            const hasDocuments = sitePhotos.length > 0 || siteDocs.length > 0;
            
            if (!hasDocuments) return null;
            
            return (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Site Documents
                </h3>
                <p className="text-sm text-blue-700 mb-4">Documents and photos shared by management for this site</p>
                <div className="flex flex-wrap gap-3">
                  {sitePhotos.map((photo, idx) => (
                    <a
                      key={`photo-${idx}`}
                      href={photo.dataUrl}
                      download={photo.name}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-blue-900">{photo.name}</span>
                    </a>
                  ))}
                  {siteDocs.map((doc, idx) => (
                    <a
                      key={`doc-${idx}`}
                      href={doc.dataUrl}
                      download={doc.name}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-100 transition-colors text-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-900">{doc.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Payment Requests List */}
          {sitePaymentRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No payment requests for the selected site.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sitePaymentRequests.map(req => {
                const photoCount = req.photos?.length || 0;
                const documentCount = req.documents?.length || 0;
                const hasAttachments = photoCount > 0 || documentCount > 0;
                
                return (
                <div 
                  key={req.id} 
                  className={`p-4 rounded-lg border ${cardStatusColors[req.status]} ${onViewRequestDetails ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                  onClick={() => onViewRequestDetails && onViewRequestDetails(req.id)}
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 mb-1">{req.siteName}</h3>
                      <p className="text-sm text-gray-700 font-semibold">{req.paymentFor}</p>
                      <p className="text-xs text-gray-500 mt-1">{req.timestamp}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-orange-600">₹{req.amount?.toLocaleString()}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        {req.reasons || 'No reasons provided'}
                      </p>
                      
                      {/* Document indicators */}
                      {hasAttachments && (
                        <div className="flex items-center gap-3 mt-3">
                          {photoCount > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                              </svg>
                              <span>{photoCount}</span>
                            </div>
                          )}
                          {documentCount > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                              </svg>
                              <span>{documentCount}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusColors[req.status].text} ${statusColors[req.status].bg}`}>
                        {req.status}
                      </span>
                      {onViewRequestDetails && (
                        <button 
                          className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewRequestDetails(req.id);
                          }}
                        >
                          View Details
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRequest(req);
                        }}
                        className="text-orange-600 hover:text-orange-700 text-xs font-semibold transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        <PaymentHistory requests={sitePaymentRequests} />
      </div>
    );
  }

  const FilterButton: React.FC<{ status: 'All' | 'Pending' | 'Approved' | 'Paid' }> = ({ status }) => {
    const isActive = statusFilter === status;
    return (
      <button
        onClick={() => setStatusFilter(status)}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
          isActive ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        }`}
      >
        {status}
      </button>
    );
  };
  
  const JobCardFilterButton: React.FC<{ status: 'All' | 'Assigned' | 'In Transit' | 'Completed' }> = ({ status }) => {
    const isActive = jobStatusFilter === status;
    return (
      <button
        onClick={() => setJobStatusFilter(status)}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors duration-200 ${
          isActive ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        }`}
      >
        {status}
      </button>
    );
  };
  
  return (
    <div className="w-full animate-fade-in space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-lg">
                <p className="text-sm text-gray-500">Ongoing Projects</p>
                <p className="text-3xl font-bold text-orange-400">{stats.ongoingProjects}</p>
            </div>
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-lg">
                <p className="text-sm text-gray-500">Completed Payments This Month</p>
                <p className="text-3xl font-bold text-orange-400">{stats.completedThisMonth}</p>
            </div>
             <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-lg flex flex-col justify-center items-center">
                <button 
                  onClick={onDownloadMyInventoryReport}
                  className="w-full text-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download My Inventory Report
                </button>
            </div>
        </div>

        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 transition-all duration-500">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b border-gray-300 pb-3">
              Payment Approval Queue
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
               <div className="relative w-full sm:max-w-xs">
                    <input
                        type="text"
                        placeholder="Search by Site Name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterButton status="All" />
                    <FilterButton status="Pending" />
                    <FilterButton status="Approved" />
                    <FilterButton status="Paid" />
                </div>
            </div>

      {visibleRequests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No payment requests found for the current filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
          {visibleRequests.map(req => {
            const photoCount = req.photos?.length || 0;
            const documentCount = req.documents?.length || 0;
            const hasAttachments = photoCount > 0 || documentCount > 0;
            
            return (
                        <div 
                          key={req.id} 
                          className={`p-4 rounded-lg border ${cardStatusColors[req.status]} ${onViewRequestDetails ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
                          onClick={() => onViewRequestDetails && onViewRequestDetails(req.id)}
                        >
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-1">{req.siteName}</h3>
                                    <p className="text-sm text-gray-600">{req.location}</p>
                                    <p className="text-xs text-gray-500 mt-1">{req.timestamp}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-700 font-semibold mb-1">{req.paymentFor}</p>
                                  <p className="text-2xl font-bold text-orange-600">₹{req.amount?.toLocaleString()}</p>
                                  {req.reasons && <p className="text-xs text-gray-600 italic mt-2">"{req.reasons}"</p>}
                                  
                                  {/* Document indicators */}
                                  {hasAttachments && (
                                    <div className="flex items-center gap-3 mt-3">
                                      {photoCount > 0 && (
                                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                          </svg>
                                          <span>{photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}</span>
                                        </div>
                                      )}
                                      {documentCount > 0 && (
                                        <div className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                          </svg>
                                          <span>{documentCount} {documentCount === 1 ? 'Doc' : 'Docs'}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-2">
                  <select
                                        value={req.status}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          onUpdateRequestStatus(req.id, e.target.value as any);
                                        }}
                                        disabled={!canApprove}
                                        className={`cursor-pointer text-xs font-medium rounded-full px-3 py-1 border focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${statusColors[req.status].text} ${statusColors[req.status].bg} ${statusColors[req.status].ring}`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                    {onViewRequestDetails && (
                                      <button 
                                        className="text-xs text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onViewRequestDetails(req.id);
                                        }}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        View Details
                                      </button>
                                    )}
                                </div>
                           </div>
                           <div className="mt-4 pt-3 border-t border-gray-200/50 flex items-center justify-end gap-4">
                                {canEdit && (
                                  <>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditRequest(req);
                                      }} 
                                      className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                                    >
                                      Edit
                                    </button>
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteRequest(req.id);
                                      }} 
                                      className="text-xs font-semibold text-red-500 hover:text-red-700"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                           </div>
                        </div>
            );
          })}
                </div>
            )}
        </div>
        
        <div className="bg-white backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 transition-all duration-500">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 border-b border-gray-300 pb-3">
              Transporter Job Cards
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="relative w-full sm:max-w-xs">
                    <input
                        type="text"
                        placeholder="Search by Transporter..."
                        value={jobSearchTerm}
                        onChange={(e) => setJobSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-10 pr-4 text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <JobCardFilterButton status="All" />
                    <JobCardFilterButton status="Assigned" />
                    <JobCardFilterButton status="In Transit" />
                    <JobCardFilterButton status="Completed" />
                </div>
            </div>
            
      {(!isTeamRole && jobCardsToDisplay.length === 0) ? (
                 <div className="text-center py-12 text-gray-500">
                    <p className="text-lg">No job cards found for the current filter.</p>
                </div>
      ) : (
        <div className="space-y-4">
          {jobCardsToDisplay.map(card => (
                        <div key={card.id} className={`p-4 rounded-lg border ${jobCardStatusColors[card.status]}`}>
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                <div className="flex-grow space-y-3">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-orange-400 text-lg">{getTransporterName(card.transporterId)}</span>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-gray-500">
                                            <span className="font-semibold">From:</span> {card.pickFrom}
                                        </p>
                                        <p className="text-gray-500">
                                            <span className="font-semibold">To:</span> {card.dropPoints.join(', ')}
                                        </p>
                                    </div>
                                    {card.description && <p className="text-xs text-gray-600 bg-white p-2 rounded-md">{card.description}</p>}
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
                                    <select
                                        value={card.status}
                                        onChange={(e) => onUpdateJobCardStatus(card.id, e.target.value as 'Assigned' | 'In Transit' | 'Completed')}
                                        disabled={!canManageTransporters}
                                        className={`cursor-pointer text-xs font-medium pl-3 pr-8 py-1 rounded-full border appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors duration-300`}
                                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${jobStatusArrowColors[card.status]}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.25rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                                        aria-label={`Update status for job ${card.id}`}
                                    >
                                        <option className="bg-white text-gray-900" value="Assigned">Assigned</option>
                                        <option className="bg-white text-gray-900" value="In Transit">In Transit</option>
                                        <option className="bg-white text-gray-900" value="Completed">Completed</option>
                                    </select>
                                    <p className="text-xs text-gray-600">{card.timestamp}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        <PaymentHistory requests={requests} />
    </div>
  );
};
