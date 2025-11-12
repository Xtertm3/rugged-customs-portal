import React, { useMemo, useState } from 'react';
import { TeamMember, PaymentRequest, RequestAttachment } from '../App';

const cardStatusColors = {
  Pending: 'bg-amber-500/10 border-amber-500/20',
  Approved: 'bg-green-500/10 border-green-500/20',
  Paid: 'bg-blue-500/10 border-blue-500/20',
};

interface TeamMemberDetailProps {
  member: TeamMember;
  requests: PaymentRequest[];
  teamMembers: TeamMember[];
  onBack: () => void;
  onUpdateRequestStatus: (requestId: string, newStatus: 'Pending' | 'Approved' | 'Paid') => void;
  onEditRequest: (request: PaymentRequest) => void;
  onDeleteRequest: (requestId: string) => void;
  canApprove: boolean;
  canEdit: boolean;
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export const TeamMemberDetail: React.FC<TeamMemberDetailProps> = ({ 
  member, 
  requests, 
  onBack, 
  onUpdateRequestStatus,
  onEditRequest,
  onDeleteRequest,
  canApprove,
  canEdit
}) => {
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

  const assignedRequests = useMemo(() => {
    return requests.filter(r => r.assignTo === member.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [requests, member.id]);

  const toggleDetails = (id: string) => {
    setExpandedDetails(prev => ({...prev, [id]: !prev[id]}));
  };
  
  const RequestAttachmentList: React.FC<{ attachments: RequestAttachment[] }> = ({ attachments }) => (
    <ul className="list-disc list-inside text-text-secondary space-y-1">
        {attachments.map((file, i) => (
            <li key={i}>
                <a href={file.dataUrl} download={file.name} className="hover:text-primary underline">
                    {file.name}
                </a>
            </li>
        ))}
    </ul>
  );


  return (
    <div className="space-y-6 animate-fade-in">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-primary hover:text-primary-hover font-semibold">
            &larr; Back to Team List
        </button>
        <div className="bg-surface border border-border rounded-2xl shadow-sm">
            <div className="p-6 border-b border-border flex items-center gap-6">
                {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl flex-shrink-0">
                        {getInitials(member.name)}
                    </div>
                )}
                <div>
                    <h2 className="text-3xl font-bold text-text-primary">{member.name}</h2>
                    <p className="text-lg text-text-secondary">{member.role} &bull; {member.mobile}</p>
                </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-text-primary">Assigned Site Activities ({assignedRequests.length})</h3>
              <div className="space-y-4">
                {assignedRequests.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">No activities assigned to this team member.</p>
                ) : (
                  assignedRequests.map((req) => (
                    <div key={req.id} className={`p-4 rounded-xl border ${cardStatusColors[req.status]} bg-white`}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                          <div>
                              <p className="font-bold text-lg text-text-primary">{req.siteName}</p>
                              <p className="text-sm text-text-secondary">{req.location}</p>
                          </div>
                          <div>
                              <p className="text-sm text-text-secondary">Stage</p>
                              <p className="font-semibold text-text-primary">{req.stage}</p>
                          </div>
                          <div className="flex flex-col items-start md:items-end">
                              <select
                                  value={req.status}
                                  onChange={(e) => onUpdateRequestStatus(req.id, e.target.value as any)}
                                  disabled={!canApprove || !req.amount}
                                  className="cursor-pointer text-xs font-medium rounded-full px-3 py-1 border bg-surface border-border text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Paid">Paid</option>
                              </select>
                              <p className="text-xs text-text-secondary/70 mt-2">{req.timestamp}</p>
                          </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                          <div>
                            {((req.materials?.length || 0) > 0 || (req.photos?.length || 0) > 0 || (req.documents?.length || 0) > 0) && (
                                <button onClick={() => toggleDetails(req.id)} className="text-xs font-semibold text-primary hover:text-primary-hover">
                                    {expandedDetails[req.id] ? 'Hide Details' : 'Show Details'}
                                </button>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {canEdit && (
                              <>
                                <button onClick={() => onEditRequest(req)} className="text-xs font-semibold text-text-secondary hover:text-text-primary">
                                  Edit
                                </button>
                                <button onClick={() => onDeleteRequest(req.id)} className="text-xs font-semibold text-red-600 hover:text-red-500">
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                      </div>
                      {expandedDetails[req.id] && (
                          <div className="mt-4 p-4 rounded-lg bg-background space-y-4 text-sm">
                              {req.materials && req.materials.length > 0 && (
                              <div>
                                  <h4 className="font-semibold text-text-secondary mb-1">Materials Used:</h4>
                                  <ul className="list-disc list-inside text-text-secondary space-y-1">
                                      {req.materials.map(m => <li key={m.id}>{m.name}: {m.used}m</li>)}
                                  </ul>
                              </div>
                              )}
                              {req.photos && req.photos.length > 0 && (
                              <div>
                                  <h4 className="font-semibold text-text-secondary mb-1">Photos:</h4>
                                  <RequestAttachmentList attachments={req.photos} />
                              </div>
                              )}
                              {req.documents && req.documents.length > 0 && (
                              <div>
                                  <h4 className="font-semibold text-text-secondary mb-1">Documents:</h4>
                                  <RequestAttachmentList attachments={req.documents} />
                              </div>
                              )}
                          </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
        </div>
    </div>
  );
};
