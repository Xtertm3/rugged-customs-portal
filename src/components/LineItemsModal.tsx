import React, { useState, useMemo } from 'react';
import { VendorBillingLineItem, Site } from '../App';

interface LineItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site;
  onSubmit: (lineItems: VendorBillingLineItem[], sendEmail: boolean) => void;
}

const PREDEFINED_ITEMS = [
  {
    category: 'Tree Cutting' as const,
    itemCode: '2D-500000-C-00-ZZ-ZZ-A01',
    description: 'Uprooting of trees/Tree Cutting Charges (As per Indus Standards and Guidelines) - Capex',
    defaultRate: 1000
  },
  {
    category: 'Dewatering' as const,
    itemCode: '2D-500001-C-00-ZZ-ZZ-A02',
    description: 'Dewatering charges for site preparation - Capex',
    defaultRate: 1500
  },
  {
    category: 'HardRock Excavation' as const,
    itemCode: '2D-500002-C-00-ZZ-ZZ-A03',
    description: 'Hard Rock Excavation charges - Capex',
    defaultRate: 2000
  },
  {
    category: 'Head Loading' as const,
    itemCode: '2D-500003-C-00-ZZ-ZZ-A04',
    description: 'Head Loading charges for material handling - Capex',
    defaultRate: 500
  },
  {
    category: 'Crane Charges' as const,
    itemCode: '2D-500004-C-00-ZZ-ZZ-A05',
    description: 'Crane rental and operation charges - Capex',
    defaultRate: 3000
  }
];

export const LineItemsModal: React.FC<LineItemsModalProps> = ({ isOpen, onClose, site, onSubmit }) => {
  const [selectedItems, setSelectedItems] = useState<Map<string, { quantity: number; rate: number; customDescription?: string }>>(new Map());
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({
    itemCode: '',
    description: '',
    quantity: 0,
    rate: 0
  });

  const handleToggleItem = (category: string, defaultRate: number) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.set(category, { quantity: 1, rate: defaultRate });
    }
    setSelectedItems(newSelected);
  };

  const handleUpdateQuantity = (category: string, quantity: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(category);
    if (item) {
      item.quantity = quantity;
      newSelected.set(category, item);
      setSelectedItems(newSelected);
    }
  };

  const handleUpdateRate = (category: string, rate: number) => {
    const newSelected = new Map(selectedItems);
    const item = newSelected.get(category);
    if (item) {
      item.rate = rate;
      newSelected.set(category, item);
      setSelectedItems(newSelected);
    }
  };

  const handleAddCustomItem = () => {
    if (customItem.description && customItem.quantity > 0 && customItem.rate > 0) {
      const newSelected = new Map(selectedItems);
      const customKey = `custom_${Date.now()}`;
      newSelected.set(customKey, {
        quantity: customItem.quantity,
        rate: customItem.rate,
        customDescription: customItem.description
      });
      setSelectedItems(newSelected);
      setCustomItem({ itemCode: '', description: '', quantity: 0, rate: 0 });
      setShowCustomItem(false);
    }
  };

  const lineItemsArray = useMemo(() => {
    const items: VendorBillingLineItem[] = [];
    
    selectedItems.forEach((data, key) => {
      if (key.startsWith('custom_')) {
        items.push({
          id: key,
          itemCode: customItem.itemCode || 'CUSTOM-001',
          category: 'Custom',
          description: data.customDescription || '',
          quantity: data.quantity,
          rate: data.rate,
          total: data.quantity * data.rate
        });
      } else {
        const predefined = PREDEFINED_ITEMS.find(item => item.category === key);
        if (predefined) {
          items.push({
            id: `${predefined.category}_${Date.now()}`,
            itemCode: predefined.itemCode,
            category: predefined.category,
            description: predefined.description,
            quantity: data.quantity,
            rate: data.rate,
            total: data.quantity * data.rate
          });
        }
      }
    });
    
    return items;
  }, [selectedItems, customItem.itemCode]);

  const grandTotal = useMemo(() => {
    return lineItemsArray.reduce((sum, item) => sum + item.total, 0);
  }, [lineItemsArray]);

  const handleSubmit = (sendEmail: boolean) => {
    if (lineItemsArray.length === 0) {
      alert('Please select at least one line item');
      return;
    }
    onSubmit(lineItemsArray, sendEmail);
    setSelectedItems(new Map());
    setCustomItem({ itemCode: '', description: '', quantity: 0, rate: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl">
          <h3 className="text-2xl font-bold">📋 Add Line Items - {site.siteName}</h3>
          <p className="text-sm text-green-100 mt-1">Select items and enter quantities for approval request</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Site Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Site ID:</span>
                <span className="ml-2 text-gray-900">{site.id || 'N/A'}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Site Name:</span>
                <span className="ml-2 text-gray-900">{site.siteName}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Client:</span>
                <span className="ml-2 text-gray-900">{site.vendorName || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Predefined Items */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Predefined Line Items</h4>
            <div className="space-y-3">
              {PREDEFINED_ITEMS.map((item) => {
                const isSelected = selectedItems.has(item.category);
                const itemData = selectedItems.get(item.category);

                return (
                  <div
                    key={item.category}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.category, item.defaultRate)}
                        className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{item.category}</div>
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                        <div className="text-xs text-gray-500 mt-1">Item Code: {item.itemCode}</div>

                        {isSelected && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="0"
                                value={itemData?.quantity || 0}
                                onChange={(e) => handleUpdateQuantity(item.category, parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={itemData?.rate || 0}
                                onChange={(e) => handleUpdateRate(item.category, parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Total</label>
                              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-green-600">
                                ₹{((itemData?.quantity || 0) * (itemData?.rate || 0)).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Item Section */}
          <div className="border-t pt-4">
            {!showCustomItem ? (
              <button
                onClick={() => setShowCustomItem(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                ➕ Add Custom Line Item
              </button>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h5 className="font-semibold text-gray-800">Custom Line Item</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <input
                      type="text"
                      value={customItem.description}
                      onChange={(e) => setCustomItem({ ...customItem, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter custom item description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      min="0"
                      value={customItem.quantity}
                      onChange={(e) => setCustomItem({ ...customItem, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customItem.rate}
                      onChange={(e) => setCustomItem({ ...customItem, rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddCustomItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    Add Item
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomItem(false);
                      setCustomItem({ itemCode: '', description: '', quantity: 0, rate: 0 });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {lineItemsArray.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">Summary</h4>
              <div className="space-y-2 text-sm">
                {lineItemsArray.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {item.category}: {item.quantity} × ₹{item.rate.toLocaleString()}
                    </span>
                    <span className="font-semibold text-green-700">₹{item.total.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t-2 border-green-300 pt-2 mt-2 flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Grand Total:</span>
                  <span className="text-2xl font-bold text-green-700">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-blue-600 transition-all"
              disabled={lineItemsArray.length === 0}
            >
              Save (No Email)
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              disabled={lineItemsArray.length === 0}
            >
              📧 Save & Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
