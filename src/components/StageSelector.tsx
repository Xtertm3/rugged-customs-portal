import React from 'react';

interface StageSelectorProps {
  value: 'c1' | 'c2' | 'c1_c2_combined' | 'electrical';
  onChange: (stage: 'c1' | 'c2' | 'c1_c2_combined' | 'electrical') => void;
  disabled?: boolean;
}

export const StageSelector: React.FC<StageSelectorProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="flex gap-2 items-center">
      {['c1', 'c2', 'c1_c2_combined', 'electrical'].map(stage => (
        <button
          key={stage}
          type="button"
          disabled={disabled}
          className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
            value === stage
              ? 'bg-blue-600 text-white border-blue-700'
              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'
          }`}
          onClick={() => onChange(stage as any)}
        >
          {stage === 'c1' ? 'C1' : stage === 'c2' ? 'C2' : stage === 'c1_c2_combined' ? 'C1+C2' : 'Electrical'}
        </button>
      ))}
    </div>
  );
};
