import React from 'react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  role: string;
  isSubVendor?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, role, isSubVendor = false }) => {
  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Admin', 'Manager', 'Accountant', 'Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'], excludeSubVendor: true },
    { view: 'projects', label: 'Sites', icon: '🏗️', roles: ['Admin', 'Manager', 'Accountant', 'Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'] },
    { view: 'inventory', label: 'Inventory', icon: '📦', roles: ['Admin', 'Manager', 'Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'], excludeSubVendor: true },
    { view: 'team', label: 'Team', icon: '👥', roles: ['Admin', 'Manager'] },
    { view: 'vendors', label: 'Vendors', icon: '🏢', roles: ['Admin', 'Manager', 'Accountant'] },
  { view: 'billingOverview', label: 'Billing', icon: '💰', roles: ['Admin', 'Manager'] },
  { view: 'vendorBillingOverview', label: 'Vendor Billing', icon: '📋', roles: ['Admin', 'Manager', 'Backoffice'] },
    { view: 'transporter', label: 'Transport', icon: '🚚', roles: ['Admin', 'Manager'] },
  ];

  const visibleItems = navItems.filter(item => {
    if (isSubVendor && item.excludeSubVendor) return false;
    return item.roles.includes(role);
  });

  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {visibleItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[60px] ripple ${
              currentView === item.view
                ? 'text-blue-600 bg-blue-50 scale-105'
                : 'text-gray-600 hover:text-blue-600 hover:bg-amber-50'
            }`}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
