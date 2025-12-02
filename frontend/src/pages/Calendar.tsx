import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LogModal from '../components/LogModal';
import { formatHours } from '../utils/format';

interface PTOLog {
  id: number;
  category_id: number;
  date: string;
  amount: number;
  note?: string;
}

interface PTOCategory {
  id: number;
  name: string;
}

const Calendar: React.FC = () => {
  const [logs, setLogs] = useState<PTOLog[]>([]);
  const [categories, setCategories] = useState<PTOCategory[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchData = async () => {
    try {
      const [logsRes, catsRes] = await Promise.all([
        axios.get('/api/pto/logs'),
        axios.get('/api/pto/categories')
      ]);
      setLogs(logsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowLogModal(true);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDeleteLog = async (e: React.MouseEvent, logId: number) => {
    e.stopPropagation(); // Prevent opening the modal
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      await axios.delete(`/api/pto/logs/${logId}`);
      fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      alert('Failed to delete log');
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0];
      const dayLogs = logs.filter(log => log.date.startsWith(dateStr));

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(dateStr)}
          className="h-32 bg-white border border-gray-100 p-2 relative hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          <span className={`text-sm font-medium ${
            new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString() 
              ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' 
              : 'text-gray-700'
          }`}>
            {day}
          </span>
          
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
            {dayLogs.map(log => (
              <div 
                key={log.id} 
                className={`text-xs p-1 rounded px-2 truncate flex items-center justify-between group/log ${
                  log.amount < 0 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}
                title={`${log.note || 'No note'} (${log.amount}h)`}
              >
                <span className="truncate mr-1">
                  {log.amount > 0 ? '+' : ''}{formatHours(log.amount)} {log.note}
                </span>
                <button
                  onClick={(e) => handleDeleteLog(e, log.id)}
                  className="opacity-0 group-hover/log:opacity-100 hover:text-red-900 transition-opacity"
                  title="Delete Log"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          {/* Hover indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary font-medium">
            + Log
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">Calendar</h1>
        <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-lg w-40 text-center text-text-main">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-text-muted uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      <LogModal 
        isOpen={showLogModal} 
        onClose={() => setShowLogModal(false)} 
        onSuccess={fetchData}
        initialDate={selectedDate}
        categories={categories}
      />
    </div>
  );
};

export default Calendar;
