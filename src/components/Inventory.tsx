import React, { useState, useMemo } from 'react';
import { InventoryItem, TeamMember, Site } from '../App';
import { AddMaterialModal } from './AddMaterialModal';

interface InventoryProps {
    inventoryData: InventoryItem[];
    currentUser?: TeamMember | null;
    // callbacks to manipulate inventory (only available to privileged roles)
    onEditItem?: (siteName: string, materialName: string, newInitialUnits: number) => Promise<boolean>;
    onDeleteItem?: (siteName: string, materialName: string) => Promise<boolean>;
    onAddItem?: (siteId: string, name: string, units: number) => Promise<boolean>;
    sites?: Site[];
    onOpenUsageModal?: () => void;
    onOpenBalanceModal?: () => void;
}

interface GroupedMember {
    memberId: string;
    memberName: string;
    memberRole: string;
    materials: InventoryItem[];
}

const groupByMember = (items: InventoryItem[]): GroupedMember[] => {
    const groups: { [key: string]: GroupedMember } = {};
    
    items.forEach(item => {
        if (!groups[item.teamMemberName]) {
            groups[item.teamMemberName] = {
                memberId: item.teamMemberName,
                memberName: item.teamMemberName,
                memberRole: item.teamMemberRole,
                materials: [],
            };
        }
        groups[item.teamMemberName].materials.push(item);
    });
    
    return Object.values(groups).sort((a, b) => a.memberName.localeCompare(b.memberName));
};


export const Inventory: React.FC<InventoryProps> = ({ inventoryData, currentUser, onEditItem, onDeleteItem, onAddItem, sites, onOpenUsageModal, onOpenBalanceModal }) => {
    const [memberFilter, setMemberFilter] = useState('');
    const [siteFilter, setSiteFilter] = useState('');
    const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());
    const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);

    const filteredData = useMemo(() => {
        return inventoryData.filter(item => {
            return (memberFilter ? item.teamMemberName.toLowerCase().includes(memberFilter.toLowerCase()) : true) &&
                   (siteFilter ? item.assignedSite.toLowerCase().includes(siteFilter.toLowerCase()) : true);
        });
    }, [inventoryData, memberFilter, siteFilter]);
    
    const groupedMembers = useMemo(() => groupByMember(filteredData), [filteredData]);

    const toggleExpand = (memberName: string) => {
        const newExpanded = new Set(expandedMembers);
        if (newExpanded.has(memberName)) {
            newExpanded.delete(memberName);
        } else {
            newExpanded.add(memberName);
        }
        setExpandedMembers(newExpanded);
    };

    const getUsagePercentage = (used: number, initial: number) => {
        if (initial <= 0) return 0;
        return Math.min((used / initial) * 100, 100);
    };

    const getRemainingColor = (remaining: number, initial: number) => {
        if (initial <= 0) return 'text-gray-800';
        const percentage = (remaining / initial) * 100;
        if (percentage < 10) return 'text-red-400 font-bold';
        if (percentage < 25) return 'text-yellow-400 font-semibold';
        return 'text-green-400';
    };

    const isPrivileged = currentUser && ['Admin', 'Manager', 'Accountant'].includes(currentUser.role);

    const handleAddClick = () => {
        setIsAddMaterialModalOpen(true);
    };

    const handleAddMaterial = async (siteId: string, materialName: string, units: number) => {
        if (onAddItem) {
            await onAddItem(siteId, materialName, units);
        }
    };

    return (
        <div className="w-full animate-fade-in">
            <div className="bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800 border-b border-gray-300 pb-3">Team Inventory Overview</h2>
                    <div className="flex items-center gap-2">
                        {!isPrivileged && currentUser && onOpenUsageModal && (
                            <button onClick={() => onOpenUsageModal()} className="px-3 py-1 bg-primary text-white rounded-md text-sm">Log Material Usage</button>
                        )}
                        {isPrivileged && onOpenBalanceModal && (
                            <button onClick={() => onOpenBalanceModal()} className="px-3 py-1 bg-primary text-white rounded-md text-sm">Set Opening Balance</button>
                        )}
                        {isPrivileged && onAddItem && sites && (
                            <button onClick={handleAddClick} className="px-3 py-1 bg-primary text-white rounded-md text-sm">Add Material</button>
                        )}
                    </div>
                </div>

                <AddMaterialModal
                    isOpen={isAddMaterialModalOpen}
                    onClose={() => setIsAddMaterialModalOpen(false)}
                    onSubmit={handleAddMaterial}
                    sites={sites || []}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Filter by Team Member..."
                        value={memberFilter}
                        onChange={e => setMemberFilter(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                        type="text"
                        placeholder="Filter by Site Name..."
                        value={siteFilter}
                        onChange={e => setSiteFilter(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-800 focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="space-y-3">
                    {groupedMembers.length > 0 ? (
                        groupedMembers.map(group => (
                            <div key={group.memberName} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50/30">
                                {/* Accordion Header */}
                                <button
                                    onClick={() => toggleExpand(group.memberName)}
                                    className="w-full px-4 py-3 bg-white/60 hover:bg-white transition-colors flex items-center justify-between text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`transform transition-transform ${expandedMembers.has(group.memberName) ? 'rotate-180' : ''}`}>
                                            ▼
                                        </span>
                                        <div>
                                            <div className="font-semibold text-gray-900">{group.memberName}</div>
                                            <div className="text-xs text-gray-500">{group.memberRole} • {group.materials.length} material{group.materials.length !== 1 ? 's' : ''}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {expandedMembers.has(group.memberName) ? 'Hide' : 'Show'} Details
                                    </div>
                                </button>

                                {/* Accordion Content */}
                                {expandedMembers.has(group.memberName) && (
                                    <div className="border-t border-gray-200">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left text-gray-700">
                                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-4 py-3">Site</th>
                                                        <th scope="col" className="px-4 py-3">Material</th>
                                                        <th scope="col" className="px-4 py-3 text-center">Initial (m)</th>
                                                        <th scope="col" className="px-4 py-3 text-center">Used (m)</th>
                                                        <th scope="col" className="px-4 py-3 text-center">Remaining (m)</th>
                                                        <th scope="col" className="px-4 py-3 text-center">Usage %</th>
                                                        {isPrivileged && <th scope="col" className="px-4 py-3 text-center">Actions</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.materials.map(item => (
                                                        <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                            <td className="px-4 py-3">{item.assignedSite}</td>
                                                            <td className="px-4 py-3">{item.materialName}</td>
                                                            <td className="px-4 py-3 text-center">{item.initialUnits.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-center">{item.usedUnits.toLocaleString()}</td>
                                                            <td className={`px-4 py-3 text-center ${getRemainingColor(item.remainingUnits, item.initialUnits)}`}>{item.remainingUnits.toLocaleString()}</td>
                                                            <td className="px-4 py-3">
                                                                {item.initialUnits > 0 && (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-16 bg-gray-200 rounded-full h-1.5" title={`${getUsagePercentage(item.usedUnits, item.initialUnits).toFixed(1)}% Used`}>
                                                                            <div 
                                                                                className="bg-orange-500 h-1.5 rounded-full" 
                                                                                style={{ width: `${getUsagePercentage(item.usedUnits, item.initialUnits)}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-xs text-gray-500">{getUsagePercentage(item.usedUnits, item.initialUnits).toFixed(0)}%</span>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            {isPrivileged && (
                                                                <td className="px-4 py-3 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <button onClick={async () => {
                                                                            const val = prompt('Enter new initial units', String(item.initialUnits));
                                                                            if (!val) return;
                                                                            const n = Number(val);
                                                                            if (isNaN(n)) { alert('Invalid number'); return; }
                                                                            if (onEditItem) await onEditItem(item.assignedSite, item.materialName, n);
                                                                        }} className="text-xs px-2 py-1 bg-gray-200 rounded text-text-secondary hover:bg-gray-300">Edit</button>
                                                                        <button onClick={async () => {
                                                                            if (!confirm(`Delete material ${item.materialName} from ${item.assignedSite}?`)) return;
                                                                            if (onDeleteItem) await onDeleteItem(item.assignedSite, item.materialName);
                                                                        }} className="text-xs px-2 py-1 bg-red-600 rounded text-white hover:bg-red-700">Delete</button>
                                                                    </div>
                                                                </td>
                                                            )}
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
                            No inventory data found for the current filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
