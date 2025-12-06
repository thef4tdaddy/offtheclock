import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LogModal from '../components/LogModal';
import { formatHours } from '../utils/format';
import { usePTOLogs, usePTOCategories } from '../hooks/api/usePTO';
import { useDeleteLogMutation } from '../hooks/api/usePTOMutation';
import {
  useShifts,
  useDeleteShiftMutation,
  useDeleteShiftSeriesMutation,
} from '../hooks/api/useShifts';
import { useUserProfile } from '../hooks/api/useUser';
import ShiftModal from '../components/ShiftModal';
import { Calendar as CalendarIcon, Briefcase, TrendingUp } from 'lucide-react';
import Button from '../components/common/Button';

const Calendar: React.FC = () => {
  const { data: logs = [], isLoading: logsLoading } = usePTOLogs();
  const { data: categories = [], isLoading: catsLoading } = usePTOCategories();
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: user } = useUserProfile();
  const { mutate: deleteLog } = useDeleteLogMutation();
  const { mutate: deleteShift } = useDeleteShiftMutation();
  const { mutate: deleteShiftSeries } = useDeleteShiftSeriesMutation();

  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [modalInitialDate, setModalInitialDate] = useState<string>('');

  const loading = logsLoading || catsLoading || shiftsLoading;

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

  const handleDeleteLog = (e: React.MouseEvent, logId: number) => {
    e.stopPropagation(); // Prevent opening the modal
    if (!confirm('Are you sure you want to delete this log?')) return;

    deleteLog(logId, {
      onError: () => alert('Failed to delete log'),
    });
  };

  const handleDeleteShift = (e: React.MouseEvent, shiftId: number) => {
    e.stopPropagation();
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return;

    if (shift.series_id) {
      if (
        confirm(
          'This is a recurring shift.\n\nClick OK to delete the ENTIRE SERIES.\nClick Cancel to choose other options.',
        )
      ) {
        deleteShiftSeries(shift.series_id);
        return;
      }
      if (confirm('Delete just this single instance?')) {
        deleteShift(shiftId);
        return;
      }
    } else {
      if (confirm('Are you sure you want to delete this shift?')) {
        deleteShift(shiftId);
      }
    }
  };

  const openShiftModal = (dateStr?: string) => {
    setModalInitialDate(dateStr || new Date().toISOString().split('T')[0]);
    setShowShiftModal(true);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-32 bg-gray-50/50 border border-gray-100"></div>,
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        .toISOString()
        .split('T')[0];
      const dayLogs = logs.filter((log) => log.date.startsWith(dateStr));
      const dayShifts = shifts.filter((shift) => shift.start_time.startsWith(dateStr));

      // Projections Logic (Visual only)
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSunday = dayDate.getDay() === 0;
      const isJan1 = dayDate.getMonth() === 0 && dayDate.getDate() === 1;

      const projections = [];
      if (dayDate > new Date()) {
        // Only show in future
        if (isJan1) {
          const hasUPT = categories.some((c) => c.name.includes('UPT'));
          if (hasUPT)
            projections.push({ label: 'UPT Grant', icon: 'gift', color: 'text-green-600' });
        }
        if (isSunday) {
          const weeklyCats = categories.filter((c) => c.accrual_frequency === 'weekly');
          if (weeklyCats.length > 0) {
            projections.push({ label: 'Weekly Accrual', icon: 'trend', color: 'text-green-500' });
          }
        }
      }

      days.push(
        <div
          key={day}
          onClick={() => handleDayClick(dateStr)}
          className="h-32 bg-white border border-gray-100 p-2 relative hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          <span
            className={`text-sm font-medium ${
              new Date().toDateString() ===
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString()
                ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center'
                : 'text-gray-700'
            }`}
          >
            {day}
          </span>

          <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px]">
            {dayShifts.map((shift) => {
              const start = new Date(shift.start_time);
              const end = new Date(shift.end_time);
              const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return (
                <div
                  key={shift.id}
                  className="text-xs p-1 rounded px-2 truncate flex items-center justify-between group/shift bg-blue-100 text-blue-700 border border-blue-200"
                  title={`Work Shift: ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${duration.toFixed(1)}h)`}
                >
                  <span className="truncate mr-1 flex items-center gap-1">
                    <Briefcase size={10} />
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {duration.toFixed(1)}h
                  </span>
                  <button
                    onClick={(e) => handleDeleteShift(e, shift.id)}
                    className="opacity-0 group-hover/shift:opacity-100 hover:text-blue-900 transition-opacity"
                    title="Delete Shift"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {/* Logs */}
            {dayLogs.map((log) => (
              <div
                key={log.id}
                className={`text-xs p-1 rounded px-2 truncate flex items-center justify-between group/log ${
                  log.amount < 0
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}
                title={`${log.note || 'No note'} (${log.amount}h)`}
                data-testid="calendar-log"
              >
                <span className="truncate mr-1">
                  {log.amount > 0 ? '+' : ''}
                  {formatHours(log.amount)} {log.note}
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

            {/* Projections */}
            {projections.map((proj, idx) => (
              <div
                key={idx}
                className={`text-xs p-1 flex items-center gap-1 ${proj.color} opacity-75`}
                title={proj.label}
              >
                <TrendingUp size={10} />
                <span className="truncate">{proj.label}</span>
              </div>
            ))}
          </div>

          {/* Hover indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-primary font-medium">
            + Log
          </div>
        </div>,
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
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <span className="font-bold text-lg w-40 text-center text-text-main">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        <Button
          onClick={() => openShiftModal()}
          variant="primary"
          className="shadow-lg shadow-primary/20"
        >
          <CalendarIcon size={18} className="mr-2" />
          Manage Schedule
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-text-muted uppercase tracking-wider"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">{renderCalendarDays()}</div>
      </div>

      <LogModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => {
          /* Auto-invalidation handled by mutation */
        }}
        initialDate={selectedDate}
        categories={categories}
      />

      <ShiftModal
        key={showShiftModal ? 'open' : 'closed'}
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        initialDate={modalInitialDate}
        userPreferences={{
          shift_length: user?.shift_length,
          shifts_per_week: user?.shifts_per_week,
        }}
      />
    </div>
  );
};

export default Calendar;
