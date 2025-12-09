import React from 'react';
import { VendorBillingRequest, VendorBillingStatus } from '../App';

interface Props {
  requests: VendorBillingRequest[];
  onUpdateStatus: (id: string, status: VendorBillingStatus) => void;
}

export const VendorBillingOverviewReport: React.FC<Props> = ({ requests, onUpdateStatus }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const statusOptions: VendorBillingStatus[] = [
    'PR Process',
    'PR Done',
    'Waiting For Amendment',
    'WCC Done',
    'Billing Done',
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Vendor Billing Overview</h2>
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Site ID</th>
              <th className="px-3 py-2 text-left">RL ID</th>
              <th className="px-3 py-2 text-left">Site Name</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <React.Fragment key={r.id}>
                <tr className="border-t">
                  <td className="px-3 py-2">{r.siteIdCode}</td>
                  <td className="px-3 py-2">{r.rlId}</td>
                  <td className="px-3 py-2">{r.siteName}</td>
                  <td className="px-3 py-2 text-right">₹{r.totalAmount?.toLocaleString?.() || r.totalAmount}</td>
                  <td className="px-3 py-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={r.status}
                      onChange={(e) => onUpdateStatus(r.id, e.target.value as VendorBillingStatus)}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      {expandedId === r.id ? 'Hide' : 'View'} Items
                    </button>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-3 py-2">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 text-left">Code</th>
                              <th className="px-2 py-1 text-left">Category</th>
                              <th className="px-2 py-1 text-left">Description</th>
                              <th className="px-2 py-1 text-right">Qty</th>
                              <th className="px-2 py-1 text-right">Rate</th>
                              <th className="px-2 py-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.lineItems.map((li) => (
                              <tr key={li.id} className="border-t">
                                <td className="px-2 py-1">{li.itemCode}</td>
                                <td className="px-2 py-1">{li.category}</td>
                                <td className="px-2 py-1">{li.description}</td>
                                <td className="px-2 py-1 text-right">{li.quantity}</td>
                                <td className="px-2 py-1 text-right">₹{li.rate}</td>
                                <td className="px-2 py-1 text-right">₹{li.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorBillingOverviewReport;
