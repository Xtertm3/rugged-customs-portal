import React, { useMemo, useState } from 'react';
import { PaymentRequest, MaterialUsageLog, Site, TeamMember } from '../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionReportProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRequests: PaymentRequest[];
  materialUsageLogs: MaterialUsageLog[];
  sites: Site[];
  teamMembers: TeamMember[];
}

export const TransactionReport: React.FC<TransactionReportProps> = ({ isOpen, onClose, paymentRequests, materialUsageLogs, sites, teamMembers }) => {
  const [viewMode, setViewMode] = useState<'bySite' | 'byTeam' | 'byStage' | 'all'>('bySite');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<'all' | 'civil' | 'electrical'>('all');
  const [typeFilter, setTypeFilter] = useState<'All'|'Payments'|'Materials'>('All');

  // Extract key identifiers from site names for matching - more precise
  const extractIdentifiers = (name: string) => {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    
    // Extract specific patterns
    const locationMatch = normalized.match(/[a-z]{4,}/g) || []; // Location names (4+ letters)
    const refNumbers = normalized.match(/(?:rrl|rl)-?\d+/gi) || []; // Reference numbers
    const inNumbers = normalized.match(/in-?\d+/gi) || []; // IN numbers
    
    return {
      location: locationMatch.map(l => l.toLowerCase()),
      refNumbers: refNumbers.map(r => r.toLowerCase().replace(/[^a-z0-9]/g, '')),
      inNumbers: inNumbers.map(i => i.toLowerCase().replace(/[^a-z0-9]/g, ''))
    };
  };
  
  // Check if two site names match - must have matching location AND at least one matching number
  const sitesMatch = (siteName1: string, siteName2: string) => {
    if (!siteName1 || !siteName2) return false;
    
    const ids1 = extractIdentifiers(siteName1);
    const ids2 = extractIdentifiers(siteName2);
    
    // Check if location matches (at least one common location name)
    const locationMatch = ids1.location.some(l1 => ids2.location.some(l2 => l1 === l2));
    
    // Check if reference numbers match
    const refMatch = ids1.refNumbers.some(r1 => ids2.refNumbers.some(r2 => r1 === r2));
    
    // Check if IN numbers match
    const inMatch = ids1.inNumbers.some(i1 => ids2.inNumbers.some(i2 => i1 === i2));
    
    // Must have location match AND at least one number match for a valid match
    return locationMatch && (refMatch || inMatch);
  };

  const paymentEntries = useMemo(() => {
    const parseDateSafe = (value?: string): Date | null => {
      if (!value) return null;
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    };

    const inferWorkStage = (req: PaymentRequest, eventTimestamp?: string): 'civil' | 'electrical' | 'unknown' => {
      // 1) Prefer explicit new field (4-stage system)
      if (req.workStage === 'c1' || req.workStage === 'c2' || req.workStage === 'c1_c2_combined') return 'civil';
      if (req.workStage === 'electrical') return 'electrical';
      // 2) Fallback to legacy field
      if (req.stage === 'Electricals') return 'electrical';
      if (req.stage === 'Civil') return 'civil';
      // 3) Use site stage transition dates if we can resolve the site
      const site = (req.siteId ? sites.find(s => s.id === req.siteId) : sites.find(s => s.siteName && req.siteName && s.siteName.toLowerCase() === req.siteName.toLowerCase())) || undefined;
      if (site) {
        const ts = parseDateSafe(eventTimestamp || req.timestamp);
        const electricalStart = parseDateSafe(site.stages?.electrical?.startDate || undefined);
        const c1C2CompletedAt = parseDateSafe(site.stages?.c1_c2_combined?.completionDate || undefined);
        if (ts) {
          if (electricalStart && ts < electricalStart) return 'civil';
          if (c1C2CompletedAt && ts <= c1C2CompletedAt) return 'civil';
          if (electricalStart && ts >= electricalStart) return 'electrical';
        }
      }
      // 4) Conservative default is civil (to avoid over-counting electrical)
      return 'civil';
    };

    return paymentRequests.flatMap(req => (req.statusHistory || []).map(h => {
      // Find the team member who the payment is for (not who approved it)
      let teamMemberName = 'Unknown';
      if (req.assignTo) {
        const member = teamMembers.find(m => m.id === req.assignTo);
        teamMemberName = member?.name || 'Unknown Team Member';
      } else if (req.transporterId) {
        const member = teamMembers.find(m => m.id === req.transporterId);
        teamMemberName = member?.name || 'Unknown Transporter';
      } else if (req.statusHistory && req.statusHistory.length > 0) {
        const creator = req.statusHistory[0];
        if (creator && creator.userId) {
          const member = teamMembers.find(m => m.id === creator.userId);
          teamMemberName = member?.name || creator.userName || 'Unknown';
        }
      }
      // Build detail with payment info and reason/description
      const paymentInfo = req.paymentFor || 'Payment';
      const reason = req.reasons ? ` - ${req.reasons}` : '';
      const detail = `${h.status} - ${paymentInfo}${req.amount ? ` (Rs ${req.amount})` : ''}${reason}`;
      const workStage = inferWorkStage(req, h.timestamp);
      return {
        id: `${req.id}-${h.timestamp}`,
        type: 'Payment' as const,
        siteName: req.siteName,
        siteId: req.siteId,
        teamMemberName,
        timestamp: h.timestamp,
        detail,
        status: h.status,
        workStage
      };
    }));
  }, [paymentRequests, teamMembers]);

  // Only show PAID payment records (filter out Pending and Approved)
  const paidPaymentEntries = useMemo(() => {
    return paymentEntries.filter(e => e.status === 'Paid');
  }, [paymentEntries]);

  const materialEntries = useMemo(() => {
    return materialUsageLogs.map(m => ({
      id: m.id,
      type: 'Material' as const,
      siteName: m.siteName || 'Unknown Site',
      teamMemberName: m.teamMemberName,
      timestamp: m.timestamp,
      detail: `${m.materialName} • ${m.quantityUsed}m ${m.notes ? `(${m.notes})` : ''}`
    }));
  }, [materialUsageLogs]);

  const allEntries = useMemo(() => {
    let arr = [...paidPaymentEntries, ...materialEntries];
    if (typeFilter === 'Payments') arr = paidPaymentEntries;
    if (typeFilter === 'Materials') arr = materialEntries;
    
    // Filter by selected site (when viewMode is bySite and a specific site is selected)
    if (viewMode === 'bySite' && selectedSite !== 'all') {
      arr = arr.filter(e => {
        if (e.type === 'Payment') {
          // @ts-ignore - Try siteId match first, then intelligent name matching
          if ((e as any).siteId) {
            const siteObj = (sites || []).find(s => s.id === (e as any).siteId);
            if (siteObj && siteObj.siteName === selectedSite) return true;
          }
          // Use intelligent matching for site names
          return sitesMatch(e.siteName || '', selectedSite);
        }
        // For materials, use intelligent matching
        return sitesMatch(e.siteName || '', selectedSite);
      });
    }
    
    // Filter by selected team (when viewMode is byTeam and a specific team is selected)
    if (viewMode === 'byTeam' && selectedTeam !== 'all') {
      arr = arr.filter(e => e.teamMemberName === selectedTeam);
    }
    
    // Filter by work stage (when a specific stage is selected)
    if (selectedStage !== 'all') {
      arr = arr.filter(e => {
        if (e.type === 'Payment') {
          // @ts-ignore - Check workStage field
          return (e as any).workStage === selectedStage;
        }
        // Materials don't have stage tracking yet, so include all if filtering by stage
        return e.type === 'Material';
      });
    }
    
    // sort by newest first
    return arr.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [paidPaymentEntries, materialEntries, typeFilter, selectedSite, selectedTeam, selectedStage, viewMode, sites]);

  const groupedBySite = useMemo(() => {
    const map: Record<string, typeof allEntries> = {};
    allEntries.forEach(e => {
      let siteKey = e.siteName || 'Unknown Site';
      if (e.type === 'Payment') {
        // Find the actual site object by intelligent match or siteId
        let matchedSite = (sites || []).find(s => {
          // @ts-ignore
          if ((e as any).siteId && s.id === (e as any).siteId) return true;
          return sitesMatch(s.siteName, e.siteName || '');
        });
        siteKey = matchedSite ? matchedSite.siteName : siteKey;
      } else {
        // For materials, also try to match with actual sites
        let matchedSite = (sites || []).find(s => sitesMatch(s.siteName, e.siteName || ''));
        siteKey = matchedSite ? matchedSite.siteName : siteKey;
      }
      if (!map[siteKey]) map[siteKey] = [];
      map[siteKey].push(e);
    });
    return Object.keys(map).sort().map(site => ({ site, entries: map[site] }));
  }, [allEntries, sites]);

  const groupedByTeam = useMemo(() => {
    const map: Record<string, typeof allEntries> = {} as any;
    allEntries.forEach(e => {
      const team = e.teamMemberName || 'Unknown';
      if (!map[team]) map[team] = [] as any;
      map[team].push(e);
    });
    return Object.keys(map).sort().map(team => ({ team, entries: map[team] }));
  }, [allEntries]);

  const groupedByStage = useMemo(() => {
    const map: Record<string, typeof allEntries> = {
      'civil': [],
      'electrical': [],
      'unknown': []
    };
    allEntries.forEach(e => {
      if (e.type === 'Payment') {
        // @ts-ignore - Get workStage from payment
        const stage = (e as any).workStage || 'unknown';
        if (stage === 'civil' || stage === 'electrical') {
          map[stage].push(e);
        } else {
          map['unknown'].push(e);
        }
      } else {
        // Materials don't have stage info yet
        map['unknown'].push(e);
      }
    });
    
    // Return only stages that have entries
    return Object.keys(map)
      .filter(stage => map[stage].length > 0)
      .sort()
      .map(stage => ({ 
        stage: stage === 'civil' ? 'Civil Work' : stage === 'electrical' ? 'Electrical Work' : 'Unassigned Stage', 
        entries: map[stage] 
      }));
  }, [allEntries]);

  const exportCSV = () => {
    // Site Wise Payment Report with exact columns as specified
    const headers = ['Site Name', 'Payment details / Reason for Payment', 'Amount', 'Paid On', 'Paid to / Team Name'];
    let paidPayments = paymentRequests.filter(req => req.status === 'Paid');
    
    // Apply site filter if a specific site is selected
    if (viewMode === 'bySite' && selectedSite !== 'all') {
      paidPayments = paidPayments.filter(req => {
        if (req.siteId) {
          const siteObj = (sites || []).find(s => s.id === req.siteId);
          if (siteObj && siteObj.siteName === selectedSite) return true;
        }
        // Use intelligent matching
        return sitesMatch(req.siteName || '', selectedSite);
      });
    }
    
    // Apply team filter if a specific team is selected
    if (viewMode === 'byTeam' && selectedTeam !== 'all') {
      paidPayments = paidPayments.filter(req => {
        let teamMemberName = 'Unknown';
        if (req.assignTo) {
          const member = teamMembers.find(m => m.id === req.assignTo);
          teamMemberName = member?.name || 'Unknown Team Member';
        } else if (req.transporterId) {
          const member = teamMembers.find(m => m.id === req.transporterId);
          teamMemberName = member?.name || 'Unknown Transporter';
        } else if (req.statusHistory && req.statusHistory.length > 0) {
          const creator = req.statusHistory[0];
          if (creator && creator.userId) {
            const member = teamMembers.find(m => m.id === creator.userId);
            teamMemberName = member?.name || creator.userName || 'Unknown';
          }
        }
        return teamMemberName === selectedTeam;
      });
    }
    const rows = paidPayments.map(req => {
      // Find the team member who the payment is for
      let teamMemberName = 'Unknown';
      if (req.assignTo) {
        const member = teamMembers.find(m => m.id === req.assignTo);
        teamMemberName = member?.name || 'Unknown Team Member';
      } else if (req.transporterId) {
        const member = teamMembers.find(m => m.id === req.transporterId);
        teamMemberName = member?.name || 'Unknown Transporter';
      } else if (req.statusHistory && req.statusHistory.length > 0) {
        const creator = req.statusHistory[0];
        if (creator && creator.userId) {
          const member = teamMembers.find(m => m.id === creator.userId);
          teamMemberName = member?.name || creator.userName || 'Unknown';
        }
      }
      // Find when it was paid (last status change to Paid)
      const paidEntry = req.statusHistory.find(h => h.status === 'Paid');
      const paidOn = paidEntry?.timestamp || req.timestamp;
      // Payment details/reason - combine paymentFor and reasons if both exist
      const paymentFor = req.paymentFor || 'Payment';
      const reason = req.reasons ? ` - ${req.reasons}` : '';
      const paymentDetails = `${paymentFor}${reason}`;
      return [
        req.siteName || 'Unknown Site',
        paymentDetails,
        `Rs ${(Number(req.amount) || 0).toLocaleString()}`,
        paidOn,
        teamMemberName
      ];
    });
    // Create CSV with header and company info
    const companyHeader = [
      ['Rugged Customs'],
      ['#11, Ground Floor, 26th Cross Cubbonpet, Bangalore- 560002'],
      ['Site Wise Payment Report'],
      ['']
    ];
    const BOM = '\uFEFF';
    const csvRows = [
      ...companyHeader,
      headers,
      ...rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ];
    const csvContent = BOM + csvRows.map(r => Array.isArray(r) ? r.join(',') : r).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'site_wise_payment_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Rugged Customs', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('#11, Ground Floor, 26th Cross Cubbonpet, Bangalore- 560002', 105, 22, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Report title based on view mode
    let reportTitle = 'Transaction Report';
    if (viewMode === 'bySite') reportTitle = 'Site Wise Payment Report';
    else if (viewMode === 'byTeam') reportTitle = 'Team Wise Payment Report';
    doc.text(reportTitle, 105, 32, { align: 'center' });

    // Get only PAID payment entries and apply filters
    let filteredPayments = paymentRequests.filter(req => req.status === 'Paid');
    
    // Apply site filter if a specific site is selected
    if (viewMode === 'bySite' && selectedSite !== 'all') {
      filteredPayments = filteredPayments.filter(req => {
        if (req.siteId) {
          const siteObj = (sites || []).find(s => s.id === req.siteId);
          if (siteObj && siteObj.siteName === selectedSite) return true;
        }
        // Use intelligent matching
        return sitesMatch(req.siteName || '', selectedSite);
      });
    }
    
    // Apply team filter if a specific team is selected
    if (viewMode === 'byTeam' && selectedTeam !== 'all') {
      filteredPayments = filteredPayments.filter(req => {
        let teamMemberName = 'Unknown';
        if (req.assignTo) {
          const member = teamMembers.find(m => m.id === req.assignTo);
          teamMemberName = member?.name || 'Unknown Team Member';
        } else if (req.transporterId) {
          const member = teamMembers.find(m => m.id === req.transporterId);
          teamMemberName = member?.name || 'Unknown Transporter';
        } else if (req.statusHistory && req.statusHistory.length > 0) {
          const creator = req.statusHistory[0];
          if (creator && creator.userId) {
            const member = teamMembers.find(m => m.id === creator.userId);
            teamMemberName = member?.name || creator.userName || 'Unknown';
          }
        }
        return teamMemberName === selectedTeam;
      });
    }
    
    const paidPayments = filteredPayments.map(req => {
        // Find the team member who the payment is for
        let teamMemberName = 'Unknown';
        if (req.assignTo) {
          const member = teamMembers.find(m => m.id === req.assignTo);
          teamMemberName = member?.name || 'Unknown Team Member';
        } else if (req.transporterId) {
          const member = teamMembers.find(m => m.id === req.transporterId);
          teamMemberName = member?.name || 'Unknown Transporter';
        } else if (req.statusHistory && req.statusHistory.length > 0) {
          const creator = req.statusHistory[0];
          if (creator && creator.userId) {
            const member = teamMembers.find(m => m.id === creator.userId);
            teamMemberName = member?.name || creator.userName || 'Unknown';
          }
        }

        // Find when it was paid
        const paidEntry = req.statusHistory.find(h => h.status === 'Paid');
        const paidOn = paidEntry?.timestamp || req.timestamp;

        // Payment details/reason - combine paymentFor and reasons if both exist
        const paymentFor = req.paymentFor || 'Payment';
        const reason = req.reasons ? ` - ${req.reasons}` : '';
        const paymentDetails = `${paymentFor}${reason}`;

        return [
          req.siteName || 'Unknown Site',
          paymentDetails,
          `Rs ${(Number(req.amount) || 0).toLocaleString()}`,
          paidOn,
          teamMemberName
        ];
      });

    const headers = [['Site Name', 'Payment details / Reason for Payment', 'Amount', 'Paid On', 'Paid to / Team Name']];

    autoTable(doc, {
      head: headers,
      body: paidPayments,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [255, 140, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Site Name
        1: { cellWidth: 60 }, // Payment details
        2: { cellWidth: 25 }, // Amount
        3: { cellWidth: 35 }, // Paid On
        4: { cellWidth: 30 }, // Team Name
      },
    });

    doc.save(`Site_Wise_Payment_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-5xl w-full p-6 mt-12">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-text-primary">Transactions Report</h2>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="px-3 py-1 bg-primary text-white rounded-md text-sm">Export CSV</button>
            <button onClick={exportPDF} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Export PDF</button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded-md text-sm text-text-secondary">Close</button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter dropdown based on view mode */}
            {viewMode === 'bySite' && (
              <select 
                className="flex-1 min-w-[200px] bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" 
                value={selectedSite} 
                onChange={e => setSelectedSite(e.target.value)}
              >
                <option value="all">All Sites</option>
                {sites.map(site => (
                  <option key={site.id} value={site.siteName}>{site.siteName}</option>
                ))}
              </select>
            )}
            
            {viewMode === 'byTeam' && (
              <select 
                className="flex-1 min-w-[200px] bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" 
                value={selectedTeam} 
                onChange={e => setSelectedTeam(e.target.value)}
              >
                <option value="all">All Team Members</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.name}>{member.name}</option>
                ))}
              </select>
            )}
            
            {(viewMode === 'byStage' || viewMode === 'all') && (
              <div className="flex-1 min-w-[200px] text-gray-600 py-2 px-3">
                {viewMode === 'byStage' ? 'Grouped by work stage' : 'Showing all transactions'}
              </div>
            )}
            
            {/* Global stage filter - works across all view modes */}
            <select 
              className="flex-1 min-w-[150px] bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" 
              value={selectedStage} 
              onChange={e => setSelectedStage(e.target.value as any)}
              title="Filter by work stage (applies to all views)"
            >
              <option value="all">All Stages</option>
              <option value="civil">🔨 Civil Only</option>
              <option value="electrical">⚡ Electrical Only</option>
            </select>
            
            <select className="flex-1 min-w-[130px] bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="All">All</option>
              <option value="Payments">Payments</option>
              <option value="Materials">Materials</option>
            </select>
            
            <select className="flex-1 min-w-[150px] bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" value={viewMode} onChange={e => {
              setViewMode(e.target.value as any);
              setSelectedSite('all');
              setSelectedTeam('all');
              setSelectedStage('all');
            }}>
              <option value="bySite">Group: Site</option>
              <option value="byTeam">Group: Team</option>
              <option value="byStage">Group: Stage</option>
              <option value="all">Flat List</option>
            </select>
          </div>
        </div>

        <div className="mt-5">
          {viewMode === 'bySite' && groupedBySite.map(g => (
            <div key={g.site} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
              <div className="px-4 py-3 bg-white/60 font-semibold text-gray-900">{g.site} • {g.entries.length} item{g.entries.length !== 1 ? 's' : ''}</div>
              <div className="p-3">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Team</th>
                      <th className="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map((e: any) => (
                      <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2">{e.type}</td>
                        <td className="px-3 py-2">{e.timestamp}</td>
                        <td className="px-3 py-2">{e.teamMemberName}</td>
                        <td className="px-3 py-2">{e.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {viewMode === 'byTeam' && groupedByTeam.map(g => (
            <div key={g.team} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
              <div className="px-4 py-3 bg-white/60 font-semibold text-gray-900">{g.team} • {g.entries.length} item{g.entries.length !== 1 ? 's' : ''}</div>
              <div className="p-3">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Site</th>
                      <th className="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map((e: any) => (
                      <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2">{e.type}</td>
                        <td className="px-3 py-2">{e.timestamp}</td>
                        <td className="px-3 py-2">{e.siteName}</td>
                        <td className="px-3 py-2">{e.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {viewMode === 'byStage' && groupedByStage.map(g => (
            <div key={g.stage} className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
              <div className={`px-4 py-3 font-semibold text-gray-900 ${
                g.stage === 'Civil Work' ? 'bg-blue-100' : 
                g.stage === 'Electrical Work' ? 'bg-amber-100' : 
                'bg-gray-100'
              }`}>
                {g.stage === 'Civil Work' && '🔨 '}
                {g.stage === 'Electrical Work' && '⚡ '}
                {g.stage} • {g.entries.length} item{g.entries.length !== 1 ? 's' : ''}
              </div>
              <div className="p-3">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                    <tr>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Site</th>
                      <th className="px-3 py-2">Team</th>
                      <th className="px-3 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.entries.map((e: any) => (
                      <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-3 py-2">{e.type}</td>
                        <td className="px-3 py-2">{e.timestamp}</td>
                        <td className="px-3 py-2">{e.siteName}</td>
                        <td className="px-3 py-2">{e.teamMemberName}</td>
                        <td className="px-3 py-2">{e.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {viewMode === 'all' && (
            <div className="border border-gray-200 rounded-lg p-3">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Site</th>
                    <th className="px-3 py-2">Team</th>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {allEntries.map(e => (
                    <tr key={e.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2">{e.type}</td>
                      <td className="px-3 py-2">{e.siteName}</td>
                      <td className="px-3 py-2">{e.teamMemberName}</td>
                      <td className="px-3 py-2">{e.timestamp}</td>
                      <td className="px-3 py-2">{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
