import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { useNotifications } from './components/NotificationSystem';

// Mock Firebase
jest.mock('./firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn((callback) => {
      callback(null); // Simulate no user
      return jest.fn(); // Return unsubscribe function
    })
  },
  db: {}
}));

// Mock analytics
jest.mock('./utils/analytics', () => ({
  __esModule: true,
  default: {
    getAnalytics: jest.fn(() => Promise.resolve({}))
  },
  trackEvent: jest.fn(() => Promise.resolve()),
  trackScan: jest.fn(() => Promise.resolve()),
  getDeviceId: jest.fn(() => 'test-device-id')
}));

describe('MediScan App', () => {
  test('renders without crashing', () => {
    render(<App />);
    // App should render without throwing errors
  });

  test('shows loading state initially', () => {
    render(<App />);
    expect(screen.getByText(/Loading MediScan/i)).toBeInTheDocument();
  });

  test('error boundary catches and displays errors', () => {
    const ThrowError = ({ shouldThrow }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });
});

describe('Dashboard Component', () => {
  const mockNotifications = {
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn()
  };

  test('renders medication input field', () => {
    render(<Dashboard user={null} notifications={mockNotifications} />);
    expect(screen.getByPlaceholderText(/Enter medication name/i)).toBeInTheDocument();
  });

  test('shows warning when trying to scan empty medication name', async () => {
    render(<Dashboard user={null} notifications={mockNotifications} />);
    
    const scanButton = screen.getByText(/Get Suggestions/i);
    fireEvent.click(scanButton);

    await waitFor(() => {
      expect(mockNotifications.showWarning).toHaveBeenCalledWith(
        "Please enter a medication name to get suggestions.",
        "Missing Information"
      );
    });
  });
});

describe('Notification System', () => {
  test('useNotifications hook provides notification methods', () => {
    let notificationHook;
    
    function TestComponent() {
      notificationHook = useNotifications();
      return <div>Test</div>;
    }

    render(<TestComponent />);

    expect(typeof notificationHook.showSuccess).toBe('function');
    expect(typeof notificationHook.showError).toBe('function');
    expect(typeof notificationHook.showWarning).toBe('function');
    expect(typeof notificationHook.showInfo).toBe('function');
    expect(Array.isArray(notificationHook.notifications)).toBe(true);
  });
});
