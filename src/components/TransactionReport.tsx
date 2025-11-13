import React, { useMemo, useState } from 'react';
import { PaymentRequest, MaterialUsageLog, Site } from '../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionReportProps {
  isOpen: boolean;
  onClose: () => void;
  paymentRequests: PaymentRequest[];
  materialUsageLogs: MaterialUsageLog[];
  sites: Site[];
}

export const TransactionReport: React.FC<TransactionReportProps> = ({ isOpen, onClose, paymentRequests, materialUsageLogs, sites }) => {
  const [viewMode, setViewMode] = useState<'bySite' | 'byTeam' | 'all'>('bySite');
  const [textFilter, setTextFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All'|'Payments'|'Materials'>('All');

  const paymentEntries = useMemo(() => {
    return paymentRequests.flatMap(req => (req.statusHistory || []).map(h => ({
      id: `${req.id}-${h.timestamp}`,
      type: 'Payment' as const,
      siteName: req.siteName,
      teamMemberName: h.userName,
      timestamp: h.timestamp,
      detail: `${h.status} - ${req.paymentFor || ''} (${req.amount || ''})`,
      status: h.status
    })));
  }, [paymentRequests]);

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
    const map: Record<string, typeof allEntries> = {} as any;
    allEntries.forEach(e => {
      const site = e.siteName || 'Unknown Site';
      if (!map[site]) map[site] = [] as any;
      map[site].push(e);
    });
    return Object.keys(map).sort().map(site => ({ site, entries: map[site] }));
  }, [allEntries]);

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
    if (viewMode === 'bySite') {
      const headers = ['Site','Initial Materials','Material Used (agg)','Payment Requests Count (Paid Only)','Total Paid'];
      const rows = groupedBySite.map(g => {
        const siteObj = sites.find(s => s.siteName === g.site);
        const initial = siteObj && siteObj.initialMaterials ? siteObj.initialMaterials.map((m: any) => `${m.name}:${m.units}`).join('; ') : '';
        // aggregate material used for this site
        const usedForSite = materialUsageLogs.filter(m => (m.siteName || 'Unknown Site') === g.site);
        const usedAggMap: Record<string, number> = {};
        usedForSite.forEach(u => { usedAggMap[u.materialName] = (usedAggMap[u.materialName] || 0) + Number(u.quantityUsed || 0); });
        const usedAgg = Object.keys(usedAggMap).map(k => `${k}:${usedAggMap[k]}m`).join('; ');
        // Only count PAID requests for this site
        const reqs = paymentRequests.filter(r => r.siteName === g.site && r.status === 'Paid');
        const totalPaid = reqs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        return [g.site, initial, usedAgg, String(reqs.length), String(totalPaid)];
      });
      const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions_by_site_report.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const headers = ['Type','Site','Team/Updated By','Timestamp','Detail'];
    const rows = allEntries.map(e => ([e.type, e.siteName, e.teamMemberName, e.timestamp, e.detail]));
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Transactions Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    if (viewMode === 'bySite') {
      const headers = [['Site', 'Initial Materials', 'Material Used', 'Paid Requests', 'Total Paid']];
      const rows = groupedBySite.map(g => {
        const siteObj = sites.find(s => s.siteName === g.site);
        const initial = siteObj && siteObj.initialMaterials ? siteObj.initialMaterials.map((m: any) => `${m.name}:${m.units}`).join('; ') : '';
        const usedForSite = materialUsageLogs.filter(m => (m.siteName || 'Unknown Site') === g.site);
        const usedAggMap: Record<string, number> = {};
        usedForSite.forEach(u => { usedAggMap[u.materialName] = (usedAggMap[u.materialName] || 0) + Number(u.quantityUsed || 0); });
        const usedAgg = Object.keys(usedAggMap).map(k => `${k}:${usedAggMap[k]}m`).join('; ');
        const reqs = paymentRequests.filter(r => r.siteName === g.site && r.status === 'Paid');
        const totalPaid = reqs.reduce((s, r) => s + (Number(r.amount) || 0), 0);
        return [g.site, initial, usedAgg, String(reqs.length), String(totalPaid)];
      });
      autoTable(doc, { head: headers, body: rows, startY: 28, styles: { fontSize: 8 } });
    } else {
      const headers = [['Type', 'Site', 'Team/User', 'Timestamp', 'Detail']];
      const rows = allEntries.map(e => ([e.type, e.siteName, e.teamMemberName, e.timestamp, e.detail]));
      autoTable(doc, { head: headers, body: rows, startY: 28, styles: { fontSize: 8 } });
    }

    doc.save('transactions_report.pdf');
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
