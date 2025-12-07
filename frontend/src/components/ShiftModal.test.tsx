import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import ShiftModal from './ShiftModal';
import * as useShiftsModule from '../hooks/api/useShifts';

// Mock the hooks
vi.mock('../hooks/api/useShifts', () => ({
  useCreateShiftMutation: vi.fn(),
  useCreateBatchShiftsMutation: vi.fn(),
}));

describe('ShiftModal', () => {
  const mockCreateShift = vi.fn();
  const mockCreateBatch = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useShiftsModule.useCreateShiftMutation).mockReturnValue({
      mutate: mockCreateShift,
      isPending: false,
    } as unknown as ReturnType<typeof useShiftsModule.useCreateShiftMutation>);

    vi.mocked(useShiftsModule.useCreateBatchShiftsMutation).mockReturnValue({
      mutate: mockCreateBatch,
      isPending: false,
    } as unknown as ReturnType<typeof useShiftsModule.useCreateBatchShiftsMutation>);
  });

  describe('Rendering', () => {
    it('does not render when isOpen is false', () => {
      render(<ShiftModal isOpen={false} onClose={mockOnClose} />);
      expect(screen.queryByText('Add Shift')).not.toBeInTheDocument();
    });

    it('renders modal header correctly', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      const headings = screen.getAllByRole('heading', { name: /add shift/i });
      expect(headings[0]).toBeInTheDocument();
    });

    it('renders both tabs: Single Shift and Recurring Schedule', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('Single Shift')).toBeInTheDocument();
      expect(screen.getByText('Recurring Schedule')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Single Shift Form', () => {
    it('renders single shift form by default', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
      expect(screen.getByTestId('submit-single')).toBeInTheDocument();
    });

    it('uses initialDate when provided', () => {
      const testDate = '2024-03-15';
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialDate={testDate} />);
      const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
      expect(dateInput.value).toBe(testDate);
    });

    it('uses current date when initialDate is not provided', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      const dateInput = screen.getByLabelText('Date') as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput.value).toBe(today);
    });

    it('has default start time of 08:00', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      const startTimeInput = screen.getByLabelText('Start Time') as HTMLInputElement;
      expect(startTimeInput.value).toBe('08:00');
    });

    it('calculates default end time from user preferences', () => {
      render(
        <ShiftModal isOpen={true} onClose={mockOnClose} userPreferences={{ shift_length: 10 }} />,
      );
      const endTimeInput = screen.getByLabelText('End Time') as HTMLInputElement;
      expect(endTimeInput.value).toBe('18:00'); // 8 + 10 = 18:00
    });

    it('allows user to change form values', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);

      const dateInput = screen.getByLabelText('Date');
      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      await user.clear(dateInput);
      await user.type(dateInput, '2024-05-20');

      await user.clear(startTimeInput);
      await user.type(startTimeInput, '09:00');

      await user.clear(endTimeInput);
      await user.type(endTimeInput, '17:00');

      expect((dateInput as HTMLInputElement).value).toBe('2024-05-20');
      expect((startTimeInput as HTMLInputElement).value).toBe('09:00');
      expect((endTimeInput as HTMLInputElement).value).toBe('17:00');
    });

    it('submits single shift with correct data', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialDate="2024-03-15" />);

      const submitButton = screen.getByTestId('submit-single');
      await user.click(submitButton);

      const expectedStart = new Date('2024-03-15T08:00').toISOString();
      const expectedEnd = new Date('2024-03-15T18:00').toISOString();

      expect(mockCreateShift).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: expectedStart,
          end_time: expectedEnd,
        }),
        expect.objectContaining({ onSuccess: mockOnClose }),
      );
    });

    it('handles overnight shifts by adding a day to end time', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialDate="2024-03-15" />);

      const startTimeInput = screen.getByLabelText('Start Time');
      const endTimeInput = screen.getByLabelText('End Time');

      await user.clear(startTimeInput);
      await user.type(startTimeInput, '22:00');

      await user.clear(endTimeInput);
      await user.type(endTimeInput, '06:00');

      const submitButton = screen.getByTestId('submit-single');
      await user.click(submitButton);

      const expectedStart = new Date('2024-03-15T22:00').toISOString();
      const expectedEnd = new Date('2024-03-16T06:00').toISOString();

      expect(mockCreateShift).toHaveBeenCalledWith(
        expect.objectContaining({
          start_time: expectedStart,
          end_time: expectedEnd,
        }),
        expect.any(Object),
      );
    });

    it('shows loading state during submission', () => {
      vi.mocked(useShiftsModule.useCreateShiftMutation).mockReturnValue({
        mutate: mockCreateShift,
        isPending: true,
      } as unknown as ReturnType<typeof useShiftsModule.useCreateShiftMutation>);

      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByTestId('submit-single');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Recurring Schedule Form', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);
      const recurringTab = screen.getByText('Recurring Schedule');
      await user.click(recurringTab);
    });

    it('renders recurring form when tab is selected', () => {
      expect(screen.getByText('Work Days')).toBeInTheDocument();
      expect(screen.getByLabelText('Start Time')).toBeInTheDocument();
      expect(screen.getByLabelText('End Time')).toBeInTheDocument();
      expect(screen.getByTestId('submit-recurring')).toBeInTheDocument();
    });

    it('renders all days of the week buttons', () => {
      const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      dayLabels.forEach((day) => {
        expect(screen.getByRole('button', { name: day })).toBeInTheDocument();
      });
    });

    it('allows toggling day selection', async () => {
      const user = userEvent.setup();
      const mondayButton = screen.getByRole('button', { name: 'Mo' });

      // Initially selected (default is Mon-Thu)
      expect(mondayButton).toHaveClass('bg-primary');

      // Click to deselect
      await user.click(mondayButton);
      await waitFor(() => {
        expect(mondayButton).not.toHaveClass('bg-primary');
        expect(mondayButton).toHaveClass('bg-gray-100');
      });

      // Click to select again
      await user.click(mondayButton);
      await waitFor(() => {
        expect(mondayButton).toHaveClass('bg-primary');
      });
    });

    it('uses default days from user preferences', () => {
      cleanup();
      render(
        <ShiftModal
          isOpen={true}
          onClose={mockOnClose}
          initialMode="recurring"
          userPreferences={{ shifts_per_week: 5 }}
        />,
      );

      // Should select Mon-Fri (days 1-5)
      ['Mo', 'Tu', 'We', 'Th', 'Fr'].forEach((day) => {
        expect(screen.getByRole('button', { name: day })).toHaveClass('bg-primary');
      });
    });

    it('submits batch shifts with selected days', async () => {
      cleanup();
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);

      const recurringTab = screen.getByText('Recurring Schedule');
      await user.click(recurringTab);

      const submitButton = screen.getByTestId('submit-recurring');
      await user.click(submitButton);

      expect(mockCreateBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            start_time: expect.any(String),
            end_time: expect.any(String),
          }),
        ]),
        expect.objectContaining({ onSuccess: mockOnClose }),
      );
    });

    it('shows alert when no days are selected', async () => {
      cleanup();
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);

      const recurringTab = screen.getByText('Recurring Schedule');
      await user.click(recurringTab);

      // Deselect all days using for-of loop for proper async handling
      for (const day of ['Mo', 'Tu', 'We', 'Th']) {
        const button = screen.getByRole('button', { name: day });
        await user.click(button);
      }

      const submitButton = screen.getByTestId('submit-recurring');
      await user.click(submitButton);

      expect(alertSpy).toHaveBeenCalledWith('No shifts generated based on your selection.');
      expect(mockCreateBatch).not.toHaveBeenCalled();

      alertSpy.mockRestore();
    });

    it('shows loading state during batch submission', () => {
      cleanup();
      vi.mocked(useShiftsModule.useCreateBatchShiftsMutation).mockReturnValue({
        mutate: mockCreateBatch,
        isPending: true,
      } as unknown as ReturnType<typeof useShiftsModule.useCreateBatchShiftsMutation>);

      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);
      const submitButton = screen.getByTestId('submit-recurring');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Tab Navigation', () => {
    it('switches between tabs', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);

      // Initially on single shift
      expect(screen.getByText('Single Shift')).toHaveClass('text-primary');
      expect(screen.getByLabelText('Date')).toBeInTheDocument();

      // Switch to recurring
      const recurringTab = screen.getByText('Recurring Schedule');
      await user.click(recurringTab);

      expect(screen.getByText('Recurring Schedule')).toHaveClass('text-primary');
      expect(screen.getByText('Work Days')).toBeInTheDocument();

      // Switch back to single
      const singleTab = screen.getByText('Single Shift');
      await user.click(singleTab);

      expect(screen.getByText('Single Shift')).toHaveClass('text-primary');
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
    });

    it('starts on recurring tab when initialMode is recurring', () => {
      render(<ShiftModal isOpen={true} onClose={mockOnClose} initialMode="recurring" />);
      expect(screen.getByText('Recurring Schedule')).toHaveClass('text-primary');
      expect(screen.getByText('Work Days')).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /close modal/i });
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose on successful submission', async () => {
      const user = userEvent.setup();
      mockCreateShift.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<ShiftModal isOpen={true} onClose={mockOnClose} />);
      const submitButton = screen.getByTestId('submit-single');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
