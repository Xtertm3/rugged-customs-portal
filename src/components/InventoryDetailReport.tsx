import React, { useMemo, useState } from 'react';
import { TeamMember, MaterialUsageLog, Site } from '../App';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InventoryDetailReportProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  materialUsageLogs: MaterialUsageLog[];
  sites: Site[];
}

export const InventoryDetailReport: React.FC<InventoryDetailReportProps> = ({
  isOpen,
  onClose,
  teamMembers,
  materialUsageLogs,
  sites,
}) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [textFilter, setTextFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');

  // Reset filters when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTeamFilter('All');
      setSiteFilter('All');
      setTextFilter('');
    }
  }, [isOpen]);

  // Get all unique teams and sites
  const allTeams = useMemo(() => {
    const teams = new Set(teamMembers.map(m => m.name));
    return Array.from(teams).sort();
  }, [teamMembers]);

  // Sites dropdown: if a specific team is selected, only show sites allocated to that team
  // Allocation = sites they manage (siteManagerId) OR sites where they have usage logs
  const sitesForDropdown = useMemo(() => {
    const allSiteNames = Array.from(new Set(sites.map(s => s.siteName))).sort();
    if (teamFilter === 'All') return allSiteNames;
    const member = teamMembers.find(m => m.name === teamFilter);
    if (!member) return allSiteNames;
    const managed = sites.filter(s => s.siteManagerId === member.id).map(s => s.siteName);
    const usedAt = materialUsageLogs
      .filter(log => log.teamMemberName === member.name)
      .map(log => log.siteName)
      .filter(Boolean);
    return Array.from(new Set([...managed, ...usedAt])).sort();
  }, [teamFilter, teamMembers, materialUsageLogs, sites]);

  // When team changes, reset site filter
  React.useEffect(() => {
    setSiteFilter('All');
  }, [teamFilter]);

  // Build comprehensive inventory data for ALL teams AND sites
  const inventoryDetails = useMemo(() => {
    const details: {
      teamMemberName: string;
      teamMemberRole: string;
      materialName: string;
      openingBalance: number;
      totalUsed: number;
      remaining: number;
      siteName: string;
      usageRecords: { date: string; quantity: number; notes: string }[];
    }[] = [];

    // 1. Add materials from team members (assignedMaterials)
    teamMembers.forEach(member => {
      if (!member.assignedMaterials || member.assignedMaterials.length === 0) return;

      member.assignedMaterials.forEach(mat => {
        const openingBalance = Number(mat.units || 0);
        const totalUsed = Number(mat.used || 0);
        const remaining = openingBalance - totalUsed;

        // Get all usage records for this team member & material
        const usageRecords = materialUsageLogs
          .filter(
            (log) =>
              log.teamMemberName === member.name &&
              log.materialName === mat.name
          )
          .map((log) => ({
            date: log.timestamp,
            quantity: log.quantityUsed,
            notes: log.notes || '',
          }));

        // Get associated site(s) from usage records, or mark as N/A
        const associatedSites = new Set(
          materialUsageLogs
            .filter(
              (log) =>
                log.teamMemberName === member.name &&
                log.materialName === mat.name
            )
            .map(log => log.siteName)
            .filter(Boolean)
        );
        const siteName = associatedSites.size > 0 
          ? Array.from(associatedSites)[0]
          : 'N/A';

        details.push({
          teamMemberName: member.name,
          teamMemberRole: member.role,
          materialName: mat.name,
          openingBalance,
          totalUsed,
          remaining,
          siteName,
          usageRecords,
        });
      });
    });

    // 2. Add materials from sites (site.initialMaterials)
    sites.forEach(site => {
      if (!site.initialMaterials || site.initialMaterials.length === 0) return;

      // Get site manager info (if exists)
      const manager = teamMembers.find(m => m.id === site.siteManagerId);
      const managerName = manager ? manager.name : 'Site Materials';
      const managerRole = manager ? manager.role : 'Site';

      site.initialMaterials.forEach(mat => {
        const openingBalance = Number(mat.units || 0);
        const totalUsed = Number(mat.used || 0);
        const remaining = openingBalance - totalUsed;

        // Get usage records for this material at this site
        const usageRecords = materialUsageLogs
          .filter(
            (log) =>
              log.siteName === site.siteName &&
              log.materialName === mat.name
          )
          .map((log) => ({
            date: log.timestamp,
            quantity: log.quantityUsed,
            notes: log.notes || '',
          }));

        details.push({
          teamMemberName: managerName,
          teamMemberRole: managerRole,
          materialName: mat.name,
          openingBalance,
          totalUsed,
          remaining,
          siteName: site.siteName,
          usageRecords,
        });
      });
    });

    // Apply filters
    let filtered = details;

    // Team filter
    if (teamFilter !== 'All') {
      filtered = filtered.filter(d => d.teamMemberName === teamFilter);
    }

    // Site filter
    if (siteFilter !== 'All') {
      filtered = filtered.filter(d => d.siteName === siteFilter);
    }

    // Text filter
    if (textFilter) {
      const f = textFilter.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.teamMemberName.toLowerCase().includes(f) ||
          d.teamMemberRole.toLowerCase().includes(f) ||
          d.materialName.toLowerCase().includes(f)
      );
    }

    return filtered;
  }, [teamMembers, materialUsageLogs, sites, textFilter, teamFilter, siteFilter]);

  // Summary: group by team & material, show opening, used, remaining
  const summaryData = useMemo(() => {
    const grouped: Record<
      string,
      {
        team: string;
        role: string;
        materials: {
          name: string;
          opening: number;
          used: number;
          remaining: number;
        }[];
      }
    > = {};

    // First, add all team members to the grouped object
    teamMembers.forEach(member => {
      const key = member.name;
      if (!grouped[key]) {
        grouped[key] = {
          team: member.name,
          role: member.role,
          materials: [],
        };
      }
    });

    // Then add their materials from inventoryDetails
    inventoryDetails.forEach((item) => {
      const key = item.teamMemberName;
      if (!grouped[key]) {
        grouped[key] = {
          team: item.teamMemberName,
          role: item.teamMemberRole,
          materials: [],
        };
      }
      grouped[key].materials.push({
        name: item.materialName,
        opening: item.openingBalance,
        used: item.totalUsed,
        remaining: item.remaining,
      });
    });

    return Object.values(grouped);
  }, [inventoryDetails, teamMembers]);

  const exportCSV = () => {
    if (viewMode === 'summary') {
      const headers = [
        'Team Member',
        'Role',
        'Material',
        'Opening Balance',
        'Used',
        'Remaining',
      ];
      const rows: string[][] = [];

      summaryData.forEach((group) => {
        group.materials.forEach((mat) => {
          rows.push([
            group.team,
            group.role,
            mat.name,
            String(mat.opening),
            String(mat.used),
            String(mat.remaining),
          ]);
        });
      });

      const csv = [headers, ...rows]
        .map((r) =>
          r
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory_summary_report.csv';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Detailed view with usage records
    const headers = [
      'Team Member',
      'Role',
      'Material',
      'Opening Balance',
      'Usage Date',
      'Quantity Used',
      'Notes',
      'Total Used',
      'Remaining',
    ];
    const rows: string[][] = [];

    inventoryDetails.forEach((item) => {
      if (item.usageRecords.length === 0) {
        // No usage records
        rows.push([
          item.teamMemberName,
          item.teamMemberRole,
          item.materialName,
          String(item.openingBalance),
          '',
          '',
          '',
          String(item.totalUsed),
          String(item.remaining),
        ]);
      } else {
        // One row per usage record
        item.usageRecords.forEach((usage, idx) => {
          rows.push([
            idx === 0 ? item.teamMemberName : '',
            idx === 0 ? item.teamMemberRole : '',
            idx === 0 ? item.materialName : '',
            idx === 0 ? String(item.openingBalance) : '',
            usage.date,
            String(usage.quantity),
            usage.notes,
            idx === item.usageRecords.length - 1 ? String(item.totalUsed) : '',
            idx === item.usageRecords.length - 1 ? String(item.remaining) : '',
          ]);
        });
      }
    });

    const csv = [headers, ...rows]
      .map((r) =>
        r
          .map((c) => `"${String(c).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_detailed_report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Inventory Detail Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    if (viewMode === 'summary') {
      const headers = [['Team Member', 'Role', 'Material', 'Opening', 'Used', 'Remaining']];
      const rows: any[] = [];
      summaryData.forEach((group) => {
        group.materials.forEach((mat) => {
          rows.push([
            group.team,
            group.role,
            mat.name,
            String(mat.opening),
            String(mat.used),
            String(mat.remaining),
          ]);
        });
      });
      autoTable(doc, { head: headers, body: rows, startY: 28, styles: { fontSize: 8 } });
    } else {
      const headers = [['Team', 'Role', 'Material', 'Opening', 'Usage Date', 'Used', 'Notes', 'Total Used', 'Remaining']];
      const rows: any[] = [];
      inventoryDetails.forEach((item) => {
        if (item.usageRecords.length === 0) {
          rows.push([
            item.teamMemberName,
            item.teamMemberRole,
            item.materialName,
            String(item.openingBalance),
            '',
            '',
            '',
            String(item.totalUsed),
            String(item.remaining),
          ]);
        } else {
          item.usageRecords.forEach((usage, idx) => {
            rows.push([
              idx === 0 ? item.teamMemberName : '',
              idx === 0 ? item.teamMemberRole : '',
              idx === 0 ? item.materialName : '',
              idx === 0 ? String(item.openingBalance) : '',
              usage.date,
              String(usage.quantity),
              usage.notes,
              idx === item.usageRecords.length - 1 ? String(item.totalUsed) : '',
              idx === item.usageRecords.length - 1 ? String(item.remaining) : '',
            ]);
          });
        }
      });
      autoTable(doc, { head: headers, body: rows, startY: 28, styles: { fontSize: 7 } });
    }

    doc.save('inventory_report.pdf');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-6xl w-full p-6 mt-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">
              Inventory Detail Report
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Showing inventory from {summaryData.length} team{summaryData.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="px-3 py-1 bg-primary text-white rounded-md text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={exportPDF}
              className="px-3 py-1 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600"
            >
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 rounded-md text-sm text-text-secondary"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={textFilter}
            onChange={(e) => setTextFilter(e.target.value)}
            placeholder="Search material name..."
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800"
          />
          <select
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="All">All Teams ({allTeams.length})</option>
            {allTeams.map(team => {
              const teamHasMaterials = inventoryDetails.some(d => d.teamMemberName === team);
              return (
                <option key={team} value={team} disabled={!teamHasMaterials}>
                  {team} {teamHasMaterials ? '' : '(no materials)'}
                </option>
              );
            })}
          </select>
          <select
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="All">All Sites</option>
            {sitesForDropdown.map(site => (
              <option key={site} value={site}>{site}</option>
            ))}
          </select>
          <select
            className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800"
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="summary">View: Summary</option>
            <option value="detailed">View: Detailed</option>
          </select>
        </div>

        <div className="mt-5">
          {viewMode === 'summary' && (
            <div className="space-y-3">
              {summaryData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No inventory data found.
                </div>
              ) : (
                summaryData.map((group) => (
                  <div
                    key={group.team}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-white/60 font-semibold text-gray-900">
                      {group.team} ({group.role}) • {group.materials.length}{' '}
                      material{group.materials.length !== 1 ? 's' : ''}
                    </div>
                    <div className="p-3">
                      {group.materials.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No inventory assigned
                        </div>
                      ) : (
                        <table className="w-full text-sm text-left text-gray-700">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                              <th className="px-3 py-2">Material</th>
                              <th className="px-3 py-2 text-right">
                                Opening Balance
                              </th>
                              <th className="px-3 py-2 text-right">Used</th>
                              <th className="px-3 py-2 text-right">Remaining</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.materials.map((mat, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-200 hover:bg-gray-50"
                              >
                                <td className="px-3 py-2">{mat.name}</td>
                                <td className="px-3 py-2 text-right">
                                  {mat.opening}m
                                </td>
                                <td className="px-3 py-2 text-right text-orange-400">
                                  {mat.used}m
                                </td>
                                <td
                                  className={`px-3 py-2 text-right font-semibold ${
                                    mat.remaining < 0
                                      ? 'text-red-400'
                                      : mat.remaining < mat.opening * 0.1
                                      ? 'text-yellow-400'
                                      : 'text-green-400'
                                  }`}
                                >
                                  {mat.remaining}m
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'detailed' && (
            <div className="border border-gray-200 rounded-lg p-3">
              {inventoryDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No inventory data found.
                </div>
              ) : (
                <div className="space-y-4">
                  {inventoryDetails.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-200 pb-4">
                      <div className="font-semibold text-gray-900 mb-2">
                        {item.teamMemberName} ({item.teamMemberRole}) -{' '}
                        {item.materialName}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                        <div>
                          <span className="text-gray-500">Opening:</span>
                          <div className="font-semibold text-gray-800">
                            {item.openingBalance}m
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Used:</span>
                          <div className="font-semibold text-orange-400">
                            {item.totalUsed}m
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Remaining:</span>
                          <div
                            className={`font-semibold ${
                              item.remaining < 0
                                ? 'text-red-400'
                                : item.remaining <
                                  item.openingBalance * 0.1
                                ? 'text-yellow-400'
                                : 'text-green-400'
                            }`}
                          >
                            {item.remaining}m
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Usage Records:</span>
                          <div className="font-semibold text-gray-800">
                            {item.usageRecords.length}
                          </div>
                        </div>
                      </div>
                      {item.usageRecords.length > 0 && (
                        <div className="bg-gray-50/30 rounded p-2 text-xs">
                          <table className="w-full text-gray-700">
                            <thead className="text-gray-500">
                              <tr>
                                <th className="text-left px-2 py-1">Date</th>
                                <th className="text-left px-2 py-1">Qty</th>
                                <th className="text-left px-2 py-1">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.usageRecords.map((rec, ridx) => (
                                <tr
                                  key={ridx}
                                  className="border-t border-gray-200"
                                >
                                  <td className="px-2 py-1">{rec.date}</td>
                                  <td className="px-2 py-1">{rec.quantity}m</td>
                                  <td className="px-2 py-1">{rec.notes}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
