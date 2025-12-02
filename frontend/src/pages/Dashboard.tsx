import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Forecast from '../components/Forecast';
import LogModal from '../components/LogModal';
import { Clock } from 'lucide-react';
import { formatHours } from '../utils/format';

interface PTOCategory {
  id: number;
  name: string;
  accrual_rate: number;
  accrual_frequency: string;
  current_balance: number;
  starting_balance: number;
  max_balance?: number;
}

const CircularProgress: React.FC<{ value: number; max?: number; label: string; subLabel: string }> = ({ value, max = 100, label, subLabel }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const dashoffset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-[160px] h-[160px]">
        <svg width="160" height="160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#E0E0E0"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#00BCD4"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-text-main">{formatHours(value)}</span>
          <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
        </div>
      </div>
      <div className="mt-2 text-sm text-primary font-medium">{subLabel}</div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [categories, setCategories] = useState<PTOCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  
  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/pto/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">My Balances</h2>
          <p className="text-text-muted">Track your time off and accruals</p>
        </div>
        <button 
          onClick={() => setShowLogModal(true)}
          className="bg-secondary hover:bg-secondary-dark text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-orange-100 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Clock size={20} />
          <span>Manage Balance</span>
        </button>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-4 right-4 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              Cap: {cat.max_balance || '∞'}h
            </div>
            <CircularProgress 
              value={cat.current_balance} 
              max={cat.max_balance || 100} 
              label="Balance"
              subLabel={cat.name}
            />
            <div className="mt-4 text-xs text-text-muted text-center">
              Accrues {formatHours(cat.accrual_rate)} / {cat.accrual_frequency}
            </div>
          </div>
        ))}
        
      </div>

      {/* Forecast Section */}
      <Forecast />

      {/* Modals */}
      <LogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
        onSuccess={fetchCategories}
        categories={categories}
      />

    </div>
  );
};

export default Dashboard;
