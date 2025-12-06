import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Settings from './index';
import * as useUserModule from '../../hooks/api/useUser';
import { type UserProfile } from '../../domain/schemas/user';

// Mock the hooks
vi.mock('../../hooks/api/useUser', () => ({
  useUser: vi.fn(),
  useUserProfile: vi.fn(),
  useUpdateProfileMutation: vi.fn(),
}));

vi.mock('../../hooks/api/usePTO', () => ({
  usePTOCategories: vi.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

vi.mock('../../hooks/api/usePTOMutation', () => ({
  useCreateCategoryMutation: vi.fn(() => ({ mutate: vi.fn() })),
  useUpdateCategoryMutation: vi.fn(() => ({ mutate: vi.fn() })),
  useDeleteCategoryMutation: vi.fn(() => ({ mutate: vi.fn() })),
  useApplyAmazonPresetMutation: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}));

describe('Settings', () => {
  const mockEmployeeUser: UserProfile = {
    id: 1,
    email: 'employee@example.com',
    role: 'employee',
    created_at: '2024-01-01T00:00:00Z',
    full_name: 'Employee User',
    employer: 'Test Company',
    avatar_url: null,
  };

  const mockAdminUser: UserProfile = {
    id: 2,
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    full_name: 'Admin User',
    employer: 'Test Company',
    avatar_url: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserModule.useUserProfile).mockReturnValue({
      data: mockEmployeeUser,
      isLoading: false,
    } as unknown as ReturnType<typeof useUserModule.useUserProfile>);
    vi.mocked(useUserModule.useUpdateProfileMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUserModule.useUpdateProfileMutation>);
  });

  describe('Rendering', () => {
    it('renders page title', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockEmployeeUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders all sections', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockEmployeeUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Amazon PTO Presets')).toBeInTheDocument();
      expect(screen.getByText('Add New PTO Category')).toBeInTheDocument();
    });
  });

  describe('Admin Panel Link', () => {
    it('does not show admin panel link for regular users', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockEmployeeUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });

    it('shows admin panel link for admin users', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockAdminUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('admin panel link has correct href', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockAdminUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      const adminLink = screen.getByText('Admin Panel').closest('a');
      expect(adminLink).toHaveAttribute('href', '/admin');
    });

    it('admin panel link has shield icon', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockAdminUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      const adminLink = screen.getByText('Admin Panel').closest('a');
      const svg = adminLink?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('has proper container styling', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockEmployeeUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      const { container } = render(<Settings />);
      const mainContainer = container.querySelector('.max-w-4xl');
      expect(mainContainer).toBeInTheDocument();
    });

    it('renders header with title and conditional admin link', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: mockEmployeeUser,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      const { container } = render(<Settings />);
      const header = container.querySelector('.flex.items-center.justify-between');
      expect(header).toBeInTheDocument();
      expect(header?.querySelector('h1')).toHaveTextContent('Settings');
    });
  });

  describe('User Context', () => {
    it('handles undefined user data gracefully', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    });

    it('handles loading state', () => {
      vi.mocked(useUserModule.useUser).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useUserModule.useUser>);

      render(<Settings />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });
});
