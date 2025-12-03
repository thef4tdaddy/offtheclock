import React, { useState } from 'react';
import axios from 'axios';
import { Package, CheckCircle, AlertTriangle } from 'lucide-react';

const AmazonPresetSection: React.FC = () => {
  const [tenure, setTenure] = useState(0);
  const [shiftLength, setShiftLength] = useState(10);
  const [shiftsPerWeek, setShiftsPerWeek] = useState(4);
  const [currentUpt, setCurrentUpt] = useState('');
  const [currentFlex, setCurrentFlex] = useState('');
  const [currentStd, setCurrentStd] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoadPresets = async () => {
    if (!confirm('This will add Amazon default PTO categories to your account. Continue?')) return;
    
    setLoading(true);
    try {
      await axios.post('/api/pto/presets/amazon', {
        tenure_years: Number(tenure),
        shift_length: Number(shiftLength),
        shifts_per_week: Number(shiftsPerWeek),
        current_upt: currentUpt ? Number(currentUpt) : undefined,
        current_flex: currentFlex ? Number(currentFlex) : undefined,
        current_std: currentStd ? Number(currentStd) : undefined
      });
      alert('Amazon PTO presets loaded successfully!');
      // Reload to show new categories
      window.location.reload();
    } catch (err) {
      console.error('Failed to load presets', err);
      alert('Failed to load presets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold mb-6 text-text-main flex items-center gap-2">
        <Package size={24} className="text-orange-500" />
        Amazon PTO Presets
      </h2>
      
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="font-bold text-orange-800 text-sm">Quick Setup</h3>
          <p className="text-sm text-orange-700 mt-1">
            Automatically configure your account with standard Amazon policies:
          </p>
          <ul className="text-sm text-orange-700 list-disc list-inside mt-1 ml-1 space-y-1">
            <li><strong>UPT</strong>: 80h Cap (Calculated based on your shift)</li>
            <li><strong>Flexible PTO</strong>: 48h Cap, 1.85h/week</li>
            <li><strong>Standard PTO</strong>: Accrual based on your tenure</li>
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
            onChange={(e) => setTenure(Number(e.target.value))}
          />
          <p className="text-xs text-text-muted mt-1">Determines Vacation accrual rate.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Shift Length (Hours)</label>
          <input 
            type="number" 
            min="1"
            max="24"
            step="0.5"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={shiftLength}
            onChange={(e) => setShiftLength(Number(e.target.value))}
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
            onChange={(e) => setShiftsPerWeek(Number(e.target.value))}
          />
        </div>
        
        {/* Current Balances */}
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Current UPT Balance</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="Optional (e.g. 10)"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={currentUpt}
            onChange={(e) => setCurrentUpt(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Current Flex Balance</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="Optional (e.g. 10)"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={currentFlex}
            onChange={(e) => setCurrentFlex(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1">Current Vacation Balance</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="Optional (e.g. 40)"
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={currentStd}
            onChange={(e) => setCurrentStd(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleLoadPresets}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium shadow-lg shadow-orange-100 transition-all disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load Amazon Defaults'}
          {!loading && <CheckCircle size={20} />}
        </button>
      </div>
    </div>
  );
};

export default AmazonPresetSection;
