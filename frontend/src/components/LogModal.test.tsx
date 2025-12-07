import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import LogModal from './LogModal';
import * as usePTOMutationModule from '../hooks/api/usePTOMutation';
import { type PTOCategory } from '../domain/schemas/pto';

// Mock the hooks
vi.mock('../hooks/api/usePTOMutation', () => ({
  useCreateLogMutation: vi.fn(),
}));

describe('LogModal', () => {
  const mockCategories: PTOCategory[] = [
    {
      id: 1,
      name: 'Vacation',
      accrual_rate: 4,
      accrual_frequency: 'biweekly',
      current_balance: 80,
      starting_balance: 40,
      start_date: '2024-01-01T00:00:00Z',
      max_balance: 120,
    },
    {
      id: 2,
      name: 'Sick Leave',
      accrual_rate: 2,
      accrual_frequency: 'weekly',
      current_balance: 20,
      starting_balance: 0,
      start_date: '2024-01-01T00:00:00Z',
      max_balance: null,
    },
  ];

  const mockCreateLog = vi.fn();
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePTOMutationModule.useCreateLogMutation).mockReturnValue({
      mutate: mockCreateLog,
    } as unknown as ReturnType<typeof usePTOMutationModule.useCreateLogMutation>);
  });

  describe('Rendering', () => {
    it('does not render when closed', () => {
      render(
        <LogModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.queryByRole('heading', { name: /log time off/i })).not.toBeInTheDocument();
    });

    it('renders when open', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.getByRole('heading', { name: /log time off/i })).toBeInTheDocument();
    });

    it('renders modal title', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.getByRole('heading', { name: /log time off/i })).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Note (Optional)')).toBeInTheDocument();
    });

    it('renders close button', () => {
      const { container } = render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      const closeButton = container.querySelector('button[class*="absolute"]');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.getByRole('button', { name: /log time off/i })).toBeInTheDocument();
    });
  });

  describe('Toggle Type', () => {
    it('renders usage and adjustment toggle buttons', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.getByText('Log Usage (-)')).toBeInTheDocument();
      expect(screen.getByText('Adjustment (+)')).toBeInTheDocument();
    });

    it('defaults to usage mode', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );
      expect(screen.getByRole('button', { name: /log time off/i })).toBeInTheDocument();
    });

    it('switches to adjustment mode when clicked', async () => {
      const user = userEvent.setup();
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const adjustmentButton = screen.getByText('Adjustment (+)');
      await user.click(adjustmentButton);

      expect(screen.getByRole('button', { name: /add adjustment/i })).toBeInTheDocument();
    });

    it('switches back to usage mode', async () => {
      const user = userEvent.setup();
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const adjustmentButton = screen.getByText('Adjustment (+)');
      await user.click(adjustmentButton);

      const usageButton = screen.getByText('Log Usage (-)');
      await user.click(usageButton);

      expect(screen.getByRole('button', { name: /log time off/i })).toBeInTheDocument();
    });
  });

  describe('Category Selection', () => {
    it('populates category dropdown with provided categories', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      expect(screen.getByText('Vacation')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    });

    it('selects first category by default', () => {
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const categorySelect = screen.getByRole('combobox') as HTMLSelectElement;
      expect(categorySelect.value).toBe('1');
    });

    it('allows changing category', async () => {
      const user = userEvent.setup();
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const categorySelect = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(categorySelect, '2');

      expect(categorySelect.value).toBe('2');
    });
  });

  describe('Form Inputs', () => {
    it('allows entering duration', async () => {
      const user = userEvent.setup();
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, '8h');

      expect(durationInput.value).toBe('8h');
    });

    it('allows entering note', async () => {
      const user = userEvent.setup();
      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const noteInput = screen.getByPlaceholderText(
        "e.g. Doctor's appointment",
      ) as HTMLInputElement;
      await user.type(noteInput, 'Vacation trip');

      expect(noteInput.value).toBe('Vacation trip');
    });

    it('allows changing date', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const dateInputs = screen.getAllByRole('textbox');
      const dateInput = dateInputs.find(
        (input) => (input as HTMLInputElement).type === 'date',
      ) as HTMLInputElement;

      if (!dateInput) {
        // Try finding by type attribute directly
        const dateInputAlt = container.querySelector('input[type="date"]') as HTMLInputElement;
        if (dateInputAlt) {
          await user.clear(dateInputAlt);
          await user.type(dateInputAlt, '2024-12-25');
          expect(dateInputAlt.value).toBe('2024-12-25');
        }
        return;
      }

      await user.clear(dateInput);
      await user.type(dateInput, '2024-12-25');

      expect(dateInput.value).toBe('2024-12-25');
    });
  });

  describe('Initial Date', () => {
    it('uses initialDate prop when provided', () => {
      const { container } = render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
          initialDate="2024-06-15"
        />,
      );

      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      expect(dateInput).toBeInTheDocument();
      expect(dateInput.value).toBe('2024-06-15');
    });

    it('uses current date when initialDate not provided', () => {
      const today = new Date().toISOString().split('T')[0];
      const { container } = render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      expect(dateInput).toBeInTheDocument();
      expect(dateInput.value).toBe(today);
    });
  });

  describe('Form Submission', () => {
    it('submits with negative amount for usage', async () => {
      const user = userEvent.setup();

      mockCreateLog.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, '8');

      const submitButton = screen.getByRole('button', { name: /log time off/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLog).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: -8,
            category_id: 1,
          }),
          expect.any(Object),
        );
      });
    });

    it('submits with positive amount for adjustment', async () => {
      const user = userEvent.setup();

      mockCreateLog.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const adjustmentButton = screen.getByText('Adjustment (+)');
      await user.click(adjustmentButton);

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, '8');

      const submitButton = screen.getByRole('button', { name: /add adjustment/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLog).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 8,
            category_id: 1,
          }),
          expect.any(Object),
        );
      });
    });

    it('calls onSuccess and onClose on successful submission', async () => {
      const user = userEvent.setup();

      mockCreateLog.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, '8');

      const submitButton = screen.getByRole('button', { name: /log time off/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('shows error alert on invalid duration format', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, 'invalid');

      const submitButton = screen.getByRole('button', { name: /log time off/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Please enter a valid duration (e.g. "8h", "1:30", "4.5")',
        );
      });

      alertSpy.mockRestore();
    });

    it('shows error alert on submission failure', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateLog.mockImplementation((_, options) => {
        if (options && 'onError' in options && typeof options.onError === 'function') {
          options.onError(new Error('Test error'), undefined, undefined);
        }
      });

      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, '8');

      const submitButton = screen.getByRole('button', { name: /log time off/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to log PTO');
      });

      alertSpy.mockRestore();
    });

    it('includes note in submission when provided', async () => {
      const user = userEvent.setup();

      mockCreateLog.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      await user.type(durationInput, '8');

      const noteInput = screen.getByPlaceholderText(
        "e.g. Doctor's appointment",
      ) as HTMLInputElement;
      await user.type(noteInput, 'Sick day');

      const submitButton = screen.getByRole('button', { name: /log time off/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateLog).toHaveBeenCalledWith(
          expect.objectContaining({
            note: 'Sick day',
          }),
          expect.any(Object),
        );
      });
    });
  });

  describe('Modal Close', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const closeButton = container.querySelector('button[class*="absolute"]');
      if (closeButton) {
        await user.click(closeButton);
      }

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Form Reset on Modal Open', () => {
    it('resets form when modal is reopened', () => {
      const { rerender } = render(
        <LogModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      rerender(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const durationInput = screen.getByPlaceholderText(
        'e.g. 8h, 4h 30m, 1:30',
      ) as HTMLInputElement;
      const noteInput = screen.getByPlaceholderText(
        "e.g. Doctor's appointment",
      ) as HTMLInputElement;

      expect(durationInput.value).toBe('');
      expect(noteInput.value).toBe('');
    });

    it('sets default category on modal open', () => {
      const { rerender } = render(
        <LogModal
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      rerender(
        <LogModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
          categories={mockCategories}
        />,
      );

      const categorySelect = screen.getByRole('combobox') as HTMLSelectElement;
      expect(categorySelect.value).toBe('1');
    });
  });
});
