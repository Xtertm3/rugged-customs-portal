import React, { useState, useMemo } from 'react';
import { Site } from '../App';

interface AddMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (siteId: string, materialName: string, units: number, price: number) => Promise<void>;
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
    const [price, setPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);

    // Calculate total amount
    const totalAmount = useMemo(() => {
        const qty = Number(initialUnits) || 0;
        const priceValue = Number(price) || 0;
        return qty * priceValue;
    }, [initialUnits, price]);

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

        if (!price || isNaN(Number(price)) || Number(price) < 0) {
            setError('Please enter a valid price');
            return;
        }

        try {
            setIsLoading(true);
            await onSubmit(selectedSiteId, selectedMaterialName, Number(initialUnits), Number(price));
            // Reset form
            setSelectedSiteId('');
            setSiteSearchQuery('');
            setSelectedMaterialName('');
            setMaterialSearchQuery('');
            setInitialUnits('');
            setPrice('');
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
        <div className="fixed inset-0 bg-black/50 z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-auto mt-4 p-6">
                <div className="flex items-start justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Add Material to Inventory</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                    {/* Site Selection with Search - 2 cols */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Site</label>
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
                                placeholder="Type site..."
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs"
                            />
                            {showSiteDropdown && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-32 overflow-y-auto z-10">
                                    {filteredSites.length > 0 ? (
                                        filteredSites.map(site => (
                                            <button
                                                key={site.id}
                                                onClick={() => handleSiteSelect(site.id, site.siteName)}
                                                className="w-full text-left px-2 py-1.5 hover:bg-orange-50 text-xs text-gray-700 border-b border-gray-100 last:border-b-0"
                                            >
                                                {site.siteName}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-2 py-1.5 text-xs text-gray-500">No sites</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Material Selection with Search - 2 cols */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Material</label>
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
                                disabled={!selectedSiteId}
                                placeholder={selectedSiteId ? "Type..." : "Site first"}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            {showMaterialDropdown && selectedSiteId && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-32 overflow-y-auto z-10">
                                    {filteredMaterials.length > 0 ? (
                                        filteredMaterials.map(material => (
                                            <button
                                                key={material}
                                                onClick={() => handleMaterialSelect(material)}
                                                className="w-full text-left px-2 py-1.5 hover:bg-orange-50 text-xs text-gray-700 border-b border-gray-100 last:border-b-0"
                                            >
                                                {material}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-2 py-1.5 text-xs text-gray-500">No materials</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quantity - 1.5 cols */}
                    <div className="lg:col-span-1.5">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Qty</label>
                        <input
                            type="number"
                            value={initialUnits}
                            onChange={(e) => setInitialUnits(e.target.value)}
                            disabled={!selectedMaterialName}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Price - 1.5 cols */}
                    <div className="lg:col-span-1.5">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            disabled={!selectedMaterialName}
                            placeholder="0"
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Total Amount Display - 2 cols */}
                    <div className="lg:col-span-2 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-2">
                        <div className="text-xs text-orange-600 font-semibold">Total</div>
                        <div className="text-lg font-bold text-orange-700">₹{totalAmount.toLocaleString()}</div>
                    </div>

                    {/* Action Buttons - 1.5 cols */}
                    <div className="lg:col-span-1.5 flex gap-1.5">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 text-xs"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !selectedSiteId || !selectedMaterialName || !initialUnits || !price}
                            className="flex-1 px-2 py-1.5 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
                        >
                            {isLoading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
