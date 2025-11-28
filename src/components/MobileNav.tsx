import React from 'react';

interface MobileNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  role: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, role }) => {
  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['Admin', 'Manager', 'Accountant', 'Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'] },
    { view: 'projects', label: 'Sites', icon: '🏗️', roles: ['Admin', 'Manager', 'Accountant', 'Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'] },
    { view: 'inventory', label: 'Inventory', icon: '📦', roles: ['Admin', 'Manager', 'Civil', 'Electricals', 'Electrical + Civil', 'Supervisor'] },
    { view: 'team', label: 'Team', icon: '👥', roles: ['Admin', 'Manager'] },
    { view: 'vendors', label: 'Vendors', icon: '🏢', roles: ['Admin', 'Manager', 'Accountant'] },
    { view: 'transporter', label: 'Transport', icon: '🚚', roles: ['Admin', 'Manager'] },
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(role));

  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {visibleItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all min-w-[60px] ripple ${
              currentView === item.view
                ? 'text-primary bg-orange-50 scale-105'
                : 'text-gray-600 hover:text-primary hover:bg-gray-50'
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
