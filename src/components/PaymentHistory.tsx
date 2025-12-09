import React, { useState, useMemo } from 'react';
import { PaymentRequest } from '../App';

interface PaymentHistoryProps {
    requests: PaymentRequest[];
}

interface PaymentHistoryEntry {
    id: string;
    siteName: string;
    timestamp: string;
    status: 'Pending' | 'Approved' | 'Paid';
    userName: string;
}

interface GroupedSite {
    siteName: string;
    history: PaymentHistoryEntry[];
}

const groupBySite = (items: PaymentHistoryEntry[]): GroupedSite[] => {
    const groups: { [key: string]: GroupedSite } = {};
    
    items.forEach(item => {
        if (!groups[item.siteName]) {
            groups[item.siteName] = {
                siteName: item.siteName,
                history: [],
            };
        }
        groups[item.siteName].history.push(item);
    });
    
    return Object.values(groups)
        .sort((a, b) => a.siteName.localeCompare(b.siteName))
        .map(group => ({
            ...group,
            history: group.history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        }));
};

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ requests }) => {
    const [siteFilter, setSiteFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());

    const historyLog = useMemo(() => {
        return requests.flatMap(req => 
            (req.amount && req.paymentFor && req.statusHistory) 
            ? req.statusHistory.map(h => ({ ...h, siteName: req.siteName, id: `${req.id}-${h.timestamp}` })) 
            : []
        );
    }, [requests]);
    
    const filteredLog = useMemo(() => {
        return historyLog.filter(log => {
            return (siteFilter ? log.siteName.toLowerCase().includes(siteFilter.toLowerCase()) : true) &&
                   (userFilter ? log.userName.toLowerCase().includes(userFilter.toLowerCase()) : true) &&
                   (statusFilter !== 'All' ? log.status === statusFilter : true);
        });
    }, [historyLog, siteFilter, userFilter, statusFilter]);

    const groupedSites = useMemo(() => groupBySite(filteredLog), [filteredLog]);

    const toggleExpand = (siteName: string) => {
        const newExpanded = new Set(expandedSites);
        if (newExpanded.has(siteName)) {
            newExpanded.delete(siteName);
        } else {
            newExpanded.add(siteName);
        }
        setExpandedSites(newExpanded);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'bg-amber-100 text-amber-700';
            case 'Approved':
                return 'bg-green-100 text-green-700';
            case 'Paid':
                return 'bg-blue-100 text-blue-700';
            default:
                return 'bg-gray-200 text-gray-700';
        }
    };

    return (
        <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6 transition-all duration-500">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b border-gray-300 pb-3">
                Payment Approval History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Filter by Site Name..."
                    value={siteFilter}
                    onChange={e => setSiteFilter(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Filter by User..."
                    value={userFilter}
                    onChange={e => setUserFilter(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Paid">Paid</option>
                </select>
            </div>

            <div className="space-y-3">
                {groupedSites.length > 0 ? (
                    groupedSites.map(group => (
                        <div key={group.siteName} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/30">
                            {/* Accordion Header */}
                            <button
                                onClick={() => toggleExpand(group.siteName)}
                                className="w-full px-4 py-3 bg-white/60 hover:bg-white transition-colors flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`transform transition-transform ${expandedSites.has(group.siteName) ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                    <div>
                                        <div className="font-semibold text-gray-900">{group.siteName}</div>
                                        <div className="text-xs text-gray-500">{group.history.length} update{group.history.length !== 1 ? 's' : ''}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {expandedSites.has(group.siteName) ? 'Hide' : 'Show'} History
                                </div>
                            </button>

                            {/* Accordion Content */}
                            {expandedSites.has(group.siteName) && (
                                <div className="border-t border-gray-200">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left text-gray-700">
                                            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="px-4 py-3">Date</th>
                                                    <th scope="col" className="px-4 py-3">Status</th>
                                                    <th scope="col" className="px-4 py-3">Updated By</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.history.map(entry => (
                                                    <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-700">{entry.timestamp}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(entry.status)}`}>
                                                                {entry.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-gray-700">{entry.userName}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        No history found for the current filters.
                    </div>
                )}
            </div>
        </div>
    );
};
