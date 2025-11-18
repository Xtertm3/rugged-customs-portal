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
  const [viewMode, setViewMode] = useState<'bySite' | 'byTeam' | 'all'>('bySite');
  const [textFilter, setTextFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All'|'Payments'|'Materials'>('All');

  // Utility for fuzzy site name matching
  const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/gi, '');

  const paymentEntries = useMemo(() => {
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
      return {
        id: `${req.id}-${h.timestamp}`,
        type: 'Payment' as const,
        siteName: req.siteName,
        siteId: req.siteId,
        teamMemberName,
        timestamp: h.timestamp,
        detail,
        status: h.status
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
    if (textFilter) {
      const f = textFilter.toLowerCase();
      arr = arr.filter(e => (e.siteName || '').toLowerCase().includes(f) || (e.teamMemberName || '').toLowerCase().includes(f) || (e.detail || '').toLowerCase().includes(f));
    }
    // sort by newest first
    return arr.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [paidPaymentEntries, materialEntries, typeFilter, textFilter]);

  const groupedBySite = useMemo(() => {
    const map: Record<string, typeof allEntries> = {};
    allEntries.forEach(e => {
      let siteKey = e.siteName || 'Unknown Site';
      if (e.type === 'Payment') {
        // Find the actual site object by fuzzy match or siteId
        let matchedSite = (sites || []).find(s => {
          // @ts-ignore
          if ((e as any).siteId && s.id === (e as any).siteId) return true;
          return normalize(s.siteName) === normalize(e.siteName);
        });
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

  const exportCSV = () => {
    // Site Wise Payment Report with exact columns as specified
    const headers = ['Site Name', 'Payment details / Reason for Payment', 'Amount', 'Paid On', 'Paid to / Team Name'];
    let paidPayments = paymentRequests.filter(req => req.status === 'Paid');
    if (viewMode === 'bySite' && groupedBySite.length === 1) {
      const selectedSiteName = groupedBySite[0].site;
      paidPayments = paidPayments.filter(req => {
        if (req.siteId) {
          const siteObj = (sites || []).find(s => s.id === req.siteId);
          return siteObj && siteObj.siteName === selectedSiteName;
        }
        return normalize(req.siteName) === normalize(selectedSiteName);
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
    doc.text('Site Wise Payment Report', 105, 32, { align: 'center' });

    // Get only PAID payment entries
    const paidPayments = paymentRequests
      .filter(req => req.status === 'Paid')
      .map(req => {
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
            <button onClick={exportPDF} className="px-3 py-1 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600">Export PDF</button>
            <button onClick={onClose} className="px-3 py-1 bg-gray-200 rounded-md text-sm text-text-secondary">Close</button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2">
            <input value={textFilter} onChange={e => setTextFilter(e.target.value)} placeholder="Search site, user or details..." className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" />
          </div>
          <div className="flex items-center gap-2">
            <select className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}>
              <option value="All">All</option>
              <option value="Payments">Payments</option>
              <option value="Materials">Materials</option>
            </select>
            <select className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800" value={viewMode} onChange={e => setViewMode(e.target.value as any)}>
              <option value="bySite">Group: Site</option>
              <option value="byTeam">Group: Team</option>
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
