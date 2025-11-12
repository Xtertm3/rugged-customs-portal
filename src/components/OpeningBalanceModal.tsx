import React, { useState } from 'react';
import { TeamMember } from '../App';
import { PREDEFINED_MATERIALS } from '../constants';

interface OpeningBalanceModalProps {
  isOpen: boolean;
  teamMembers: TeamMember[];
  onClose: () => void;
  onSubmit: (teamId: string, materials: { name: string; openingBalance: number }[]) => Promise<boolean>;
  isLoading?: boolean;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({
  isOpen,
  teamMembers,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [materials, setMaterials] = useState<{ name: string; openingBalance: number }[]>([]);

  const handleAddMaterial = () => {
    setMaterials([...materials, { name: '', openingBalance: 0 }]);
  };

  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: 'name' | 'openingBalance', value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    const team = teamMembers.find(t => t.id === teamId);
    if (team?.assignedMaterials) {
      // Load existing materials for this team (to show what's already assigned)
      const existing = team.assignedMaterials.map(m => ({
        name: m.name,
        openingBalance: Number(m.units || 0),
      }));
      setMaterials(existing);
    } else {
      setMaterials([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      alert('Please select a team');
      return;
    }
    if (materials.length === 0 || materials.some(m => !m.name || m.openingBalance <= 0)) {
      alert('Please add at least one material with a valid opening balance');
      return;
    }
    const ok = await onSubmit(selectedTeamId, materials);
    if (ok) {
      setSelectedTeamId('');
      setMaterials([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Set Opening Balance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Select Team (assign opening balances to a team)</label>
            <select
              value={selectedTeamId}
              onChange={e => {
                handleTeamSelect(e.target.value);
              }}
              className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900"
            >
              <option value="">-- Select Team --</option>
              {teamMembers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>
          </div>

          {selectedTeamId && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm text-text-secondary font-semibold">Materials (showing existing + add new below)</label>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="px-3 py-1 bg-primary text-white rounded text-xs"
                >
                  + Add Material
                </button>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {materials.map((mat, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select
                        value={mat.name}
                        onChange={e => handleMaterialChange(index, 'name', e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 text-sm"
                      >
                        <option value="">-- Select Material --</option>
                        {PREDEFINED_MATERIALS.map(material => (
                          <option key={material} value={material}>
                            {material}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="Balance (m)"
                        value={mat.openingBalance || ''}
                        onChange={e => handleMaterialChange(index, 'openingBalance', Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(index)}
                      className="px-2 py-2 bg-red-600 rounded text-white text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {materials.length === 0 && (
                <p className="text-text-secondary text-sm italic">No materials added yet. Click "Add Material" to get started.</p>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              {isLoading ? 'Saving...' : 'Save Opening Balance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
