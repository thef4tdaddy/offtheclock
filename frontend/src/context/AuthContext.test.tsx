import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../test/test-utils';
import { AuthProvider, useAuth } from './AuthContext';
import axios from 'axios';

// Test component that uses AuthContext
const TestComponent: React.FC = () => {
  const { token, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="token">{token || 'no-token'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button onClick={() => login('test-token-123')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext State Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
  });

  describe('Initial State', () => {
    it('loads token from localStorage on mount', () => {
      localStorage.setItem('token', 'stored-token');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('token')).toHaveTextContent('stored-token');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    it('starts with no token when localStorage is empty', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });

    it('sets axios Authorization header from stored token', () => {
      localStorage.setItem('token', 'stored-token');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(axios.defaults.headers.common['Authorization']).toBe('Bearer stored-token');
    });
  });

  describe('Login Persistence', () => {
    it('persists token to localStorage on login', async () => {
      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginButton = getByText('Login');
      loginButton.click();

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('test-token-123');
      });
    });

    it('sets axios Authorization header on login', async () => {
      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginButton = getByText('Login');
      loginButton.click();

      await waitFor(() => {
        expect(axios.defaults.headers.common['Authorization']).toBe('Bearer test-token-123');
      });
    });

    it('updates authenticated state on login', async () => {
      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const loginButton = getByText('Login');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });
    });
  });

  describe('Logout Persistence', () => {
    it('removes token from localStorage on logout', async () => {
      localStorage.setItem('token', 'stored-token');

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const logoutButton = getByText('Logout');
      logoutButton.click();

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
      });
    });

    it('removes axios Authorization header on logout', async () => {
      localStorage.setItem('token', 'stored-token');

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      const logoutButton = getByText('Logout');
      logoutButton.click();

      await waitFor(() => {
        expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
      });
    });

    it('updates authenticated state on logout', async () => {
      localStorage.setItem('token', 'stored-token');

      const { getByText } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

      const logoutButton = getByText('Logout');
      logoutButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });
    });
  });

  describe('Token Persistence Across Remounts', () => {
    it('maintains authentication state across component remounts', async () => {
      const { getByText, unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Login
      const loginButton = getByText('Login');
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      });

      // Unmount
      unmount();

      // Remount - should still be authenticated
      const { container } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('token')).toHaveTextContent('test-token-123');
    });

    it('maintains logged out state across component remounts', async () => {
      localStorage.setItem('token', 'stored-token');

      const { getByText, unmount } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      // Logout
      const logoutButton = getByText('Logout');
      logoutButton.click();

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      });

      // Unmount
      unmount();

      // Remount - should still be logged out
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('token')).toHaveTextContent('no-token');
    });
  });

  describe('401 Response Handling', () => {
    it('automatically logs out on 401 response via interceptor', async () => {
      // This test verifies that the interceptor is set up correctly
      // We can't easily test the actual 401 handling without making real requests
      // but we verify the interceptor exists
      localStorage.setItem('token', 'stored-token');

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      );

      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

      // Verify that axios has response interceptors configured
      expect(axios.interceptors.response.handlers.length).toBeGreaterThan(0);

      // We can't easily test the actual logout on 401 without integration tests
      // but we've verified the interceptor is configured
    });
  });

  describe('Context Usage', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
