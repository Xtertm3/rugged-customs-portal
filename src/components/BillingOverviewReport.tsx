import React, { useState, useMemo } from 'react';
import { BillingOverview, BillingStatus, Site, Vendor } from '../App';
import { BillingStatusUpdate } from './BillingStatusUpdate';

interface ProjectSummary {
  id: string;
  totalPaid: number;
}

interface BillingOverviewReportProps {
  billings: BillingOverview[];
  sites: Site[];
  vendors: Vendor[];
  currentUser: any;
  onAddBilling: (billing: Omit<BillingOverview, 'id'>) => Promise<void>;
  onUpdateBilling: (id: string, updates: Partial<BillingOverview>) => Promise<void>;
  onDeleteBilling: (id: string) => Promise<void>;
  onUpdateSiteBillingStatus?: (siteId: string, status: 'WIP' | 'YTB' | 'ADD PR DONE' | 'WCC DONE' | 'BILLING DONE', billingValue: number) => Promise<void>;
  projectSummaries?: ProjectSummary[];
}

const BILLING_STATUSES: BillingStatus[] = [
  'Quotation Sent',
  'Yet To Bill',
  'Approval Pending',
  'Add PR Process',
  'Add PR Done',
  'Waiting For Amendment',
  'WCC Done',
  'Billing Completed'
];

const GST_RATE = 0.18; // 18% GST

export const BillingOverviewReport: React.FC<BillingOverviewReportProps> = ({
  billings,
  sites,
  currentUser,
  onAddBilling,
  onUpdateBilling,
  onDeleteBilling,
  onUpdateSiteBillingStatus,
  projectSummaries = []
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState<BillingOverview | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    siteId: '',
    quotationAmount: '',
    yetToBillAmount: '',
    expense: '',
    status: 'Quotation Sent' as BillingStatus,
    vendorName: '',
    pendingWithType: '' as 'client' | 'vendor' | '',
    pendingWithName: ''
  });

  const isAdmin = currentUser?.role === 'Admin';
  const canViewProfit = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const filteredBillings = useMemo(() => {
    return billings.filter(billing => {
      const matchesSearch = 
        billing.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        billing.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || billing.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [billings, searchTerm, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSite = sites.find(s => s.id === formData.siteId);
    if (!selectedSite) {
      alert('Please select a site');
      return;
    }

    const quotationAmount = parseFloat(formData.quotationAmount) || 0;
    const yetToBillAmount = parseFloat(formData.yetToBillAmount) || quotationAmount;
    const expense = parseFloat(formData.expense) || 0;

    // Auto-calculate actual billing only if status is Billing Completed
    const actualBillingBasic = formData.status === 'Billing Completed' ? yetToBillAmount : 0;
    const actualBillingGST = actualBillingBasic * GST_RATE;
    const actualBillingTotal = actualBillingBasic + actualBillingGST;
    const profit = actualBillingTotal - expense;

    const billingData = {
      siteId: formData.siteId,
      siteName: selectedSite.siteName,
      clientName: selectedSite.vendorName || 'N/A',
      vendorName: formData.vendorName || undefined,
      quotationAmount,
      yetToBillAmount,
      actualBillingBasic,
      actualBillingGST,
      actualBillingTotal,
      expense,
      profit,
      status: formData.status,
      pendingWithType: formData.pendingWithType || undefined,
      pendingWithName: formData.pendingWithName || undefined,
      statusHistory: [
        {
          status: formData.status,
          timestamp: new Date().toISOString(),
          updatedBy: currentUser.id
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentUser.id
    };

    try {
      if (editingBilling) {
        await onUpdateBilling(editingBilling.id, {
          ...billingData,
          statusHistory: [
            ...editingBilling.statusHistory,
            {
              status: formData.status,
              timestamp: new Date().toISOString(),
              updatedBy: currentUser.id
            }
          ]
        });
      } else {
        await onAddBilling(billingData);
      }
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error saving billing:', error);
      alert('Failed to save billing');
    }
  };

  const resetForm = () => {
    setFormData({
      siteId: '',
      quotationAmount: '',
      yetToBillAmount: '',
      expense: '',
      status: 'Quotation Sent',
      vendorName: '',
      pendingWithType: '',
      pendingWithName: ''
    });
    setEditingBilling(null);
  };

  const handleEdit = (billing: BillingOverview) => {
    setEditingBilling(billing);
    setFormData({
      siteId: billing.siteId,
      quotationAmount: billing.quotationAmount.toString(),
      yetToBillAmount: billing.yetToBillAmount.toString(),
      expense: billing.expense.toString(),
      status: billing.status,
      vendorName: billing.vendorName || '',
      pendingWithType: billing.pendingWithType || '',
      pendingWithName: billing.pendingWithName || ''
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string, siteName: string) => {
    if (window.confirm(`Delete billing for "${siteName}"?`)) {
      try {
        await onDeleteBilling(id);
      } catch (error) {
        console.error('Error deleting billing:', error);
        alert('Failed to delete billing');
      }
    }
  };

  const getStatusColor = (status: BillingStatus) => {
    const colors: Record<BillingStatus, string> = {
      'Quotation Sent': 'bg-blue-100 text-blue-700',
      'Yet To Bill': 'bg-yellow-100 text-yellow-700',
      'Approval Pending': 'bg-blue-100 text-blue-700',
      'Add PR Process': 'bg-purple-100 text-purple-700',
      'Add PR Done': 'bg-indigo-100 text-indigo-700',
      'Waiting For Amendment': 'bg-amber-100 text-amber-700',
      'WCC Done': 'bg-teal-100 text-teal-700',
      'Billing Completed': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const exportToCSV = () => {
    const headers = canViewProfit
      ? ['Site ID', 'Site Name', 'Client', 'Vendor', 'Quotation', 'Yet To Bill', 'Actual Billing', 'Expense', 'Profit', 'Status', 'Pending With', 'Updated']
      : ['Site ID', 'Site Name', 'Client', 'Vendor', 'Quotation', 'Yet To Bill', 'Actual Billing', 'Status', 'Pending With', 'Updated'];

    const rows = filteredBillings.map(b => canViewProfit
      ? [b.siteId, b.siteName, b.clientName, b.vendorName || '', b.quotationAmount, b.yetToBillAmount, b.actualBillingTotal, b.expense, b.profit, b.status, b.pendingWithName || '', new Date(b.updatedAt).toLocaleDateString()]
      : [b.siteId, b.siteName, b.clientName, b.vendorName || '', b.quotationAmount, b.yetToBillAmount, b.actualBillingTotal, b.status, b.pendingWithName || '', new Date(b.updatedAt).toLocaleDateString()]
    );

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-overview-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">💰 Billing Overview Report</h2>
          <p className="text-gray-600 mt-1">Track quotations, billings, and profit</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ripple"
          >
            📥 Export CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ripple"
          >
            ➕ Add Billing
          </button>
        </div>
      </div>

      {/* Billing Status Update Section */}
      {onUpdateSiteBillingStatus && (
        <BillingStatusUpdate
          sites={sites}
          projectSummaries={projectSummaries}
          onUpdateStatus={onUpdateSiteBillingStatus}
        />
      )}

      {/* Filters */}
      <div className="glass rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="🔍 Search by site or client name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
        >
          <option value="">All Statuses</option>
          {BILLING_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Site Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Client</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Quotation</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Yet To Bill</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">Actual Billing</th>
                {canViewProfit && (
                  <>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Expense</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Profit</th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Pending With</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBillings.map((billing) => (
                <tr key={billing.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{billing.siteName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{billing.clientName}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">₹{billing.quotationAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-yellow-600 font-medium">₹{billing.yetToBillAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">₹{billing.actualBillingTotal.toLocaleString()}</td>
                  {canViewProfit && (
                    <>
                      <td className="px-4 py-3 text-sm text-right text-red-600">₹{billing.expense.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-sm text-right font-bold ${billing.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{billing.profit.toLocaleString()}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(billing.status)}`}>
                      {billing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{billing.pendingWithName || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(billing)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(billing.id, billing.siteName)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBillings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No billing records found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold">
                {editingBilling ? '✏️ Edit Billing' : '➕ Add Billing'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Site <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                    disabled={!!editingBilling}
                  >
                    <option value="">Select a site</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.siteName} - {site.vendorName || 'No Client'}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BillingStatus })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                  >
                    {BILLING_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quotation Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.quotationAmount}
                    onChange={(e) => setFormData({ ...formData, quotationAmount: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Enter amount"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yet To Bill Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.yetToBillAmount}
                    onChange={(e) => setFormData({ ...formData, yetToBillAmount: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    placeholder="Usually > Quotation"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expense
                    </label>
                    <input
                      type="number"
                      value={formData.expense}
                      onChange={(e) => setFormData({ ...formData, expense: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Enter expense"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}

                {(formData.status === 'Add PR Process' || formData.status === 'Add PR Done') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                      placeholder="Enter vendor name"
                    />
                  </div>
                )}
              </div>

              {(formData.status === 'Approval Pending' || formData.status === 'Add PR Done') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pending With Type
                    </label>
                    <select
                      value={formData.pendingWithType}
                      onChange={(e) => setFormData({ ...formData, pendingWithType: e.target.value as 'client' | 'vendor' })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all outline-none"
                    >
                      <option value="">Select type</option>
                      <option value="client">Client</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pending With Name
                    </label>
                    <input
                      type="text"
                      value={formData.pendingWithName}
                      onChange={(e) => setFormData({ ...formData, pendingWithName: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all outline-none"
                      placeholder="Enter name"
                    />
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Note:</span> Actual Billing will auto-calculate when status is set to "Billing Completed". 
                  GST @ 18% will be automatically added.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(false);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ripple"
                >
                  {editingBilling ? 'Update Billing' : 'Add Billing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
