import React from 'react';
import { BillingOverview, PaymentRequest } from '../App';

interface BillingOverviewCardProps {
  billings: BillingOverview[];
  paymentRequests?: PaymentRequest[];
}

export const BillingOverviewCard: React.FC<BillingOverviewCardProps> = ({ billings, paymentRequests = [] }) => {
  const stats = React.useMemo(() => {
    const totalQuoted = billings.reduce((sum, b) => sum + b.quotationAmount, 0);
    const totalYetToBill = billings.reduce((sum, b) => sum + b.yetToBillAmount, 0);
    
    // Calculate actual billing from paid payment requests
    const totalActualBilling = paymentRequests
      .filter(req => req.status === 'Paid')
      .reduce((sum, req) => sum + (Number(req.amount) || 0), 0);
    
    const totalExpense = billings.reduce((sum, b) => sum + b.expense, 0);
    const totalProfit = totalActualBilling - totalExpense;

    return {
      totalQuoted,
      totalYetToBill,
      totalActualBilling,
      totalExpense,
      totalProfit
    };
  }, [billings, paymentRequests]);

  const StatCard = ({ title, value, color, icon }: { title: string; value: number; color: string; icon: string }) => (
    <div className={`glass rounded-xl p-4 ${color} border-l-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium mb-1">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800">
            ₹{value.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="text-3xl opacity-50">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="glass rounded-2xl p-6 mb-6 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          💰 Billing Overview
        </h2>
        <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
          {billings.length} Sites
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Quoted"
          value={stats.totalQuoted}
          color="border-blue-500"
          icon="📋"
        />
        <StatCard
          title="Yet To Bill"
          value={stats.totalYetToBill}
          color="border-yellow-500"
          icon="⏳"
        />
        <StatCard
          title="Actual Billing"
          value={stats.totalActualBilling}
          color="border-green-500"
          icon="✅"
        />
        <StatCard
          title="Total Expense"
          value={stats.totalExpense}
          color="border-red-500"
          icon="💸"
        />
        <StatCard
          title="Total Profit"
          value={stats.totalProfit}
          color={`border-${stats.totalProfit >= 0 ? 'emerald' : 'red'}-500`}
          icon={stats.totalProfit >= 0 ? '📈' : '📉'}
        />
      </div>

      {stats.totalProfit < 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ Alert: Overall billing is showing a loss of ₹{Math.abs(stats.totalProfit).toLocaleString('en-IN')}
          </p>
        </div>
      )}
    </div>
  );
};
