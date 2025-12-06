import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import userEvent from '@testing-library/user-event';
import Layout from './Layout';
import * as AuthContext from '../context/AuthContext';

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Layout', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      logout: mockLogout,
    } as unknown as ReturnType<typeof AuthContext.useAuth>);
  });

  describe('Rendering', () => {
    it('renders children content', () => {
      render(
        <Layout>
          <div>Test Content</div>
        </Layout>,
      );
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders sidebar on desktop', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      const sidebar = container.querySelector('aside');
      expect(sidebar).toBeInTheDocument();
    });

    it('renders navigation links', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Desktop navigation links
      const homeLinks = screen.getAllByText('Home');
      const calendarLinks = screen.getAllByText('Calendar');
      const historyLinks = screen.getAllByText('History');
      const projectionsLinks = screen.getAllByText('Projections');
      const settingsLinks = screen.getAllByText('Settings');

      expect(homeLinks.length).toBeGreaterThan(0);
      expect(calendarLinks.length).toBeGreaterThan(0);
      expect(historyLinks.length).toBeGreaterThan(0);
      expect(projectionsLinks.length).toBeGreaterThan(0);
      expect(settingsLinks.length).toBeGreaterThan(0);
    });

    it('renders logout button', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      const logoutButtons = screen.getAllByText('Logout');
      expect(logoutButtons.length).toBeGreaterThan(0);
    });

    it('renders logo', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      const logos = container.querySelectorAll('img[alt="OffTheClock"]');
      expect(logos.length).toBeGreaterThan(0);
    });
  });

  describe('Desktop Sidebar', () => {
    it('renders sidebar in expanded state by default', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-64');
      expect(sidebar).not.toHaveClass('w-20');
    });

    it('shows full logo when expanded', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      const logo = container.querySelector('img[src*="OffTheClock-Logo-With-Text"]');
      expect(logo).toBeInTheDocument();
    });

    it('shows navigation labels when expanded', () => {
      render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Calendar').length).toBeGreaterThan(0);
    });

    it('toggles sidebar to collapsed state', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Find collapse button (ChevronLeft icon button)
      const collapseButton = container.querySelector('aside button:last-child');
      expect(collapseButton).toBeInTheDocument();

      if (collapseButton) {
        await user.click(collapseButton);
      }

      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar).toHaveClass('w-20');
      });
    });

    it('shows icon-only logo when collapsed', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const collapseButton = container.querySelector('aside button:last-child');
      if (collapseButton) {
        await user.click(collapseButton);
      }

      await waitFor(() => {
        const logo = container.querySelector('img[src*="logo-icon-only"]');
        expect(logo).toBeInTheDocument();
      });
    });

    it('toggles back to expanded state', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const collapseButton = container.querySelector('aside button:last-child');

      // Collapse
      if (collapseButton) {
        await user.click(collapseButton);
      }

      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar).toHaveClass('w-20');
      });

      // Expand
      if (collapseButton) {
        await user.click(collapseButton);
      }

      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar).toHaveClass('w-64');
      });
    });
  });

  describe('Mobile Menu', () => {
    it('mobile menu is closed by default', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );
      const mobileOverlay = container.querySelector('.fixed.inset-0.bg-dark-blue');
      expect(mobileOverlay).not.toBeInTheDocument();
    });

    it('opens mobile menu when hamburger button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Find mobile menu button (Menu icon)
      const mobileButtons = container.querySelectorAll('.md\\:hidden button');
      const menuButton = Array.from(mobileButtons).find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && !btn.querySelector('svg + svg'); // Menu icon, not X icon
      });

      if (menuButton) {
        await user.click(menuButton);
      }

      await waitFor(() => {
        const mobileOverlay = container.querySelector('.fixed.inset-0');
        expect(mobileOverlay).toBeInTheDocument();
      });
    });

    it('closes mobile menu when X button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Open menu
      const mobileButtons = container.querySelectorAll('.md\\:hidden button');
      const menuButton = Array.from(mobileButtons)[0];
      if (menuButton) {
        await user.click(menuButton);
      }

      await waitFor(() => {
        const mobileOverlay = container.querySelector('.fixed.inset-0');
        expect(mobileOverlay).toBeInTheDocument();
      });

      // Close menu
      const closeButtons = container.querySelectorAll('.md\\:hidden button');
      const xButton = Array.from(closeButtons).find((btn) => btn.textContent === '');
      if (xButton) {
        await user.click(xButton);
      }

      await waitFor(() => {
        const mobileOverlay = container.querySelector('.fixed.inset-0');
        expect(mobileOverlay).not.toBeInTheDocument();
      });
    });

    it('renders navigation links in mobile menu', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Open mobile menu
      const mobileButtons = container.querySelectorAll('.md\\:hidden button');
      const menuButton = Array.from(mobileButtons)[0];
      if (menuButton) {
        await user.click(menuButton);
      }

      await waitFor(() => {
        expect(screen.getAllByText('Home').length).toBeGreaterThan(1);
        expect(screen.getAllByText('Calendar').length).toBeGreaterThan(1);
        expect(screen.getAllByText('History').length).toBeGreaterThan(1);
        expect(screen.getAllByText('Projections').length).toBeGreaterThan(1);
        expect(screen.getAllByText('Settings').length).toBeGreaterThan(1);
      });
    });

    it('closes mobile menu when navigation link is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Open menu
      const mobileButtons = container.querySelectorAll('.md\\:hidden button');
      const menuButton = Array.from(mobileButtons)[0];
      if (menuButton) {
        await user.click(menuButton);
      }

      await waitFor(() => {
        const mobileOverlay = container.querySelector('.fixed.inset-0');
        expect(mobileOverlay).toBeInTheDocument();
      });

      // Click a nav link - find the mobile menu version (inside the overlay)
      const mobileOverlay = container.querySelector('.fixed.inset-0');
      const navLinks = mobileOverlay?.querySelectorAll('a');
      if (navLinks && navLinks.length > 0) {
        await user.click(navLinks[0]);
      }

      await waitFor(() => {
        const overlay = container.querySelector('.fixed.inset-0');
        expect(overlay).not.toBeInTheDocument();
      });
    });
  });

  describe('Logout Functionality', () => {
    it('calls logout when desktop logout button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Find desktop logout button (in sidebar)
      const sidebar = container.querySelector('aside');
      const logoutButton = sidebar?.querySelector('button');

      if (logoutButton) {
        await user.click(logoutButton);
      }

      expect(mockLogout).toHaveBeenCalled();
    });

    it('calls logout when mobile logout button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Open mobile menu
      const mobileButtons = container.querySelectorAll('.md\\:hidden button');
      const menuButton = Array.from(mobileButtons)[0];
      if (menuButton) {
        await user.click(menuButton);
      }

      await waitFor(() => {
        const mobileOverlay = container.querySelector('.fixed.inset-0');
        expect(mobileOverlay).toBeInTheDocument();
      });

      // Find and click logout in mobile menu
      const logoutButtons = screen.getAllByText('Logout');
      const mobileLogout = logoutButtons[logoutButtons.length - 1]; // Last one is mobile
      await user.click(mobileLogout);

      expect(mockLogout).toHaveBeenCalled();
    });

    it('closes mobile menu after logout', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      // Open mobile menu
      const mobileButtons = container.querySelectorAll('.md\\:hidden button');
      const menuButton = Array.from(mobileButtons)[0];
      if (menuButton) {
        await user.click(menuButton);
      }

      await waitFor(() => {
        const mobileOverlay = container.querySelector('.fixed.inset-0');
        expect(mobileOverlay).toBeInTheDocument();
      });

      // Click logout
      const logoutButtons = screen.getAllByText('Logout');
      const mobileLogout = logoutButtons[logoutButtons.length - 1];
      await user.click(mobileLogout);

      await waitFor(() => {
        const overlay = container.querySelector('.fixed.inset-0');
        expect(overlay).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('hides sidebar on mobile screens', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('hidden');
      expect(sidebar).toHaveClass('md:flex');
    });

    it('shows mobile header with logo', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const mobileHeader = container.querySelector('.md\\:hidden.fixed');
      expect(mobileHeader).toBeInTheDocument();

      const logo = mobileHeader?.querySelector('img[alt="OffTheClock"]');
      expect(logo).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('has correct href attributes', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const homeLink = container.querySelector('a[href="/"]');
      const calendarLink = container.querySelector('a[href="/calendar"]');
      const historyLink = container.querySelector('a[href="/history"]');
      const projectionsLink = container.querySelector('a[href="/projections"]');
      const settingsLink = container.querySelector('a[href="/settings"]');

      expect(homeLink).toBeInTheDocument();
      expect(calendarLink).toBeInTheDocument();
      expect(historyLink).toBeInTheDocument();
      expect(projectionsLink).toBeInTheDocument();
      expect(settingsLink).toBeInTheDocument();
    });

    it('shows icons for all navigation items', () => {
      const { container } = render(
        <Layout>
          <div>Content</div>
        </Layout>,
      );

      const sidebar = container.querySelector('aside');
      const icons = sidebar?.querySelectorAll('svg');

      // Should have icons for: Home, Calendar, Clock, TrendingUp, Settings, LogOut, Chevron
      expect(icons && icons.length).toBeGreaterThan(5);
    });
  });

  describe('State Persistence', () => {
    it('maintains sidebar state across rerenders', async () => {
      const user = userEvent.setup();
      const { container, rerender } = render(
        <Layout>
          <div>Content 1</div>
        </Layout>,
      );

      // Collapse sidebar
      const collapseButton = container.querySelector('aside button:last-child');
      if (collapseButton) {
        await user.click(collapseButton);
      }

      await waitFor(() => {
        const sidebar = container.querySelector('aside');
        expect(sidebar).toHaveClass('w-20');
      });

      // Rerender with new children
      rerender(
        <Layout>
          <div>Content 2</div>
        </Layout>,
      );

      // Sidebar should still be collapsed
      const sidebar = container.querySelector('aside');
      expect(sidebar).toHaveClass('w-20');
    });
  });
});
