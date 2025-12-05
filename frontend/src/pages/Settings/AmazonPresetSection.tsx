import React, { useState } from 'react';
import { Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApplyAmazonPresetMutation } from '../../hooks/api/usePTOMutation';
import Button from '../../components/common/Button';

const AmazonPresetSection: React.FC = () => {
  // Use strings for inputs to allow empty state and better typing experience
  const [tenure, setTenure] = useState('0');
  const [shiftLength, setShiftLength] = useState('10');
  const [shiftsPerWeek, setShiftsPerWeek] = useState('4');

  // Balances can be "5h22m" or numbers
  const [currentUpt, setCurrentUpt] = useState('');
  const [currentFlex, setCurrentFlex] = useState('');
  const [currentStd, setCurrentStd] = useState('');

  // Helper to parse "5h22m", "5.5", "5:30" etc into decimal hours
  const parseDuration = (input: string): number | undefined => {
    if (!input || input.trim() === '') return undefined;

    const text = input.toLowerCase().trim();

    // Try "5h 22m" or "5h22m" format
    if (text.includes('h') || text.includes('m')) {
      let hours = 0;
      let minutes = 0;

      const hMatch = text.match(/(\d+(\.\d+)?)h/);
      if (hMatch) hours = parseFloat(hMatch[1]);

      const mMatch = text.match(/(\d+(\.\d+)?)m/);
      if (mMatch) minutes = parseFloat(mMatch[1]);

      return hours + minutes / 60;
    }

    // Try "5:30" format
    if (text.includes(':')) {
      const parts = text.split(':');
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1] || '0');
      return hours + minutes / 60;
    }

    // Default to simple number
    const num = parseFloat(text);
    return isNaN(num) ? undefined : num;
  };

  const { mutate: applyPreset, isPending: isSubmitting } = useApplyAmazonPresetMutation();

  const handleLoadPresets = () => {
    if (!confirm('This will add Amazon default PTO categories to your account. Continue?')) return;

    applyPreset(
      {
        tenure_years: parseFloat(tenure) || 0,
        shift_length: parseFloat(shiftLength) || 0,
        shifts_per_week: parseFloat(shiftsPerWeek) || 0,
        current_upt: parseDuration(currentUpt),
        current_flex: parseDuration(currentFlex),
        current_std: parseDuration(currentStd),
      },
      {
        onSuccess: () => {
          alert('Amazon PTO presets loaded successfully!');
          window.location.reload();
        },
        onError: () => alert('Failed to load presets. Please try again.'),
      },
    );
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6 text-text-main flex items-center gap-2">
        <Package size={24} className="text-primary" />
        Amazon PTO Presets
      </h2>

      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-accent shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-bold text-accent text-sm">Quick Setup</h3>
          <p className="text-sm text-accent/80 mt-1">
            Automatically configure your account with standard Amazon policies:
          </p>
          <ul className="text-sm text-accent/80 list-disc list-inside mt-1 ml-1 space-y-1">
            <li>
              <strong>UPT</strong>: 80h Cap (Calculated based on your shift)
            </li>
            <li>
              <strong>Flex PTO</strong>: 48h Cap, 1.85h/week
            </li>
            <li>
              <strong>Standard PTO</strong>: Accrual based on your tenure
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Years of Service</label>
          <input
            type="number"
            min="0"
            max="50"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={tenure}
            onChange={(e) => setTenure(e.target.value)}
          />
          <p className="text-xs text-text-muted mt-1">Determines Vacation accrual rate.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Shift Length (Hours)
          </label>
          <input
            type="number"
            min="1"
            max="24"
            step="0.5"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={shiftLength}
            onChange={(e) => setShiftLength(e.target.value)}
          />
          <p className="text-xs text-text-muted mt-1">Used for UPT calculation.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Shifts per Week</label>
          <input
            type="number"
            min="1"
            max="7"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={shiftsPerWeek}
            onChange={(e) => setShiftsPerWeek(e.target.value)}
          />
        </div>

        {/* Current Balances */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Current UPT Balance
          </label>
          <input
            type="text"
            placeholder="e.g. 10 or 5h22m"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={currentUpt}
            onChange={(e) => setCurrentUpt(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Current Flex Balance
          </label>
          <input
            type="text"
            placeholder="e.g. 10 or 5h22m"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={currentFlex}
            onChange={(e) => setCurrentFlex(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">
            Current Vacation Balance
          </label>
          <input
            type="text"
            placeholder="e.g. 40 or 5h22m"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={currentStd}
            onChange={(e) => setCurrentStd(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleLoadPresets}
          isLoading={isSubmitting}
          variant="primary"
          className="px-8 shadow-lg shadow-orange-100"
        >
          {!isSubmitting && 'Load Amazon Defaults'}
          {!isSubmitting && <CheckCircle size={20} className="ml-2" />}
          {isSubmitting && 'Loading...'}
        </Button>
      </div>
    </div>
  );
};

export default AmazonPresetSection;
