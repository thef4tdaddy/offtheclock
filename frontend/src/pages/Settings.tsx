import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';

interface PTOCategory {
  id: number;
  name: string;
  accrual_rate: number;
  accrual_frequency: string;
  max_balance?: number;
}

const Settings: React.FC = () => {
  const [categories, setCategories] = useState<PTOCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatRate, setNewCatRate] = useState('');
  const [newCatFreq, setNewCatFreq] = useState('biweekly');
  const [newCatStart, setNewCatStart] = useState(new Date().toISOString().split('T')[0]);
  const [newCatInitial, setNewCatInitial] = useState('0');
  const [newCatMax, setNewCatMax] = useState('');

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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/pto/categories', {
        name: newCatName,
        accrual_rate: parseFloat(newCatRate),
        accrual_frequency: newCatFreq,
        start_date: new Date(newCatStart).toISOString(),
        starting_balance: parseFloat(newCatInitial),
        max_balance: newCatMax ? parseFloat(newCatMax) : null
      });
      
      // Reset form
      setNewCatName('');
      setNewCatRate('');
      setNewCatInitial('0');
      setNewCatMax('');
      fetchCategories();
      alert('Category created successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to create category');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-text-main">Settings</h1>

      {/* Create Category Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-text-main flex items-center gap-2">
          <Plus size={24} className="text-primary" />
          Add New PTO Category
        </h2>
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Name</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                required
                placeholder="e.g. Sabbatical"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Frequency</label>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatFreq}
                onChange={(e) => setNewCatFreq(e.target.value)}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Accrual Rate (Hours)</label>
              <input 
                type="number" 
                step="0.01"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatRate}
                onChange={(e) => setNewCatRate(e.target.value)}
                required
                placeholder="e.g. 4.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Max Balance (Cap)</label>
              <input 
                type="number" 
                step="0.5"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatMax}
                onChange={(e) => setNewCatMax(e.target.value)}
                placeholder="Optional (e.g. 120)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Start Date</label>
              <input 
                type="date" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatStart}
                onChange={(e) => setNewCatStart(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Initial Balance</label>
              <input 
                type="number" 
                step="0.5"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatInitial}
                onChange={(e) => setNewCatInitial(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary-dark font-medium shadow-lg shadow-cyan-100 transition-all"
            >
              Create Category
            </button>
          </div>
        </form>
      </div>

      {/* Existing Categories List */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-text-main">Existing Categories</h2>
        <div className="space-y-4">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <h3 className="font-bold text-text-main">{cat.name}</h3>
                <p className="text-sm text-text-muted">
                  {cat.accrual_rate}h / {cat.accrual_frequency} • Cap: {cat.max_balance || 'None'}
                </p>
              </div>
              {/* Placeholder for delete/edit actions */}
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Delete (Coming Soon)">
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-text-muted text-center py-4">No categories found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
