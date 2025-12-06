import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import PTOSection from './PTOSection';
import * as usePTOModule from '../../hooks/api/usePTO';
import * as usePTOMutationModule from '../../hooks/api/usePTOMutation';
import { type PTOCategory } from '../../domain/schemas/pto';

// Mock the hooks
vi.mock('../../hooks/api/usePTO', () => ({
  usePTOCategories: vi.fn(),
}));

vi.mock('../../hooks/api/usePTOMutation', () => ({
  useCreateCategoryMutation: vi.fn(),
  useUpdateCategoryMutation: vi.fn(),
  useDeleteCategoryMutation: vi.fn(),
}));

describe('PTOSection', () => {
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

  const mockCreateCategory = vi.fn();
  const mockUpdateCategory = vi.fn();
  const mockDeleteCategory = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePTOModule.usePTOCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as unknown as ReturnType<typeof usePTOModule.usePTOCategories>);
    vi.mocked(usePTOMutationModule.useCreateCategoryMutation).mockReturnValue({
      mutate: mockCreateCategory,
    } as unknown as ReturnType<typeof usePTOMutationModule.useCreateCategoryMutation>);
    vi.mocked(usePTOMutationModule.useUpdateCategoryMutation).mockReturnValue({
      mutate: mockUpdateCategory,
    } as unknown as ReturnType<typeof usePTOMutationModule.useUpdateCategoryMutation>);
    vi.mocked(usePTOMutationModule.useDeleteCategoryMutation).mockReturnValue({
      mutate: mockDeleteCategory,
    } as unknown as ReturnType<typeof usePTOMutationModule.useDeleteCategoryMutation>);
  });

  describe('Rendering', () => {
    it('renders section titles', () => {
      render(<PTOSection />);
      expect(screen.getByText('Add New PTO Category')).toBeInTheDocument();
      expect(screen.getByText('Existing Categories')).toBeInTheDocument();
    });

    it('renders form fields', () => {
      render(<PTOSection />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Accrual Rate')).toBeInTheDocument();
      expect(screen.getByText('Max Balance (Cap)')).toBeInTheDocument();
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('Initial Balance')).toBeInTheDocument();
    });

    it('renders create button', () => {
      render(<PTOSection />);
      expect(screen.getByRole('button', { name: /create category/i })).toBeInTheDocument();
    });

    it('displays loading state', () => {
      vi.mocked(usePTOModule.usePTOCategories).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof usePTOModule.usePTOCategories>);

      render(<PTOSection />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Existing Categories Display', () => {
    it('displays all existing categories', () => {
      render(<PTOSection />);
      expect(screen.getByText('Vacation')).toBeInTheDocument();
      expect(screen.getByText('Sick Leave')).toBeInTheDocument();
    });

    it('displays category details correctly', () => {
      render(<PTOSection />);
      expect(screen.getByText(/4h \/ biweekly/i)).toBeInTheDocument();
      expect(screen.getByText(/2h \/ weekly/i)).toBeInTheDocument();
    });

    it('shows "No categories found" when list is empty', () => {
      vi.mocked(usePTOModule.usePTOCategories).mockReturnValue({
        data: [],
        isLoading: false,
      } as unknown as ReturnType<typeof usePTOModule.usePTOCategories>);

      render(<PTOSection />);
      expect(screen.getByText('No categories found.')).toBeInTheDocument();
    });

    it('renders edit and delete buttons for each category', () => {
      render(<PTOSection />);
      const editButtons = screen.getAllByTitle('Edit Category');
      const deleteButtons = screen.getAllByTitle('Delete Category');

      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  describe('Form Inputs', () => {
    it('has default values for form fields', () => {
      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      const initialInput = screen.getByPlaceholderText('e.g. 10h 30m') as HTMLInputElement;
      const maxInput = screen.getByPlaceholderText('Optional (e.g. 120h)') as HTMLInputElement;

      expect(nameInput.value).toBe('');
      expect(rateInput.value).toBe('');
      expect(initialInput.value).toBe('0');
      expect(maxInput.value).toBe('');
    });

    it('allows changing name input', async () => {
      const user = userEvent.setup();
      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'New Category');

      expect(nameInput.value).toBe('New Category');
    });

    it('allows changing accrual rate', async () => {
      const user = userEvent.setup();
      render(<PTOSection />);

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '4h');

      expect(rateInput.value).toBe('4h');
    });

    it('allows selecting frequency', async () => {
      const user = userEvent.setup();
      render(<PTOSection />);

      const frequencySelect = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(frequencySelect, 'monthly');

      expect(frequencySelect.value).toBe('monthly');
    });
  });

  describe('Category Creation', () => {
    it('submits with valid data', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test Category');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '4');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Category',
            accrual_rate: 4,
            accrual_frequency: 'biweekly',
            starting_balance: 0,
          }),
          expect.any(Object),
        );
      });

      alertSpy.mockRestore();
    });

    it('shows success alert on successful creation', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test Category');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '4');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Category created successfully!');
      });

      alertSpy.mockRestore();
    });

    it('shows error alert on invalid duration format', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test Category');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, 'invalid');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Please enter valid time formats (e.g. "4h", "1:30", "1.5")',
        );
      });

      alertSpy.mockRestore();
    });

    it('shows error alert on creation failure', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateCategory.mockImplementation((_, options) => {
        if (options && 'onError' in options && typeof options.onError === 'function') {
          options.onError(new Error('Test error'), undefined, undefined);
        }
      });

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test Category');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '4');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to create category');
      });

      alertSpy.mockRestore();
    });
  });

  describe('Category Editing', () => {
    it('populates form when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<PTOSection />);

      const editButtons = screen.getAllByTitle('Edit Category');
      await user.click(editButtons[0]);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;

      expect(screen.getByText('Edit Category')).toBeInTheDocument();
      expect(nameInput.value).toBe('Vacation');
      expect(rateInput.value).toBe('4h');
    });

    it('shows cancel button in edit mode', async () => {
      const user = userEvent.setup();
      render(<PTOSection />);

      const editButtons = screen.getAllByTitle('Edit Category');
      await user.click(editButtons[0]);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update category/i })).toBeInTheDocument();
    });

    it('submits update with correct payload', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockUpdateCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const editButtons = screen.getAllByTitle('Edit Category');
      await user.click(editButtons[0]);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Vacation');

      const submitButton = screen.getByRole('button', { name: /update category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            payload: expect.objectContaining({
              name: 'Updated Vacation',
            }),
          }),
          expect.any(Object),
        );
      });

      alertSpy.mockRestore();
    });

    it('resets form on cancel', async () => {
      const user = userEvent.setup();
      render(<PTOSection />);

      const editButtons = screen.getAllByTitle('Edit Category');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Category')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText('Add New PTO Category')).toBeInTheDocument();
      expect(screen.queryByText('Edit Category')).not.toBeInTheDocument();
    });
  });

  describe('Category Deletion', () => {
    it('shows confirmation dialog before deletion', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<PTOSection />);

      const deleteButtons = screen.getAllByTitle('Delete Category');
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this category? This action cannot be undone.',
      );
      expect(mockDeleteCategory).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('deletes category on confirmation', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockDeleteCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const deleteButtons = screen.getAllByTitle('Delete Category');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockDeleteCategory).toHaveBeenCalledWith(1, expect.any(Object));
      });

      confirmSpy.mockRestore();
    });

    it('shows error alert on deletion failure', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockDeleteCategory.mockImplementation((_, options) => {
        if (options && 'onError' in options && typeof options.onError === 'function') {
          options.onError(new Error('Test error'), undefined, undefined);
        }
      });

      render(<PTOSection />);

      const deleteButtons = screen.getAllByTitle('Delete Category');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to delete category');
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it('resets form if editing category is deleted', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      mockDeleteCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      // Enter edit mode
      const editButtons = screen.getAllByTitle('Edit Category');
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Category')).toBeInTheDocument();

      // Delete the same category
      const deleteButtons = screen.getAllByTitle('Delete Category');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Add New PTO Category')).toBeInTheDocument();
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Duration Parsing', () => {
    it('parses hour format (4h)', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '4h');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            accrual_rate: 4,
          }),
          expect.any(Object),
        );
      });

      alertSpy.mockRestore();
    });

    it('parses decimal format (1.5)', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '1.5');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            accrual_rate: 1.5,
          }),
          expect.any(Object),
        );
      });

      alertSpy.mockRestore();
    });

    it('handles optional max balance', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockCreateCategory.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<PTOSection />);

      const nameInput = screen.getByPlaceholderText('e.g. Sabbatical') as HTMLInputElement;
      await user.type(nameInput, 'Test');

      const rateInput = screen.getByPlaceholderText('e.g. 4h, 1.5, 90m') as HTMLInputElement;
      await user.type(rateInput, '4');

      const maxInput = screen.getByPlaceholderText('Optional (e.g. 120h)') as HTMLInputElement;
      await user.type(maxInput, '120');

      const submitButton = screen.getByRole('button', { name: /create category/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            max_balance: 120,
          }),
          expect.any(Object),
        );
      });

      alertSpy.mockRestore();
    });
  });
});
