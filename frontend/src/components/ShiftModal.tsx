import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateShiftMutation, useCreateBatchShiftsMutation } from '../hooks/api/useShifts';
import Button from './common/Button';
import { generateRecurringShifts } from '../utils/shifts';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
  initialMode?: 'single' | 'recurring';
  userPreferences?: {
    shift_length?: number;
    shifts_per_week?: number;
  };
}

const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialMode = 'single',
  userPreferences,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'recurring'>(initialMode);

  // Helper to calculate defaults
  const getDefaultTime = () => {
    if (userPreferences?.shift_length) {
      const startHour = 8;
      const endHour = startHour + userPreferences.shift_length;
      const endH = Math.floor(endHour) % 24;
      const endM = Math.round((endHour - Math.floor(endHour)) * 60);
      return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
    return '18:00';
  };

  const getDefaultDays = () => {
    if (userPreferences?.shifts_per_week) {
      const days = [];
      for (let i = 1; i <= Math.min(userPreferences.shifts_per_week, 7); i++) {
        days.push(i);
      }
      return days;
    }
    return [1, 2, 3, 4];
  };

  // Single Shift State
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState(getDefaultTime);

  // Recurring Shift State
  const [recStartTime, setRecStartTime] = useState('08:00');
  const [recEndTime, setRecEndTime] = useState(getDefaultTime);
  const [selectedDays, setSelectedDays] = useState<number[]>(getDefaultDays);

  const { mutate: createShift, isPending: creatingSingle } = useCreateShiftMutation();
  const { mutate: createBatch, isPending: creatingBatch } = useCreateBatchShiftsMutation();

  if (!isOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    // Handle overnight shifts if end < start (assume next day)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }

    createShift(
      { start_time: start.toISOString(), end_time: end.toISOString() },
      { onSuccess: onClose },
    );
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const shifts = generateRecurringShifts(selectedDays, recStartTime, recEndTime);

    if (shifts.length === 0) {
      alert('No shifts generated based on your selection.');
      return;
    }

    createBatch(shifts, { onSuccess: onClose });
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const daysOfWeek = [
    { label: 'Su', val: 0 },
    { label: 'Mo', val: 1 },
    { label: 'Tu', val: 2 },
    { label: 'We', val: 3 },
    { label: 'Th', val: 4 },
    { label: 'Fr', val: 5 },
    { label: 'Sa', val: 6 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-text-main">Add Shift</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'single' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => setActiveTab('single')}
          >
            Single Shift
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'recurring' ? 'text-primary border-b-2 border-primary' : 'text-text-muted hover:text-text-main'}`}
            onClick={() => setActiveTab('recurring')}
          >
            Recurring Schedule
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'single' ? (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Date</label>
                <input
                  type="date"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" variant="primary" fullWidth isLoading={creatingSingle}>
                  Add Shift
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleBatchSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Work Days</label>
                <div className="flex justify-between gap-1">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.val}
                      type="button"
                      onClick={() => toggleDay(day.val)}
                      className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                        selectedDays.includes(day.val)
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={recStartTime}
                    onChange={(e) => setRecStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">End Time</label>
                  <input
                    type="time"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                    value={recEndTime}
                    onChange={(e) => setRecEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" variant="primary" fullWidth isLoading={creatingBatch}>
                  Generate Schedule
                </Button>
                <p className="text-xs text-text-muted text-center mt-2">
                  This will add shifts for all selected days in the range.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
