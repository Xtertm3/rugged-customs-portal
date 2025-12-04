import React, { useState, useMemo } from 'react';
import { Site } from '../App';

interface AddMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (siteId: string, materialName: string, units: number) => Promise<void>;
    sites: Site[];
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, onSubmit, sites }) => {
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [selectedMaterialName, setSelectedMaterialName] = useState('');
    const [initialUnits, setInitialUnits] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const selectedSite = useMemo(() => {
        return sites.find(s => s.id === selectedSiteId);
    }, [selectedSiteId, sites]);

    const availableMaterials = useMemo(() => {
        if (!selectedSite) return [];
        return selectedSite.initialMaterials || [];
    }, [selectedSite]);

    const handleSubmit = async () => {
        setError('');

        if (!selectedSiteId) {
            setError('Please select a site');
            return;
        }

        if (!selectedMaterialName) {
            setError('Please select a material');
            return;
        }

        if (!initialUnits || isNaN(Number(initialUnits))) {
            setError('Please enter a valid number for units');
            return;
        }

        try {
            setIsLoading(true);
            await onSubmit(selectedSiteId, selectedMaterialName, Number(initialUnits));
            // Reset form
            setSelectedSiteId('');
            setSelectedMaterialName('');
            setInitialUnits('');
            onClose();
        } catch (err) {
            setError('Failed to add material. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Add Material</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Site Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Site</label>
                        <select
                            value={selectedSiteId}
                            onChange={(e) => {
                                setSelectedSiteId(e.target.value);
                                setSelectedMaterialName(''); // Reset material when site changes
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                            <option value="">-- Select a Site --</option>
                            {sites.map(site => (
                                <option key={site.id} value={site.id}>
                                    {site.siteName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Material Selection */}
                    {selectedSite && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Material</label>
                            {availableMaterials.length > 0 ? (
                                <select
                                    value={selectedMaterialName}
                                    onChange={(e) => setSelectedMaterialName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                >
                                    <option value="">-- Select a Material --</option>
                                    {availableMaterials.map(material => (
                                        <option key={material.id} value={material.name}>
                                            {material.name} ({material.units})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                                    No materials predefined for this site
                                </div>
                            )}
                        </div>
                    )}

                    {/* Units Input */}
                    {selectedMaterialName && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Units</label>
                            <input
                                type="number"
                                value={initialUnits}
                                onChange={(e) => setInitialUnits(e.target.value)}
                                placeholder="Enter quantity"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {selectedSite && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Unit: {availableMaterials.find(m => m.name === selectedMaterialName)?.units || '-'}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !selectedSiteId || !selectedMaterialName || !initialUnits}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Adding...' : 'Add Material'}
                    </button>
                </div>
            </div>
        </div>
    );
};
