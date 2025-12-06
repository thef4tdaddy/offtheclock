import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import AmazonPresetSection from './AmazonPresetSection';
import * as usePTOMutationModule from '../../hooks/api/usePTOMutation';

// Mock the hooks
vi.mock('../../hooks/api/usePTOMutation', () => ({
  useApplyAmazonPresetMutation: vi.fn(),
}));

describe('AmazonPresetSection', () => {
  const mockApplyPreset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePTOMutationModule.useApplyAmazonPresetMutation).mockReturnValue({
      mutate: mockApplyPreset,
      isPending: false,
    } as unknown as ReturnType<typeof usePTOMutationModule.useApplyAmazonPresetMutation>);
  });

  describe('Rendering', () => {
    it('renders section title', () => {
      render(<AmazonPresetSection />);
      expect(screen.getByText('Amazon PTO Presets')).toBeInTheDocument();
    });

    it('renders quick setup information', () => {
      render(<AmazonPresetSection />);
      expect(screen.getByText('Quick Setup')).toBeInTheDocument();
      expect(screen.getByText(/automatically configure your account/i)).toBeInTheDocument();
    });

    it('renders all input fields', () => {
      const { container } = render(<AmazonPresetSection />);
      expect(screen.getByText('Years of Service')).toBeInTheDocument();
      expect(screen.getByText('Shift Length (Hours)')).toBeInTheDocument();
      expect(screen.getByText('Shifts per Week')).toBeInTheDocument();
      expect(screen.getByText('Current UPT Balance')).toBeInTheDocument();
      expect(screen.getByText('Current Flex Balance')).toBeInTheDocument();
      expect(screen.getByText('Current Vacation Balance')).toBeInTheDocument();

      // Verify inputs exist
      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('renders schedule creator checkbox', () => {
      render(<AmazonPresetSection />);
      const checkbox = screen.getByLabelText(/pop out schedule creator after loading presets/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
    });

    it('renders submit button', () => {
      render(<AmazonPresetSection />);
      expect(screen.getByRole('button', { name: /load amazon defaults/i })).toBeInTheDocument();
    });

    it('renders PTO category information', () => {
      render(<AmazonPresetSection />);
      const text = screen.getByText(/80h Cap/i);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Form Inputs', () => {
    it('has default values for inputs', () => {
      const { container } = render(<AmazonPresetSection />);

      const tenureInput = container.querySelector('input[min="0"][max="50"]') as HTMLInputElement;
      const shiftLengthInput = container.querySelector('input[step="0.5"]') as HTMLInputElement;
      const shiftsPerWeekInput = container.querySelector(
        'input[min="1"][max="7"]:not([step])',
      ) as HTMLInputElement;

      expect(tenureInput.value).toBe('0');
      expect(shiftLengthInput.value).toBe('10');
      expect(shiftsPerWeekInput.value).toBe('4');
    });

    it('allows changing tenure', async () => {
      const user = userEvent.setup();
      const { container } = render(<AmazonPresetSection />);

      const tenureInput = container.querySelector('input[min="0"][max="50"]') as HTMLInputElement;
      await user.clear(tenureInput);
      await user.type(tenureInput, '5');

      expect(tenureInput.value).toBe('5');
    });

    it('allows changing shift length', async () => {
      const user = userEvent.setup();
      const { container } = render(<AmazonPresetSection />);

      const shiftLengthInput = container.querySelector('input[step="0.5"]') as HTMLInputElement;
      await user.clear(shiftLengthInput);
      await user.type(shiftLengthInput, '12');

      expect(shiftLengthInput.value).toBe('12');
    });

    it('allows changing shifts per week', async () => {
      const user = userEvent.setup();
      const { container } = render(<AmazonPresetSection />);

      const shiftsPerWeekInput = container.querySelector(
        'input[min="1"][max="7"]:not([step])',
      ) as HTMLInputElement;
      await user.clear(shiftsPerWeekInput);
      await user.type(shiftsPerWeekInput, '5');

      expect(shiftsPerWeekInput.value).toBe('5');
    });

    it('allows entering current UPT balance', async () => {
      const user = userEvent.setup();
      const { container } = render(<AmazonPresetSection />);

      const uptInput = container.querySelector(
        'input[placeholder*="10 or 5h22m"]',
      ) as HTMLInputElement;
      await user.type(uptInput, '40');

      expect(uptInput.value).toBe('40');
    });

    it('allows entering current Flex balance', async () => {
      const user = userEvent.setup();
      render(<AmazonPresetSection />);

      const flexLabel = screen.getByText('Current Flex Balance');
      const flexInput = flexLabel.closest('div')?.querySelector('input') as HTMLInputElement;
      await user.type(flexInput, '20');

      expect(flexInput.value).toBe('20');
    });

    it('allows entering current Vacation balance', async () => {
      const user = userEvent.setup();
      const { container } = render(<AmazonPresetSection />);

      const vacationInput = container.querySelector(
        'input[placeholder*="40 or 5h22m"]',
      ) as HTMLInputElement;
      await user.type(vacationInput, '80');

      expect(vacationInput.value).toBe('80');
    });

    it('allows toggling schedule creator checkbox', async () => {
      const user = userEvent.setup();
      render(<AmazonPresetSection />);

      const checkbox = screen.getByLabelText(
        /pop out schedule creator after loading presets/i,
      ) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Duration Parsing', () => {
    it('submits with simple number format', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { container } = render(<AmazonPresetSection />);

      const uptInput = container.querySelector(
        'input[placeholder*="10 or 5h22m"]',
      ) as HTMLInputElement;
      await user.type(uptInput, '40');

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApplyPreset).toHaveBeenCalledWith(
          expect.objectContaining({
            current_upt: 40,
          }),
          expect.any(Object),
        );
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('submits with hour:minute format (5:30)', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { container } = render(<AmazonPresetSection />);

      const inputs = Array.from(container.querySelectorAll('input[placeholder*="10 or 5h22m"]'));
      const flexInput = inputs[1] as HTMLInputElement;
      await user.type(flexInput, '5:30');

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApplyPreset).toHaveBeenCalledWith(
          expect.objectContaining({
            current_flex: 5.5,
          }),
          expect.any(Object),
        );
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('submits with h/m format (5h22m)', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { container } = render(<AmazonPresetSection />);

      const vacationInput = container.querySelector(
        'input[placeholder*="40 or 5h22m"]',
      ) as HTMLInputElement;
      await user.type(vacationInput, '5h22m');

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApplyPreset).toHaveBeenCalledWith(
          expect.objectContaining({
            current_std: expect.closeTo(5.367, 2),
          }),
          expect.any(Object),
        );
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('handles empty balance fields as undefined', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<AmazonPresetSection />);

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApplyPreset).toHaveBeenCalledWith(
          expect.objectContaining({
            current_upt: undefined,
            current_flex: undefined,
            current_std: undefined,
          }),
          expect.any(Object),
        );
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Form Submission', () => {
    it('shows confirmation dialog before loading presets', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(<AmazonPresetSection />);

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('Amazon default PTO categories'),
      );

      confirmSpy.mockRestore();
    });

    it('cancels submission if user declines confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<AmazonPresetSection />);

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      expect(mockApplyPreset).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('submits with correct payload structure', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      const { container } = render(<AmazonPresetSection />);

      const tenureInput = container.querySelector('input[min="0"][max="50"]') as HTMLInputElement;
      await user.clear(tenureInput);
      await user.type(tenureInput, '3');

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApplyPreset).toHaveBeenCalledWith(
          {
            tenure_years: 3,
            shift_length: 10,
            shifts_per_week: 4,
            current_upt: undefined,
            current_flex: undefined,
            current_std: undefined,
          },
          expect.any(Object),
        );
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('shows loading state during submission', () => {
      vi.mocked(usePTOMutationModule.useApplyAmazonPresetMutation).mockReturnValue({
        mutate: mockApplyPreset,
        isPending: true,
      } as unknown as ReturnType<typeof usePTOMutationModule.useApplyAmazonPresetMutation>);

      render(<AmazonPresetSection />);

      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveTextContent('Loading...');
      expect(submitButton).toBeDisabled();
    });

    it('shows success alert and opens shift modal when createSchedule is true', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockApplyPreset.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<AmazonPresetSection />);

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          expect.stringContaining("Amazon PTO presets loaded! Now let's set up your schedule."),
        );
      });

      // ShiftModal should open
      await waitFor(() => {
        expect(screen.getByText('Add Shift')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('shows success alert and reloads page when createSchedule is false', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      // Mock location.reload by replacing the whole location object
      const originalLocation = window.location;
      delete (window as { location?: Location }).location;
      window.location = { ...originalLocation, reload: vi.fn() } as unknown as Location;

      mockApplyPreset.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<AmazonPresetSection />);

      const checkbox = screen.getByLabelText(/pop out schedule creator after loading presets/i);
      await user.click(checkbox); // Uncheck it

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Amazon PTO presets loaded successfully!');
        expect(window.location.reload).toHaveBeenCalled();
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
      window.location = originalLocation;
    });

    it('shows error alert on submission failure', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockApplyPreset.mockImplementation((_, options) => {
        if (options && 'onError' in options && typeof options.onError === 'function') {
          options.onError(new Error('Test error'), undefined, undefined);
        }
      });

      render(<AmazonPresetSection />);

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to load presets. Please try again.');
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('ShiftModal Integration', () => {
    it('passes correct userPreferences to ShiftModal', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockApplyPreset.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      const { container } = render(<AmazonPresetSection />);

      const shiftLengthInput = container.querySelector('input[step="0.5"]') as HTMLInputElement;
      const shiftsPerWeekInput = container.querySelector(
        'input[min="1"][max="7"]:not([step])',
      ) as HTMLInputElement;

      await user.clear(shiftLengthInput);
      await user.type(shiftLengthInput, '12');

      await user.clear(shiftsPerWeekInput);
      await user.type(shiftsPerWeekInput, '5');

      const submitButton = screen.getByRole('button', { name: /load amazon defaults/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Add Shift')).toBeInTheDocument();
      });

      // Modal should be in recurring mode
      expect(screen.getByText('Recurring Schedule')).toHaveClass('text-primary');

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Validation', () => {
    it('accepts valid numeric inputs', async () => {
      const user = userEvent.setup();
      const { container } = render(<AmazonPresetSection />);

      const tenureInput = container.querySelector('input[min="0"][max="50"]') as HTMLInputElement;
      await user.clear(tenureInput);
      await user.type(tenureInput, '15');

      expect(tenureInput.value).toBe('15');
    });

    it('has input constraints for tenure', () => {
      const { container } = render(<AmazonPresetSection />);
      const tenureInput = container.querySelector('input[min="0"][max="50"]') as HTMLInputElement;
      expect(tenureInput).toBeInTheDocument();
      expect(tenureInput.min).toBe('0');
      expect(tenureInput.max).toBe('50');
    });

    it('has input constraints for shift length', () => {
      const { container } = render(<AmazonPresetSection />);
      const shiftLengthInput = container.querySelector(
        'input[min="1"][max="24"]',
      ) as HTMLInputElement;
      expect(shiftLengthInput).toBeInTheDocument();
      expect(shiftLengthInput.min).toBe('1');
      expect(shiftLengthInput.max).toBe('24');
    });

    it('has input constraints for shifts per week', () => {
      const { container } = render(<AmazonPresetSection />);
      const shiftsPerWeekInput = container.querySelector(
        'input[min="1"][max="7"]',
      ) as HTMLInputElement;
      expect(shiftsPerWeekInput).toBeInTheDocument();
      expect(shiftsPerWeekInput.min).toBe('1');
      expect(shiftsPerWeekInput.max).toBe('7');
    });
  });
});
