import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Filter, Calendar, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface PTOLog {
  id: number;
  category_id: number;
  date: string;
  amount: number;
  note?: string;
  created_at: string;
}

interface PTOCategory {
  id: number;
  name: string;
}

const HistoryPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: logs, isLoading: logsLoading } = useQuery<PTOLog[]>({
    queryKey: ['ptoLogs'],
    queryFn: async () => {
      const res = await axios.get('/api/pto/logs');
      return res.data;
    },
  });

  const { data: categories, isLoading: catsLoading } = useQuery<PTOCategory[]>({
    queryKey: ['ptoCategories'],
    queryFn: async () => {
      const res = await axios.get('/api/pto/categories');
      return res.data;
    },
  });

  const getCategoryName = (id: number) => {
    return categories?.find(c => c.id === id)?.name || 'Unknown';
  };

  const filteredLogs = logs?.filter(log => {
    if (selectedCategory === 'all') return true;
    return log.category_id === Number(selectedCategory);
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort descending

  if (logsLoading || catsLoading) return <div className="p-8">Loading history...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="text-primary" />
          PTO History
        </h1>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <Filter size={16} className="text-gray-400 ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No logs found.</td>
                </tr>
              ) : (
                filteredLogs?.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                      {format(new Date(log.date), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {getCategoryName(log.category_id)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      {log.amount < 0 ? (
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                          <ArrowDownCircle size={14} />
                          Usage
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <ArrowUpCircle size={14} />
                          Adjustment
                        </span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-sm text-right font-bold ${log.amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {log.amount > 0 ? '+' : ''}{log.amount}h
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 italic">
                      {log.note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
