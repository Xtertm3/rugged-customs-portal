import React, { useState, useMemo } from 'react';
import { Site } from '../App';

interface AddMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (siteId: string, materialName: string, units: number) => Promise<void>;
    sites: Site[];
}

// Predefined materials list
const PREDEFINED_MATERIALS = [
    '95 Sq MM Black',
    '95 Sq MM Red',
    '70 Sq MM Black',
    '70 Sq MM Red',
    '50 Sq MM Black',
    '50 Sq MM Red',
    '35 Sq MM Black',
    '35 Sq MM Red',
    '16 Sq MM Green',
    '4 Sq MM 2Core Copper',
    '6 Sq MM 2 Core Copper',
    '16 Sq MM 2 Core Copper',
    '2.5 Sq MM 2 Core Copper',
    '0.5 Alaram Cable',
    '35 Sq MM 2 Core Copper',
    'GI Strip',
    'HDPE Pipe',
    '25 MM Flexible',
    '40 MM Flexible',
    '10 Pair Alaram Cable',
];

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ isOpen, onClose, onSubmit, sites }) => {
    const [selectedSiteId, setSelectedSiteId] = useState('');
    const [siteSearchQuery, setSiteSearchQuery] = useState('');
    const [selectedMaterialName, setSelectedMaterialName] = useState('');
    const [materialSearchQuery, setMaterialSearchQuery] = useState('');
    const [initialUnits, setInitialUnits] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

    const filteredSites = useMemo(() => {
        if (!siteSearchQuery) return sites;
        return sites.filter(site =>
            site.siteName.toLowerCase().startsWith(siteSearchQuery.toLowerCase())
        );
    }, [siteSearchQuery, sites]);

    const filteredMaterials = useMemo(() => {
        if (!materialSearchQuery) return PREDEFINED_MATERIALS;
        return PREDEFINED_MATERIALS.filter(material =>
            material.toLowerCase().startsWith(materialSearchQuery.toLowerCase())
        );
    }, [materialSearchQuery]);

    const handleSiteSelect = (siteId: string, siteName: string) => {
        setSelectedSiteId(siteId);
        setSiteSearchQuery(siteName);
        setShowSiteDropdown(false);
        setSelectedMaterialName('');
        setMaterialSearchQuery('');
    };

    const handleMaterialSelect = (materialName: string) => {
        setSelectedMaterialName(materialName);
        setMaterialSearchQuery(materialName);
        setShowMaterialDropdown(false);
    };

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

        if (!initialUnits || isNaN(Number(initialUnits)) || Number(initialUnits) <= 0) {
            setError('Please enter a valid number for units');
            return;
        }

        try {
            setIsLoading(true);
            await onSubmit(selectedSiteId, selectedMaterialName, Number(initialUnits));
            // Reset form
            setSelectedSiteId('');
            setSiteSearchQuery('');
            setSelectedMaterialName('');
            setMaterialSearchQuery('');
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">Add Material to Inventory</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Site Selection with Search */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Site (Start typing...)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={siteSearchQuery}
                                onChange={(e) => {
                                    setSiteSearchQuery(e.target.value);
                                    setShowSiteDropdown(true);
                                    setSelectedSiteId('');
                                }}
                                onFocus={() => setShowSiteDropdown(true)}
                                placeholder="Type site name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {showSiteDropdown && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                                    {filteredSites.length > 0 ? (
                                        filteredSites.map(site => (
                                            <button
                                                key={site.id}
                                                onClick={() => handleSiteSelect(site.id, site.siteName)}
                                                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                                            >
                                                {site.siteName}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-sm text-gray-500">No sites found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Material Selection with Search */}
                    {selectedSiteId && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Select Material (Start typing...)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={materialSearchQuery}
                                    onChange={(e) => {
                                        setMaterialSearchQuery(e.target.value);
                                        setShowMaterialDropdown(true);
                                        setSelectedMaterialName('');
                                    }}
                                    onFocus={() => setShowMaterialDropdown(true)}
                                    placeholder="Type material name..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                {showMaterialDropdown && (
                                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                                        {filteredMaterials.length > 0 ? (
                                            filteredMaterials.map(material => (
                                                <button
                                                    key={material}
                                                    onClick={() => handleMaterialSelect(material)}
                                                    className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                                                >
                                                    {material}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-gray-500">No materials found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Units Input */}
                    {selectedMaterialName && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Units / Quantity</label>
                            <input
                                type="number"
                                value={initialUnits}
                                onChange={(e) => setInitialUnits(e.target.value)}
                                placeholder="Enter quantity"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
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
