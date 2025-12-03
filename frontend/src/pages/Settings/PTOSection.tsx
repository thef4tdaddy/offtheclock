import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { formatHours, parseDuration } from '../../utils/format';

interface PTOCategory {
  id: number;
  name: string;
  accrual_rate: number;
  accrual_frequency: string;
  max_balance?: number;
  start_date: string;
  starting_balance: number;
}

const PTOSection: React.FC = () => {
  const [categories, setCategories] = useState<PTOCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
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
    
    // Parse inputs
    const rate = parseDuration(newCatRate);
    const initial = parseDuration(newCatInitial);
    const max = newCatMax ? parseDuration(newCatMax) : null;

    if (rate === null || initial === null || (newCatMax && max === null)) {
      alert('Please enter valid time formats (e.g. "4h", "1:30", "1.5")');
      return;
    }

    try {
      const payload = {
        name: newCatName,
        accrual_rate: rate,
        accrual_frequency: newCatFreq,
        start_date: new Date(newCatStart).toISOString(),
        starting_balance: initial,
        max_balance: max
      };

      if (editingId) {
        await axios.put(`/api/pto/categories/${editingId}`, payload);
        alert('Category updated successfully!');
      } else {
        await axios.post('/api/pto/categories', payload);
        alert('Category created successfully!');
      }
      
      // Reset form
      setEditingId(null);
      setNewCatName('');
      setNewCatRate('');
      setNewCatInitial('0');
      setNewCatMax('');
      setNewCatStart(new Date().toISOString().split('T')[0]);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${editingId ? 'update' : 'create'} category`);
    }
  };

  const handleEdit = (cat: PTOCategory) => {
    setEditingId(cat.id);
    setNewCatName(cat.name);
    setNewCatRate(formatHours(cat.accrual_rate)); // Pre-fill with formatted string
    setNewCatFreq(cat.accrual_frequency);
    setNewCatStart(cat.start_date.split('T')[0]);
    setNewCatInitial(formatHours(cat.starting_balance));
    setNewCatMax(cat.max_balance ? formatHours(cat.max_balance) : '');
    
    // Scroll to form (optional, might need adjustment in new layout)
    // window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/pto/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setNewCatName('');
        setNewCatRate('');
        setNewCatInitial('0');
        setNewCatMax('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete category');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Create/Edit Category Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-text-main flex items-center gap-2">
          {editingId ? <Edit2 size={24} className="text-secondary" /> : <Plus size={24} className="text-primary" />}
          {editingId ? 'Edit Category' : 'Add New PTO Category'}
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
              <label className="block text-sm font-medium text-text-muted mb-1">Accrual Rate</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatRate}
                onChange={(e) => setNewCatRate(e.target.value)}
                required
                placeholder="e.g. 4h, 1.5, 90m"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">Max Balance (Cap)</label>
              <input 
                type="text" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatMax}
                onChange={(e) => setNewCatMax(e.target.value)}
                placeholder="Optional (e.g. 120h)"
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
                type="text" 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                value={newCatInitial}
                onChange={(e) => setNewCatInitial(e.target.value)}
                placeholder="e.g. 10h 30m"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            {editingId && (
              <button 
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setNewCatName('');
                  setNewCatRate('');
                  setNewCatInitial('0');
                  setNewCatMax('');
                  setNewCatStart(new Date().toISOString().split('T')[0]);
                }}
                className="px-8 py-3 text-text-muted hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              type="submit" 
              className={`px-8 py-3 text-white rounded-xl font-medium shadow-lg transition-all ${
                editingId 
                  ? 'bg-secondary hover:bg-secondary-dark shadow-orange-100' 
                  : 'bg-primary hover:bg-primary-dark shadow-cyan-100'
              }`}
            >
              {editingId ? 'Update Category' : 'Create Category'}
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
                  {formatHours(cat.accrual_rate)} / {cat.accrual_frequency} • Cap: {cat.max_balance || 'None'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleEdit(cat)}
                  className="p-2 text-gray-400 hover:text-secondary transition-colors" 
                  title="Edit Category"
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors" 
                  title="Delete Category"
                >
                  <Trash2 size={20} />
                </button>
              </div>
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

export default PTOSection;
