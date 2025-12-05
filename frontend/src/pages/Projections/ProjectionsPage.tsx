import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, addDays, differenceInDays } from 'date-fns';
import { TrendingUp, Calendar as CalendarIcon } from 'lucide-react';
import { usePTOCategories } from '../../hooks/api/usePTO';
import { type PTOCategory } from '../../domain/schemas/pto';

// Simulated internal type to extend the schema with simulation props
interface SimulatedCategory extends PTOCategory {
  simBalance: number;
  yearlyAccrued: number;
}

const AccrualFrequency = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  ANNUALLY: "annually"
} as const;

const ProjectionsPage: React.FC = () => {
  const [projectionDays, setProjectionDays] = useState(180); // Default 6 months

  const { data: categories = [], isLoading } = usePTOCategories();

  // Client-side simulation logic
  const chartData = useMemo(() => {
    if (!categories.length) return [];

    const data: Array<{ date: string; fullDate: string; [key: string]: string | number }> = [];
    const today = new Date();
    const endDate = addDays(today, projectionDays);
    
    // Initialize simulation state
    // We start from TODAY with CURRENT BALANCE.
    let currentSimDate = new Date(today);
    let currentYear = currentSimDate.getFullYear();
    
    // State for each category
    const catStates: SimulatedCategory[] = categories.map(cat => ({
      ...cat,
      simBalance: cat.current_balance,
      // We ideally need accrued_ytd from backend to be perfect. 
      // If we implemented the backend fix, we should see accrued_ytd in the response.
      yearlyAccrued: cat.accrued_ytd || 0 
    }));

    while (currentSimDate <= endDate) {
      const dateStr = format(currentSimDate, 'MMM d');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataPoint: any = { date: dateStr, fullDate: currentSimDate.toISOString() };

      // Helper to check if it's a new year for logic resetting
      if (currentSimDate.getFullYear() !== currentYear) {
         currentYear = currentSimDate.getFullYear();
         catStates.forEach(cat => cat.yearlyAccrued = 0);
      }

      catStates.forEach(cat => {
        let dailyAccrual = 0;
        let shouldAccrue = false;

        // 1. Check Annual Grant (Jan 1)
        if (cat.annual_grant_amount && cat.annual_grant_amount > 0) {
          if (currentSimDate.getMonth() === 0 && currentSimDate.getDate() === 1) {
             // Grant logic
             cat.simBalance += cat.annual_grant_amount;
          }
        }

        // 2. Check Accrual
        const startDate = new Date(cat.start_date);
        
        if (cat.accrual_frequency === AccrualFrequency.WEEKLY) {
          if (currentSimDate.getDay() === 0) { // Sunday
            // Logic for skipping if grant week? 
            // Ideally we replicate exact backend logic, but simple weekly is okay for now visually.
            shouldAccrue = true;
            dailyAccrual = cat.accrual_rate;
          }
        } else if (cat.accrual_frequency === AccrualFrequency.BIWEEKLY) {
           const diff = differenceInDays(currentSimDate, startDate);
           if (diff > 0 && diff % 14 === 0) {
             shouldAccrue = true;
             dailyAccrual = cat.accrual_rate;
           }
        } else if (cat.accrual_frequency === AccrualFrequency.MONTHLY) {
            if (currentSimDate.getDate() === 1) {
                shouldAccrue = true;
                dailyAccrual = cat.accrual_rate;
            }
        } else if (cat.accrual_frequency === AccrualFrequency.ANNUALLY) {
            if (currentSimDate.getMonth() === 0 && currentSimDate.getDate() === 1) {
                shouldAccrue = true;
                dailyAccrual = cat.accrual_rate;
            }
        }

        // 3. Apply Yearly Cap
        if (shouldAccrue) {
           if (cat.yearly_accrual_cap) {
             const remaining = cat.yearly_accrual_cap - cat.yearlyAccrued;
             if (remaining > 0) {
               const add = Math.min(dailyAccrual, remaining);
               cat.simBalance += add;
               cat.yearlyAccrued += add;
             }
           } else {
             cat.simBalance += dailyAccrual;
           }
        }

        // 4. Apply Max Balance Cap
        if (cat.max_balance && cat.simBalance > cat.max_balance) {
          cat.simBalance = cat.max_balance;
        }

        dataPoint[cat.name] = Number(cat.simBalance.toFixed(2));
      });

      data.push(dataPoint);
      currentSimDate = addDays(currentSimDate, 1);
    }

    return data;
  }, [categories, projectionDays]);

  if (isLoading) return <div className="p-8">Loading projections...</div>;

  const colors = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="text-primary" />
          PTO Projections
        </h1>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <CalendarIcon size={16} className="text-gray-400 ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
            value={projectionDays}
            onChange={(e) => setProjectionDays(Number(e.target.value))}
          >
            <option value={30}>Next 30 Days</option>
            <option value={90}>Next 3 Months</option>
            <option value={180}>Next 6 Months</option>
            <option value={365}>Next 1 Year</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af" 
              tick={{ fontSize: 12 }} 
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '14px', fontWeight: 500 }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {categories?.map((cat, index) => (
              <Line 
                key={cat.id}
                type="monotone" 
                dataKey={cat.name} 
                stroke={colors[index % colors.length]} 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories?.map((cat, index) => (
           <div key={cat.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex items-center gap-2 mb-2">
               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }}></div>
               <h3 className="font-bold text-gray-900">{cat.name}</h3>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-500">Current:</span>
               <span className="font-mono font-medium">{cat.current_balance.toFixed(2)}h</span>
             </div>
             <div className="flex justify-between text-sm mt-1">
               <span className="text-gray-500">Projected ({projectionDays}d):</span>
               <span className="font-mono font-bold text-primary">
                 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                 {chartData.length > 0 ? (chartData[chartData.length - 1] as any)[cat.name] : '-'}h
               </span>
             </div>
           </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectionsPage;
