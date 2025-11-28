import React, { useState } from 'react';
import { Vendor, VendorTeamMember } from '../App';

interface VendorsProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => Promise<void>;
  onEditVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  onDeleteVendor: (id: string) => Promise<void>;
  currentUser: any;
}

const PREDEFINED_POSITIONS = [
  'Project Manager',
  'SEM (Site Execution Manager)',
  'Site Engineer',
  'Supervisor',
  'Quality Manager',
  'Safety Officer'
];

export const Vendors: React.FC<VendorsProps> = ({
  vendors,
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
  currentUser
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    team: [] as VendorTeamMember[]
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [teamMemberForm, setTeamMemberForm] = useState({
    name: '',
    position: '',
    customPosition: '',
    email: ''
  });
  const [editingTeamMemberId, setEditingTeamMemberId] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      team: []
    });
    setTeamMemberForm({
      name: '',
      position: '',
      customPosition: '',
      email: ''
    });
    setEditingTeamMemberId(null);
    setEditingVendor(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Vendor name is required');
      return;
    }

    try {
      if (editingVendor) {
        await onEditVendor(editingVendor.id, formData);
      } else {
        await onAddVendor({
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.id
        });
      }
      resetForm();
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert('Failed to save vendor');
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      team: vendor.team || []
    });
    setIsAddModalOpen(true);
  };

  const handleAddTeamMember = () => {
    if (!teamMemberForm.name.trim()) {
      alert('Team member name is required');
      return;
    }

    const position = teamMemberForm.position === 'Custom' 
      ? teamMemberForm.customPosition.trim()
      : teamMemberForm.position;

    if (!position) {
      alert('Position is required');
      return;
    }

    if (editingTeamMemberId) {
      // Update existing team member
      setFormData({
        ...formData,
        team: formData.team.map(member =>
          member.id === editingTeamMemberId
            ? { ...member, name: teamMemberForm.name.trim(), position, email: teamMemberForm.email.trim() }
            : member
        )
      });
      setEditingTeamMemberId(null);
    } else {
      // Add new team member
      const newMember: VendorTeamMember = {
        id: Date.now().toString(),
        name: teamMemberForm.name.trim(),
        position,
        email: teamMemberForm.email.trim() || undefined
      };
      setFormData({
        ...formData,
        team: [...formData.team, newMember]
      });
    }

    setTeamMemberForm({
      name: '',
      position: '',
      customPosition: '',
      email: ''
    });
  };

  const handleEditTeamMember = (member: VendorTeamMember) => {
    setEditingTeamMemberId(member.id);
    const isCustomPosition = !PREDEFINED_POSITIONS.includes(member.position);
    setTeamMemberForm({
      name: member.name,
      position: isCustomPosition ? 'Custom' : member.position,
      customPosition: isCustomPosition ? member.position : '',
      email: member.email || ''
    });
  };

  const handleDeleteTeamMember = (memberId: string) => {
    setFormData({
      ...formData,
      team: formData.team.filter(m => m.id !== memberId)
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete vendor "${name}"? This action cannot be undone.`)) {
      try {
        await onDeleteVendor(id);
      } catch (error) {
        console.error('Error deleting vendor:', error);
        alert('Failed to delete vendor');
      }
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.phone?.includes(searchTerm)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">🏢 Vendors</h2>
          <p className="text-gray-600 mt-1">Manage your client vendors</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ripple"
        >
          ➕ Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-4">
        <input
          type="text"
          placeholder="🔍 Search vendors by name, contact, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
        />
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="glass rounded-xl p-5 card-shadow hover:card-shadow-lg transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800">{vendor.name}</h3>
                {vendor.contactPerson && (
                  <p className="text-sm text-gray-600 mt-1">👤 {vendor.contactPerson}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vendor)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit vendor"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(vendor.id, vendor.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete vendor"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {vendor.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span>📞</span>
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <span>📧</span>
                  <span className="truncate">{vendor.email}</span>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-start gap-2 text-gray-700">
                  <span>📍</span>
                  <span className="flex-1">{vendor.address}</span>
                </div>
              )}
            </div>

            {/* Team Members */}
            {vendor.team && vendor.team.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">👥 Team ({vendor.team.length})</p>
                <div className="space-y-1">
                  {vendor.team.slice(0, 3).map(member => (
                    <div key={member.id} className="text-xs text-gray-600">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-gray-400"> • </span>
                      <span>{member.position}</span>
                    </div>
                  ))}
                  {vendor.team.length > 3 && (
                    <p className="text-xs text-gray-400 italic">+{vendor.team.length - 3} more...</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              Added {new Date(vendor.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12 glass rounded-xl">
          <div className="text-6xl mb-4">🏢</div>
          <p className="text-gray-600 text-lg">
            {searchTerm ? 'No vendors found matching your search' : 'No vendors yet. Add your first vendor!'}
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold">
                {editingVendor ? '✏️ Edit Vendor' : '➕ Add New Vendor'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  placeholder="Enter vendor/client name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  placeholder="Primary contact person"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                    placeholder="Email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none resize-none"
                  placeholder="Full address"
                />
              </div>

              {/* Team Management Section */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h4 className="text-lg font-semibold text-gray-800">👥 Team Members</h4>
                
                {/* Team Member Form */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={teamMemberForm.name}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                        placeholder="Enter name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={teamMemberForm.position}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, position: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                      >
                        <option value="">Select position</option>
                        {PREDEFINED_POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                        <option value="Custom">➕ Custom Position</option>
                      </select>
                    </div>
                  </div>

                  {teamMemberForm.position === 'Custom' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Custom Position <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={teamMemberForm.customPosition}
                        onChange={(e) => setTeamMemberForm({ ...teamMemberForm, customPosition: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                        placeholder="Enter custom position"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={teamMemberForm.email}
                      onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-sm"
                      placeholder="Enter email"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddTeamMember}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
                  >
                    {editingTeamMemberId ? '✏️ Update Team Member' : '➕ Add Team Member'}
                  </button>
                </div>

                {/* Team Members List */}
                {formData.team.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Added Team Members ({formData.team.length})</p>
                    {formData.team.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                          <p className="text-xs text-gray-600">{member.position}</p>
                          {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button
                            type="button"
                            onClick={() => handleEditTeamMember(member)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeamMember(member.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all ripple"
                >
                  {editingVendor ? 'Update Vendor' : 'Add Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
