import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { formatHours, parseDuration } from '../../utils/format';
import { usePTOCategories } from '../../hooks/api/usePTO';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../hooks/api/usePTOMutation';
import { type PTOCategory } from '../../domain/schemas/pto';

const PTOSection: React.FC = () => {
  const { data: categories = [], isLoading } = usePTOCategories();
  const { mutate: createCategory } = useCreateCategoryMutation();
  const { mutate: updateCategory } = useUpdateCategoryMutation();
  const { mutate: deleteCategory } = useDeleteCategoryMutation();

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatRate, setNewCatRate] = useState('');
  const [newCatFreq, setNewCatFreq] = useState('biweekly');
  const [newCatStart, setNewCatStart] = useState(new Date().toISOString().split('T')[0]);
  const [newCatInitial, setNewCatInitial] = useState('0');
  const [newCatMax, setNewCatMax] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse inputs
    const rate = parseDuration(newCatRate);
    const initial = parseDuration(newCatInitial);
    const max = newCatMax ? parseDuration(newCatMax) : null;

    if (rate === null || initial === null || (newCatMax && max === null)) {
      alert('Please enter valid time formats (e.g. "4h", "1:30", "1.5")');
      return;
    }

    const payload = {
      name: newCatName,
      accrual_rate: rate,
      accrual_frequency: newCatFreq,
      start_date: new Date(newCatStart).toISOString(),
      starting_balance: initial,
      max_balance: max,
    };

    const options = {
      onSuccess: () => {
        alert(editingId ? 'Category updated successfully!' : 'Category created successfully!');
        resetForm();
      },
      onError: () => alert(`Failed to ${editingId ? 'update' : 'create'} category`),
    };

    if (editingId) {
      updateCategory({ id: editingId, payload }, options);
    } else {
      createCategory(payload, options);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setNewCatName('');
    setNewCatRate('');
    setNewCatInitial('0');
    setNewCatMax('');
    setNewCatStart(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (cat: PTOCategory) => {
    setEditingId(cat.id);
    setNewCatName(cat.name);
    setNewCatRate(formatHours(cat.accrual_rate)); // Pre-fill with formatted string
    setNewCatFreq(cat.accrual_frequency);
    setNewCatStart(cat.start_date.split('T')[0]);
    setNewCatInitial(formatHours(cat.starting_balance));
    setNewCatMax(cat.max_balance ? formatHours(cat.max_balance) : '');
  };

  const handleDelete = (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.'))
      return;

    deleteCategory(id, {
      onSuccess: () => {
        if (editingId === id) resetForm();
      },
      onError: () => alert('Failed to delete category'),
    });
  };

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Create/Edit Category Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 text-text-main flex items-center gap-2">
          {editingId ? (
            <Edit2 size={24} className="text-secondary" />
          ) : (
            <Plus size={24} className="text-primary" />
          )}
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
              <label className="block text-sm font-medium text-text-muted mb-1">
                Max Balance (Cap)
              </label>
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
              <label className="block text-sm font-medium text-text-muted mb-1">
                Initial Balance
              </label>
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
                onClick={resetForm}
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
            <div
              key={cat.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <div>
                <h3 className="font-bold text-text-main">{cat.name}</h3>
                <p className="text-sm text-text-muted">
                  {formatHours(cat.accrual_rate)} / {cat.accrual_frequency} • Cap:{' '}
                  {cat.max_balance || 'None'}
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
