import React, { useState } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { usePTOForecast } from '../hooks/api/usePTO';

const Forecast: React.FC = () => {
  const [targetDate, setTargetDate] = useState('');
  // We fetch only when handleForecast calls (by setting a state that triggers query or using refetch)
  // Better pattern: use query normally but formatted.
  // Actually, the original code fetched on button click.
  // TanStack Query 'enabled' prop handles this.

  const { data: projections = [], isFetching, refetch } = usePTOForecast(targetDate);

  const handleForecast = () => {
    if (targetDate) refetch();
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
          <TrendingUp size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-text-main">Balance Forecast</h3>
          <p className="text-sm text-text-muted">Project your future PTO balance</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end mb-8">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-text-muted mb-1">Target Date</label>
          <div className="relative">
            <input
              type="date"
              className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
            <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
          </div>
        </div>
        <button
          onClick={handleForecast}
          disabled={isFetching || !targetDate}
          className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary-dark disabled:opacity-50 font-medium transition-colors shadow-lg shadow-primary/20"
        >
          {isFetching ? 'Calculating...' : 'Calculate Projection'}
        </button>
      </div>

      {projections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projections.map((cat) => (
            <div
              key={cat.id}
              className="p-6 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center text-center"
            >
              <div className="text-sm text-text-muted font-medium mb-1">{cat.name}</div>
              <div className="text-3xl font-bold text-primary">
                {cat.current_balance.toFixed(1)}{' '}
                <span className="text-sm font-normal text-text-muted">hrs</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forecast;
