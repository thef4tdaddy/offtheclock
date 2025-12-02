import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Forecast from '../components/Forecast';
import { Clock } from 'lucide-react';

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
          <span className="text-3xl font-bold text-text-main">{value.toFixed(0)}</span>
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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Log Form State
  const [logAmount, setLogAmount] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNote, setLogNote] = useState('');
  const [logType, setLogType] = useState<'usage' | 'adjustment'>('usage');

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

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    try {
      const amount = parseFloat(logAmount);
      const finalAmount = logType === 'usage' ? -amount : amount;

      await axios.post('/api/pto/log', {
        category_id: selectedCategory,
        date: new Date(logDate).toISOString(),
        amount: finalAmount,
        note: logNote
      });
      setShowLogModal(false);
      setLogAmount('');
      setLogNote('');
      setLogType('usage');
      fetchCategories(); // Refresh balances
    } catch (err) {
      console.error(err);
      alert('Failed to log activity');
    }
  };

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
              label="Hours"
              subLabel={cat.name}
            />
            <div className="mt-4 text-xs text-text-muted text-center">
              Accrues {cat.accrual_rate}h / {cat.accrual_frequency}
            </div>
          </div>
        ))}
        
      </div>

      {/* Forecast Section */}
      <Forecast />

      {/* Modals */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-text-main">Manage Balance</h2>
            <form onSubmit={handleLogSubmit}>
              <div className="space-y-4">
                {/* Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLogType('usage')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      logType === 'usage' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Use Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogType('adjustment')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                      logType === 'adjustment' 
                        ? 'bg-white text-secondary shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Add / Adjust
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
                  <select 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={selectedCategory || ''}
                    onChange={(e) => setSelectedCategory(Number(e.target.value))}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Date</label>
                  <input 
                    type="date" 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    {logType === 'usage' ? 'Hours Used' : 'Hours to Add'}
                  </label>
                  <input 
                    type="number" 
                    step="0.5"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={logAmount}
                    onChange={(e) => setLogAmount(e.target.value)}
                    required
                    placeholder="e.g. 8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Note</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder={logType === 'usage' ? "e.g. Doctor's appointment" : "e.g. Worked extra shift"}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button" 
                  onClick={() => setShowLogModal(false)}
                  className="px-6 py-3 text-text-muted hover:bg-gray-50 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`px-6 py-3 text-white rounded-xl font-medium shadow-lg transition-all ${
                    logType === 'usage' 
                      ? 'bg-primary hover:bg-primary-dark shadow-cyan-100' 
                      : 'bg-secondary hover:bg-secondary-dark shadow-orange-100'
                  }`}
                >
                  {logType === 'usage' ? 'Log Time Off' : 'Add Hours'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
