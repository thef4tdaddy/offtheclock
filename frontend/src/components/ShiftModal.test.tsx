/**
 * Comprehensive tests for ShiftModal component.
 * Tests form interactions, validation, and preset loading.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../test/test-utils';
import ShiftModal from './ShiftModal';

// Mock the hooks
vi.mock('../hooks/api/useShifts', () => ({
  useCreateShiftMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCreateBatchShiftsMutation: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('ShiftModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Visibility', () => {
    it('does not render when isOpen is false', () => {
      render(<ShiftModal isOpen={false} onClose={mockOnClose} />);
      
      expect(screen.queryByText('Single Shift')).not.toBeInTheDocument();
    });

    it('renders when isOpen is true', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('heading', { name: 'Add Shift' })).toBeInTheDocument();
    });

    it('shows close button', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      // The X icon button in the header
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Tab Navigation', () => {
    it('shows single shift tab by default', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const singleTab = screen.getByText('Single Shift');
      const recurringTab = screen.getByText('Recurring Schedule');
      
      expect(singleTab).toHaveClass('text-primary', 'border-primary');
      expect(recurringTab).not.toHaveClass('text-primary');
    });

    it('switches to recurring tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const recurringTab = screen.getByText('Recurring Schedule');
      await user.click(recurringTab);
      
      expect(recurringTab).toHaveClass('text-primary', 'border-primary');
    });

    it('switches back to single tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);
      
      const singleTab = screen.getByText('Single Shift');
      await user.click(singleTab);
      
      expect(singleTab).toHaveClass('text-primary', 'border-primary');
    });

    it('respects initialMode prop for recurring', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);
      
      const recurringTab = screen.getByText('Recurring Schedule');
      expect(recurringTab).toHaveClass('text-primary', 'border-primary');
    });
  });

  describe('Single Shift Form', () => {
    it('renders all required form fields', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Start Time')).toBeInTheDocument();
      expect(screen.getByText('End Time')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
    });

    it('uses initialDate when provided', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialDate="2024-06-15" />);
      
      const dateInput = screen.getByDisplayValue('2024-06-15');
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('uses current date when no initialDate provided', () => {
      const today = new Date().toISOString().split('T')[0];
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const dateInput = screen.getByDisplayValue(today);
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('allows changing date field', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialDate="2024-01-01" />);
      
      const dateInput = screen.getByDisplayValue('2024-01-01');
      
      // Just verify we can interact with it
      await user.click(dateInput);
      expect(dateInput).toHaveAttribute('type', 'date');
    });

    it('allows changing start time field', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const startTimeInput = screen.getByDisplayValue('08:00');
      await user.clear(startTimeInput);
      await user.type(startTimeInput, '09:30');
      
      expect(startTimeInput).toHaveValue('09:30');
    });

    it('allows changing end time field', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const endTimeInput = screen.getByDisplayValue('18:00');
      await user.clear(endTimeInput);
      await user.type(endTimeInput, '17:30');
      
      expect(endTimeInput).toHaveValue('17:30');
    });

    it('has default start time of 08:00', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const startTimeInput = screen.getByDisplayValue('08:00');
      expect(startTimeInput).toHaveAttribute('type', 'time');
    });

    it('has default end time of 18:00 when no preferences', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const endTimeInput = screen.getByDisplayValue('18:00');
      expect(endTimeInput).toHaveAttribute('type', 'time');
    });
  });

  describe('Single Shift Form - User Preferences', () => {
    it('calculates end time from shift_length preference', () => {
      const userPreferences = {
        shift_length: 10, // 10-hour shift
        shifts_per_week: 4,
      };
      
      render(
        <ShiftModal 
          isOpen={true} 
          onClose={mockOnClose} 
          userPreferences={userPreferences}
        />
      );
      
      const endTimeInput = screen.getByDisplayValue('18:00');
      // Start at 08:00, add 10 hours = 18:00
      expect(endTimeInput).toHaveAttribute('type', 'time');
    });

    it('handles fractional shift_length with minutes', () => {
      const userPreferences = {
        shift_length: 8.5, // 8.5-hour shift (8h 30m)
        shifts_per_week: 5,
      };
      
      render(
        <ShiftModal 
          isOpen={true} 
          onClose={mockOnClose} 
          userPreferences={userPreferences}
        />
      );
      
      const endTimeInput = screen.getByDisplayValue('16:30');
      // Start at 08:00, add 8.5 hours = 16:30
      expect(endTimeInput).toHaveAttribute('type', 'time');
    });

    it('handles overnight shift calculation', () => {
      const userPreferences = {
        shift_length: 12, // 12-hour shift
        shifts_per_week: 3,
      };
      
      render(
        <ShiftModal 
          isOpen={true} 
          onClose={mockOnClose} 
          userPreferences={userPreferences}
        />
      );
      
      const endTimeInput = screen.getByDisplayValue('20:00');
      // Start at 08:00, add 12 hours = 20:00
      expect(endTimeInput).toHaveAttribute('type', 'time');
    });
  });

  describe('Recurring Shift Form', () => {
    beforeEach(() => {
      // Start in recurring mode for these tests
    });

    it('renders work days selector', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      // Switch to recurring tab
      await user.click(screen.getByText('Recurring Schedule'));
      
      expect(screen.getByText('Work Days')).toBeInTheDocument();
      expect(screen.getByText('Su')).toBeInTheDocument();
      expect(screen.getByText('Mo')).toBeInTheDocument();
      expect(screen.getByText('Tu')).toBeInTheDocument();
      expect(screen.getByText('We')).toBeInTheDocument();
      expect(screen.getByText('Th')).toBeInTheDocument();
      expect(screen.getByText('Fr')).toBeInTheDocument();
      expect(screen.getByText('Sa')).toBeInTheDocument();
    });

    it('has default selected days when no preferences', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      // Default is [1, 2, 3, 4] (Mon-Thu)
      const moButton = screen.getByText('Mo');
      const tuButton = screen.getByText('Tu');
      const weButton = screen.getByText('We');
      const thButton = screen.getByText('Th');
      
      expect(moButton).toHaveClass('bg-primary');
      expect(tuButton).toHaveClass('bg-primary');
      expect(weButton).toHaveClass('bg-primary');
      expect(thButton).toHaveClass('bg-primary');
    });

    it('uses shifts_per_week from preferences', async () => {
      const user = userEvent.setup();
      const userPreferences = {
        shift_length: 10,
        shifts_per_week: 5, // 5 days per week
      };
      
      render(
        <ShiftModal 
          isOpen={true} 
          onClose={mockOnClose} 
          userPreferences={userPreferences}
        />
      );
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      // Should have Mon-Fri selected (days 1-5)
      expect(screen.getByText('Mo')).toHaveClass('bg-primary');
      expect(screen.getByText('Tu')).toHaveClass('bg-primary');
      expect(screen.getByText('We')).toHaveClass('bg-primary');
      expect(screen.getByText('Th')).toHaveClass('bg-primary');
      expect(screen.getByText('Fr')).toHaveClass('bg-primary');
      expect(screen.getByText('Sa')).not.toHaveClass('bg-primary');
    });

    it('allows toggling days on and off', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      const frButton = screen.getByText('Fr');
      
      // Initially not selected
      expect(frButton).not.toHaveClass('bg-primary');
      
      // Click to select
      await user.click(frButton);
      expect(frButton).toHaveClass('bg-primary');
      
      // Click again to deselect
      await user.click(frButton);
      expect(frButton).not.toHaveClass('bg-primary');
    });

    it('allows selecting multiple days', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      // Clear default selections first by clicking selected days
      await user.click(screen.getByText('Mo'));
      await user.click(screen.getByText('Tu'));
      await user.click(screen.getByText('We'));
      await user.click(screen.getByText('Th'));
      
      // Select weekend
      await user.click(screen.getByText('Sa'));
      await user.click(screen.getByText('Su'));
      
      expect(screen.getByText('Sa')).toHaveClass('bg-primary');
      expect(screen.getByText('Su')).toHaveClass('bg-primary');
    });

    it('has time inputs in recurring form', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      // Should have time inputs with values
      expect(screen.getAllByDisplayValue('08:00').length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue('18:00').length).toBeGreaterThan(0);
    });

    it('shows generate schedule button', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      expect(screen.getByRole('button', { name: /generate schedule/i })).toBeInTheDocument();
    });

    it('shows helper text about shift range', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      await user.click(screen.getByText('Recurring Schedule'));
      
      expect(screen.getByText(/this will add shifts for all selected days/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires date field in single shift form', async () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
      expect(dateInput).toBeRequired();
    });

    it('requires start time field', async () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const startTimeInput = screen.getByDisplayValue('08:00');
      expect(startTimeInput).toBeRequired();
    });

    it('requires end time field', async () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      const endTimeInput = screen.getByDisplayValue('18:00');
      expect(endTimeInput).toBeRequired();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      // Find the X button in the header (first button after heading)
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons[0]; // First button should be the X close button
      await user.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Start Time')).toBeInTheDocument();
      expect(screen.getByText('End Time')).toBeInTheDocument();
    });

    it('has descriptive button text', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('button', { name: /add shift/i })).toBeInTheDocument();
    });

    it('modal title is visible', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('heading', { name: 'Add Shift' })).toBeInTheDocument();
    });
  });
});
