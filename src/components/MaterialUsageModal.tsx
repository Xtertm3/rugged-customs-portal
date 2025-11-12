import React, { useState, useMemo } from 'react';
import { Site, TeamMember } from '../App';
import { PREDEFINED_MATERIALS } from '../constants';

interface MaterialUsageModalProps {
  isOpen: boolean;
  sites: Site[];
  currentUser: TeamMember | null;
  onClose: () => void;
  onSubmit: (siteId: string, materialName: string, quantityUsed: number, notes?: string) => Promise<boolean>;
  isLoading?: boolean;
}

export const MaterialUsageModal: React.FC<MaterialUsageModalProps> = ({ isOpen, sites, currentUser, onClose, onSubmit, isLoading=false }) => {
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedMaterialName, setSelectedMaterialName] = useState<string>('');
  const [quantityUsed, setQuantityUsed] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const managedSites = useMemo(() => sites, [sites]);

  // Show ALL predefined materials
  // Materials with opening balance set show availability
  // Materials without opening balance show name only
  const allMaterials = useMemo(() => {
    const assignedMap = new Map((currentUser?.assignedMaterials || []).map(m => [m.name, m]));
    
    return PREDEFINED_MATERIALS.map(materialName => {
      const assigned = assignedMap.get(materialName);
      if (assigned) {
        const available = Math.max(0, Number(assigned.units || 0) - Number(assigned.used || 0));
        return {
          id: assigned.id,
          name: materialName,
          hasBalance: true,
          available,
          displayName: `${materialName} (Available: ${available}m)`,
        };
      }
      return {
        id: materialName,
        name: materialName,
        hasBalance: false,
        available: 0,
        displayName: materialName,
      };
    });
  }, [currentUser?.assignedMaterials]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSiteId || !selectedMaterialName || !quantityUsed) {
      alert('Please select site, material and quantity');
      return;
    }
    const qty = Number(quantityUsed);
    if (isNaN(qty) || qty <= 0) { alert('Enter valid quantity'); return; }
    const ok = await onSubmit(selectedSiteId, selectedMaterialName, qty, notes);
    if (ok) {
      setSelectedSiteId(''); setSelectedMaterialName(''); setQuantityUsed(''); setNotes('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold text-text-primary mb-4">Log Material Usage</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Select Site</label>
            <select value={selectedSiteId} onChange={e => { setSelectedSiteId(e.target.value); setSelectedMaterialName(''); }} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-text-primary">
              <option value="">-- Select Site --</option>
              {managedSites.map(s => <option key={s.id} value={s.id}>{s.siteName}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Select Material</label>
            <select value={selectedMaterialName} onChange={e => setSelectedMaterialName(e.target.value)} disabled={!selectedSiteId} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-text-primary">
              <option value="">-- Select Material --</option>
              {allMaterials.map(m => <option key={m.id} value={m.name}>{m.displayName}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Quantity Used (m)</label>
            <input type="number" step="0.1" min="0" value={quantityUsed} onChange={e => setQuantityUsed(e.target.value)} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-text-primary" />
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-2">Notes (optional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full bg-zinc-700/50 border border-zinc-600 rounded-lg py-2 px-3 text-text-primary"></textarea>
          </div>

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-zinc-700 rounded text-text-secondary">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-primary text-white rounded">{isLoading ? 'Logging...' : 'Log Usage'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
