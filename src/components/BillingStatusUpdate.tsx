import React, { useState, useMemo, useEffect } from 'react';

export type BillingStatus = 'WIP' | 'YTB' | 'ADD PR DONE' | 'WCC DONE' | 'BILLING DONE';

interface Site {
  id: string;
  siteName: string;
  billingStatus?: BillingStatus;
  billingValue?: number;
}

interface ProjectSummary {
  id: string;
  totalPaid: number;
}

interface BillingStatusUpdateProps {
  sites: Site[];
  projectSummaries: ProjectSummary[];
  onUpdateStatus: (siteId: string, status: BillingStatus, billingValue: number) => Promise<void>;
}

export const BillingStatusUpdate: React.FC<BillingStatusUpdateProps> = ({ sites, projectSummaries, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<BillingStatus>('WIP');
  const [billingValue, setBillingValue] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Extract Site ID and Site Name from siteName
  const parseSiteInfo = (siteName: string) => {
    const siteIdMatch = siteName.match(/\bIN-?\d+\b/i);
    const rlIdMatch = siteName.match(/\bR\/RL-?\d+\b/i);
    const baseName = siteName
      .replace(siteIdMatch?.[0] || '', '')
      .replace(rlIdMatch?.[0] || '', '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    return {
      siteId: siteIdMatch?.[0]?.toUpperCase() || '',
      rlId: rlIdMatch?.[0]?.toUpperCase() || '',
      siteName: baseName || siteName
    };
  };

  // Filter sites based on search term
  const filteredSites = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    return sites
      .map(site => ({
        ...site,
        parsed: parseSiteInfo(site.siteName)
      }))
      .filter(site => 
        site.parsed.siteName.toLowerCase().includes(term) ||
        site.parsed.siteId.toLowerCase().includes(term) ||
        site.parsed.rlId.toLowerCase().includes(term)
      )
      .slice(0, 10); // Limit to 10 results
  }, [searchTerm, sites]);

  const handleSelectSite = (site: Site) => {
    setSelectedSite(site);
    setSelectedStatus(site.billingStatus || 'WIP');
    
    // Load billing value based on status
    if (site.billingStatus === 'WIP') {
      // For WIP, sum totalPaid (team payments) + billingValue (materials)
      const summary = projectSummaries.find(p => p.id === site.id);
      const totalPaid = summary?.totalPaid || 0;
      const materialsBilling = site.billingValue || 0;
      const combinedTotal = totalPaid + materialsBilling;
      setBillingValue(combinedTotal.toString());
    } else {
      // For other statuses, load existing billingValue
      setBillingValue(site.billingValue?.toString() || '');
    }
    
    const parsed = parseSiteInfo(site.siteName);
    setSearchTerm(`${parsed.siteName} (${parsed.siteId})`);
    setShowDropdown(false);
  };

  // Update billing value when status changes
  useEffect(() => {
    if (!selectedSite) return;
    
    if (selectedStatus === 'WIP') {
      // For WIP, sum totalPaid (team payments) + billingValue (materials)
      const summary = projectSummaries.find(p => p.id === selectedSite.id);
      const totalPaid = summary?.totalPaid || 0;
      const materialsBilling = selectedSite.billingValue || 0;
      const combinedTotal = totalPaid + materialsBilling;
      setBillingValue(combinedTotal.toString());
    } else if (selectedStatus !== selectedSite.billingStatus) {
      // When changing to non-WIP status, keep existing value
      setBillingValue(selectedSite.billingValue?.toString() || '');
    }
  }, [selectedStatus, selectedSite, projectSummaries]);

  const handleUpdateStatus = async () => {
    if (!selectedSite) return;

    const valueNum = parseFloat(billingValue) || 0;
    if (valueNum <= 0 && selectedStatus !== 'WIP') {
      alert('Please enter a valid billing value');
      return;
    }

    setIsUpdating(true);
    setSuccessMessage('');

    try {
      await onUpdateStatus(selectedSite.id, selectedStatus, valueNum);
      setSuccessMessage(`Status updated successfully to "${selectedStatus}" with value ₹${valueNum.toLocaleString()}`);
      
      // Clear after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
        setSelectedSite(null);
        setSelectedStatus('WIP');
        setBillingValue('');
        setSearchTerm('');
      }, 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: BillingStatus) => {
    switch (status) {
      case 'WIP': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'YTB': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'ADD PR DONE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'WCC DONE': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'BILLING DONE': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Update Billing Status</h3>

      {/* Horizontal Layout */}
      <div className="flex items-start gap-3 mb-4">
        {/* Search Site */}
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Search by Site Name, Site ID or RL ID
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
              if (!e.target.value.trim()) {
                setSelectedSite(null);
              }
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Type at least 1 character..."
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          
          {/* Dropdown */}
          {showDropdown && filteredSites.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredSites.map((site) => {
                const parsed = parseSiteInfo(site.siteName);
                return (
                  <div
                    key={site.id}
                    onClick={() => handleSelectSite(site)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="font-semibold text-sm text-gray-900">{parsed.siteName}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      <span className="font-mono font-semibold">{parsed.siteId}</span>
                      {parsed.rlId && <span className="font-mono font-semibold ml-2">{parsed.rlId}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="w-56">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Billing Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as BillingStatus)}
            disabled={!selectedSite}
            className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !selectedSite ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            } ${getStatusColor(selectedStatus)}`}
          >
            <option value="WIP">WIP</option>
            <option value="YTB">YTB</option>
            <option value="ADD PR DONE">ADD PR DONE</option>
            <option value="WCC DONE">WCC DONE</option>
            <option value="BILLING DONE">BILLING DONE</option>
          </select>
        </div>

        {/* Value Input */}
        <div className="w-48">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Value (₹)
          </label>
          <input
            type="number"
            value={billingValue}
            onChange={(e) => setBillingValue(e.target.value)}
            disabled={!selectedSite || selectedStatus === 'WIP'}
            placeholder={selectedStatus === 'WIP' ? 'Auto-filled' : 'Enter amount'}
            className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !selectedSite || selectedStatus === 'WIP' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
          />
          {selectedStatus === 'WIP' && selectedSite && (
            <div className="text-[10px] text-gray-500 mt-0.5">Auto-filled: Total Paid + Materials</div>
          )}
        </div>

        {/* Update Button */}
        <div className="w-32">
          <label className="block text-xs font-semibold text-transparent mb-1.5">Action</label>
          <button
            onClick={handleUpdateStatus}
            disabled={isUpdating || !selectedSite}
            className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border-2 border-green-300 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
            <span className="text-lg">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
