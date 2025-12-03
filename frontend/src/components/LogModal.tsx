import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import { parseDuration } from '../utils/format';

interface PTOCategory {
  id: number;
  name: string;
}

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
  categories: PTOCategory[];
}

const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSuccess, initialDate, categories }) => {
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isUsage, setIsUsage] = useState(true); // Toggle between Usage (negative) and Adjustment (positive)

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setAmount('');
      setNote('');
      setIsUsage(true);
      if (categories.length > 0 && !categoryId) {
        setCategoryId(categories[0].id.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialDate, categories]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const duration = parseDuration(amount);
    if (duration === null) {
      alert('Please enter a valid duration (e.g. "8h", "1:30", "4.5")');
      return;
    }

    // If it's usage, make it negative. If adjustment, keep positive.
    const finalAmount = isUsage ? -Math.abs(duration) : Math.abs(duration);

    try {
      await axios.post('/api/pto/log', {
        category_id: parseInt(categoryId),
        date: new Date(date).toISOString(),
        amount: finalAmount,
        note
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to log PTO');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md relative shadow-2xl animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-text-main">Log Time Off</h2>
        
        <form onSubmit={handleLogSubmit} className="space-y-6">
          {/* Toggle Type */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setIsUsage(true)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                isUsage ? 'bg-white text-primary shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Log Usage (-)
            </button>
            <button
              type="button"
              onClick={() => setIsUsage(false)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                !isUsage ? 'bg-white text-secondary shadow-sm' : 'text-text-muted hover:text-text-main'
              }`}
            >
              Adjustment (+)
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Category</label>
            <select 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Date</label>
            <input 
              type="date" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Duration</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="e.g. 8h, 4h 30m, 1:30"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">Note (Optional)</label>
            <input 
              type="text" 
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Doctor's appointment"
            />
          </div>

          <button 
            type="submit" 
            className={`w-full py-3 text-white rounded-xl font-medium shadow-lg transition-all ${
              isUsage 
                ? 'bg-primary hover:bg-primary-dark shadow-cyan-100' 
                : 'bg-secondary hover:bg-secondary-dark shadow-orange-100'
            }`}
          >
            {isUsage ? 'Log Time Off' : 'Add Adjustment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogModal;
