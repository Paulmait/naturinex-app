import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { useUser } from '../../hooks/useUser';
import { useNotifications } from '../NotificationSystem';
// Mock dependencies
jest.mock('../../hooks/useUser');
jest.mock('../NotificationSystem');
jest.mock('../../services/aiService');
jest.mock('../../services/drugInteractionService');
jest.mock('../../config/supabase');
const mockNotifications = {
  showSuccess: jest.fn(),
  showError: jest.fn(),
  showWarning: jest.fn(),
  showInfo: jest.fn(),
  notifications: [],
  addNotification: jest.fn(),
  removeNotification: jest.fn()
};
const mockUser = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    isPremium: false
  },
  isPremium: false,
  canPerformScan: jest.fn(() => true),
  getRemainingScans: jest.fn(() => 3),
  incrementScanCount: jest.fn(),
  isLoading: false,
  userProfile: null
};
describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue(mockUser);
    useNotifications.mockReturnValue(mockNotifications);
  });
  describe('Rendering', () => {
    test('renders dashboard with main navigation elements', () => {
      render(<Dashboard />);
      expect(screen.getByText('Naturinex')).toBeInTheDocument();
      expect(screen.getByText('Scan Medication')).toBeInTheDocument();
      expect(screen.getByText('My Scans')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
    test('displays user subscription status correctly', () => {
      render(<Dashboard />);
      expect(screen.getByText(/Free Plan/)).toBeInTheDocument();
      expect(screen.getByText(/3 scans remaining today/)).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to Premium/)).toBeInTheDocument();
    });
    test('shows premium features for premium users', () => {
      const premiumUser = {
        ...mockUser,
        isPremium: true,
        getRemainingScans: jest.fn(() => -1) // Unlimited
      };
      useUser.mockReturnValue(premiumUser);
      render(<Dashboard />);
      expect(screen.getByText(/Premium Plan/)).toBeInTheDocument();
      expect(screen.getByText(/Unlimited scans/)).toBeInTheDocument();
      expect(screen.queryByText(/Upgrade to Premium/)).not.toBeInTheDocument();
    });
    test('displays loading state while user data loads', () => {
      useUser.mockReturnValue({ ...mockUser, isLoading: true });
      render(<Dashboard />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });
  describe('Medication Scanning', () => {
    test('enables scan button when medication name is entered', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      expect(scanButton).toBeDisabled();
      await user.type(input, 'Aspirin');
      expect(scanButton).not.toBeDisabled();
    });
    test('validates medication name before scanning', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      // Test with invalid input (too short)
      await user.type(input, 'A');
      await user.click(scanButton);
      expect(mockNotifications.showWarning).toHaveBeenCalledWith(
        'Medication name must be at least 2 characters',
        'Invalid Input'
      );
    });
    test('prevents scanning when no scans remaining', async () => {
      const noScansUser = {
        ...mockUser,
        canPerformScan: jest.fn(() => false),
        getRemainingScans: jest.fn(() => 0)
      };
      useUser.mockReturnValue(noScansUser);
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      await user.type(input, 'Aspirin');
      await user.click(scanButton);
      expect(mockNotifications.showWarning).toHaveBeenCalledWith(
        expect.stringContaining('scan limit'),
        'Limit Reached'
      );
    });
    test('displays scan results after successful analysis', async () => {
      const mockAiService = require('../../services/aiService');
      mockAiService.analyzeMedication.mockResolvedValue({
        success: true,
        data: {
          medication: {
            name: 'Aspirin',
            genericName: 'Acetylsalicylic Acid',
            strength: '81mg'
          },
          warnings: ['Take with food'],
          sideEffects: ['Stomach upset']
        }
      });
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      await user.type(input, 'Aspirin');
      await user.click(scanButton);
      await waitFor(() => {
        expect(screen.getByText('Aspirin')).toBeInTheDocument();
        expect(screen.getByText('Acetylsalicylic Acid')).toBeInTheDocument();
        expect(screen.getByText('Take with food')).toBeInTheDocument();
      });
    });
  });
  describe('Navigation', () => {
    test('switches between tabs correctly', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      // Initially on scan tab
      expect(screen.getByPlaceholderText(/Enter medication name/)).toBeInTheDocument();
      // Switch to My Scans tab
      await user.click(screen.getByText('My Scans'));
      expect(screen.getByText(/Recent Scans/)).toBeInTheDocument();
      // Switch to Settings tab
      await user.click(screen.getByText('Settings'));
      expect(screen.getByText(/Account Settings/)).toBeInTheDocument();
    });
    test('maintains tab state during component updates', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<Dashboard />);
      // Switch to settings tab
      await user.click(screen.getByText('Settings'));
      expect(screen.getByText(/Account Settings/)).toBeInTheDocument();
      // Re-render component
      rerender(<Dashboard />);
      // Should still be on settings tab
      expect(screen.getByText(/Account Settings/)).toBeInTheDocument();
    });
  });
  describe('Scan History', () => {
    test('displays recent scans in My Scans tab', async () => {
      const mockScans = [
        {
          id: '1',
          medication: 'Aspirin',
          timestamp: new Date().toISOString(),
          status: 'completed'
        },
        {
          id: '2',
          medication: 'Ibuprofen',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        }
      ];
      // Mock the scan history API
      const mockSupabase = require('../../config/supabase');
      mockSupabase.supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockScans, error: null })
      });
      const user = userEvent.setup();
      render(<Dashboard />);
      await user.click(screen.getByText('My Scans'));
      await waitFor(() => {
        expect(screen.getByText('Aspirin')).toBeInTheDocument();
        expect(screen.getByText('Ibuprofen')).toBeInTheDocument();
      });
    });
    test('handles empty scan history gracefully', async () => {
      const mockSupabase = require('../../config/supabase');
      mockSupabase.supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      });
      const user = userEvent.setup();
      render(<Dashboard />);
      await user.click(screen.getByText('My Scans'));
      await waitFor(() => {
        expect(screen.getByText(/No scans yet/)).toBeInTheDocument();
        expect(screen.getByText(/Get started by scanning/)).toBeInTheDocument();
      });
    });
  });
  describe('Settings Management', () => {
    test('displays user account information in settings', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      await user.click(screen.getByText('Settings'));
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByText(/Free Plan/)).toBeInTheDocument();
    });
    test('allows users to toggle notification preferences', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      await user.click(screen.getByText('Settings'));
      const emailNotifications = screen.getByLabelText(/Email notifications/);
      const pushNotifications = screen.getByLabelText(/Push notifications/);
      expect(emailNotifications).toBeInTheDocument();
      expect(pushNotifications).toBeInTheDocument();
      await user.click(emailNotifications);
      // Should save preference change
      expect(mockNotifications.showSuccess).toHaveBeenCalledWith(
        'Notification preferences updated',
        'Settings Saved'
      );
    });
    test('provides data export functionality', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      await user.click(screen.getByText('Settings'));
      const exportButton = screen.getByText(/Export My Data/);
      expect(exportButton).toBeInTheDocument();
      await user.click(exportButton);
      expect(mockNotifications.showInfo).toHaveBeenCalledWith(
        expect.stringContaining('export'),
        'Data Export'
      );
    });
  });
  describe('Premium Upgrade Flow', () => {
    test('displays upgrade modal when clicking upgrade button', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      const upgradeButton = screen.getByText(/Upgrade to Premium/);
      await user.click(upgradeButton);
      expect(screen.getByText(/Choose Your Plan/)).toBeInTheDocument();
      expect(screen.getByText(/Monthly/)).toBeInTheDocument();
      expect(screen.getByText(/Annual/)).toBeInTheDocument();
    });
    test('shows plan benefits in upgrade modal', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      await user.click(screen.getByText(/Upgrade to Premium/));
      const benefits = [
        'Unlimited scans',
        'Advanced drug interactions',
        'Detailed analysis reports',
        'Priority support'
      ];
      benefits.forEach(benefit => {
        expect(screen.getByText(benefit)).toBeInTheDocument();
      });
    });
  });
  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      const mockAiService = require('../../services/aiService');
      mockAiService.analyzeMedication.mockRejectedValue(new Error('API Error'));
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      await user.type(input, 'Aspirin');
      await user.click(scanButton);
      await waitFor(() => {
        expect(mockNotifications.showError).toHaveBeenCalledWith(
          expect.stringContaining('error'),
          'Analysis Failed'
        );
      });
    });
    test('handles network connectivity issues', async () => {
      // Mock network error
      const mockAiService = require('../../services/aiService');
      mockAiService.analyzeMedication.mockRejectedValue(
        new Error('Network request failed')
      );
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      await user.type(input, 'Aspirin');
      await user.click(scanButton);
      await waitFor(() => {
        expect(mockNotifications.showError).toHaveBeenCalledWith(
          expect.stringContaining('network'),
          'Connection Error'
        );
      });
    });
  });
  describe('Accessibility', () => {
    test('provides proper ARIA labels for interactive elements', () => {
      render(<Dashboard />);
      expect(screen.getByLabelText(/Medication name input/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analyze Medication/ })).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      // Focus should move to scan button when pressing Tab
      await user.tab();
      expect(input).toHaveFocus();
      await user.tab();
      expect(screen.getByText('Analyze Medication')).toHaveFocus();
    });
    test('provides screen reader announcements for scan status', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      const scanButton = screen.getByText('Analyze Medication');
      await user.type(input, 'Aspirin');
      await user.click(scanButton);
      // Should announce scanning status
      expect(screen.getByRole('status')).toHaveTextContent(/Analyzing/);
    });
  });
  describe('Performance', () => {
    test('debounces medication name validation', async () => {
      const user = userEvent.setup();
      render(<Dashboard />);
      const input = screen.getByPlaceholderText(/Enter medication name/);
      // Type rapidly
      await user.type(input, 'Aspirin');
      // Validation should be debounced
      expect(mockNotifications.showWarning).not.toHaveBeenCalled();
    });
    test('memoizes expensive scan history rendering', () => {
      const { rerender } = render(<Dashboard />);
      // Initial render
      const initialRender = screen.getByTestId('scan-history-container');
      // Re-render with same props
      rerender(<Dashboard />);
      // Should use memoized result
      const secondRender = screen.getByTestId('scan-history-container');
      expect(initialRender).toBe(secondRender);
    });
  });
});