import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/test-utils';
import userEvent from '@testing-library/user-event';
import ProfileSection from './ProfileSection';
import * as useUserModule from '../../hooks/api/useUser';
import { type UserProfile } from '../../domain/schemas/user';

// Mock the hooks
vi.mock('../../hooks/api/useUser', () => ({
  useUserProfile: vi.fn(),
  useUpdateProfileMutation: vi.fn(),
}));

describe('ProfileSection', () => {
  const mockProfileData: UserProfile = {
    id: 1,
    email: 'test@example.com',
    role: 'employee',
    created_at: '2024-01-01T00:00:00Z',
    full_name: 'John Doe',
    employer: 'Test Company',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  const mockUpdateProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserModule.useUserProfile).mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    } as unknown as ReturnType<typeof useUserModule.useUserProfile>);
    vi.mocked(useUserModule.useUpdateProfileMutation).mockReturnValue({
      mutate: mockUpdateProfile,
      isPending: false,
    } as unknown as ReturnType<typeof useUserModule.useUpdateProfileMutation>);
  });

  describe('Rendering', () => {
    it('renders section title', () => {
      render(<ProfileSection />);
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    it('renders all form fields', () => {
      render(<ProfileSection />);
      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Employer')).toBeInTheDocument();
      expect(screen.getByText('Avatar URL')).toBeInTheDocument();
    });

    it('renders save button', () => {
      render(<ProfileSection />);
      expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    });

    it('displays loading state when fetching profile', () => {
      vi.mocked(useUserModule.useUserProfile).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useUserModule.useUserProfile>);

      render(<ProfileSection />);
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });
  });

  describe('Form Population', () => {
    it('populates form with profile data', () => {
      render(<ProfileSection />);

      const fullNameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
      const employerInput = screen.getByPlaceholderText('e.g. Amazon') as HTMLInputElement;
      const avatarInput = screen.getByPlaceholderText(
        'https://example.com/avatar.jpg',
      ) as HTMLInputElement;

      expect(fullNameInput.value).toBe('John Doe');
      expect(employerInput.value).toBe('Test Company');
      expect(avatarInput.value).toBe('https://example.com/avatar.jpg');
    });

    it('handles null profile values', () => {
      vi.mocked(useUserModule.useUserProfile).mockReturnValue({
        data: {
          ...mockProfileData,
          full_name: null,
          employer: null,
          avatar_url: null,
        },
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUserProfile>);

      render(<ProfileSection />);

      const fullNameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
      const employerInput = screen.getByPlaceholderText('e.g. Amazon') as HTMLInputElement;
      const avatarInput = screen.getByPlaceholderText(
        'https://example.com/avatar.jpg',
      ) as HTMLInputElement;

      expect(fullNameInput.value).toBe('');
      expect(employerInput.value).toBe('');
      expect(avatarInput.value).toBe('');
    });
  });

  describe('Form Interactions', () => {
    it('allows changing full name', async () => {
      const user = userEvent.setup();
      render(<ProfileSection />);

      const fullNameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Jane Smith');

      expect(fullNameInput.value).toBe('Jane Smith');
    });

    it('allows changing employer', async () => {
      const user = userEvent.setup();
      render(<ProfileSection />);

      const employerInput = screen.getByPlaceholderText('e.g. Amazon') as HTMLInputElement;
      await user.clear(employerInput);
      await user.type(employerInput, 'New Company');

      expect(employerInput.value).toBe('New Company');
    });

    it('allows changing avatar URL', async () => {
      const user = userEvent.setup();
      render(<ProfileSection />);

      const avatarInput = screen.getByPlaceholderText(
        'https://example.com/avatar.jpg',
      ) as HTMLInputElement;
      await user.clear(avatarInput);
      await user.type(avatarInput, 'https://example.com/new-avatar.jpg');

      expect(avatarInput.value).toBe('https://example.com/new-avatar.jpg');
    });
  });

  describe('Form Submission', () => {
    it('submits with correct payload', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Mock location.reload
      const originalLocation = window.location;
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      mockUpdateProfile.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<ProfileSection />);

      const fullNameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
      await user.clear(fullNameInput);
      await user.type(fullNameInput, 'Updated Name');

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith(
          {
            full_name: 'Updated Name',
            employer: 'Test Company',
            avatar_url: 'https://example.com/avatar.jpg',
          },
          expect.any(Object),
        );
      });

      alertSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('shows loading state during submission', () => {
      vi.mocked(useUserModule.useUpdateProfileMutation).mockReturnValue({
        mutate: mockUpdateProfile,
        isPending: true,
      } as unknown as ReturnType<typeof useUserModule.useUpdateProfileMutation>);

      render(<ProfileSection />);

      const submitButton = screen.getByRole('button');
      expect(submitButton).toHaveTextContent('Saving...');
      expect(submitButton).toBeDisabled();
    });

    it('shows success alert and reloads on successful update', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Mock location.reload
      const originalLocation = window.location;
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      mockUpdateProfile.mockImplementation((_, options) => {
        if (options && 'onSuccess' in options && typeof options.onSuccess === 'function') {
          options.onSuccess(undefined, undefined, undefined);
        }
      });

      render(<ProfileSection />);

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Profile updated successfully!');
        expect(reloadMock).toHaveBeenCalled();
      });

      alertSpy.mockRestore();
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('shows error alert on submission failure', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      mockUpdateProfile.mockImplementation((_, options) => {
        if (options && 'onError' in options && typeof options.onError === 'function') {
          options.onError(new Error('Test error'), undefined, undefined);
        }
      });

      render(<ProfileSection />);

      const submitButton = screen.getByRole('button', { name: /save profile/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to update profile');
      });

      alertSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('updates state when profile data changes', async () => {
      const { rerender } = render(<ProfileSection />);

      const fullNameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
      expect(fullNameInput.value).toBe('John Doe');

      // Update the mock to return new data
      vi.mocked(useUserModule.useUserProfile).mockReturnValue({
        data: {
          ...mockProfileData,
          full_name: 'New Name',
        },
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUserProfile>);

      rerender(<ProfileSection />);

      await waitFor(() => {
        expect(fullNameInput.value).toBe('New Name');
      });
    });

    it('does not update state unnecessarily when data is the same', () => {
      const { rerender } = render(<ProfileSection />);

      const fullNameInput = screen.getByPlaceholderText('e.g. John Doe') as HTMLInputElement;
      const initialValue = fullNameInput.value;

      // Rerender with same data
      rerender(<ProfileSection />);

      expect(fullNameInput.value).toBe(initialValue);
    });
  });
});
