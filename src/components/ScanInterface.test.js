import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ScanInterface from './ScanInterface';

// Mock the hooks and services
jest.mock('../hooks/useUser', () => ({
  useUser: () => ({
    user: null,
    isPremium: false,
    canPerformScan: () => true,
    getRemainingScans: () => 3,
    incrementScanCount: jest.fn()
  })
}));

jest.mock('../hooks/useScan', () => ({
  useScan: () => ({
    isScanning: false,
    scanningMessage: '',
    cameraStream: null,
    selectedImage: null,
    imagePreview: null,
    scanResults: null,
    isProcessing: false,
    startCamera: jest.fn(),
    stopCamera: jest.fn(),
    captureImage: jest.fn(),
    handleImageSelect: jest.fn(),
    processScan: jest.fn(),
    clearScan: jest.fn(),
    resetScan: jest.fn()
  })
}));

jest.mock('../services/aiService', () => ({
  __esModule: true,
  default: {
    validateMedicationName: jest.fn(() => ({ isValid: true, error: null }))
  }
}));

const mockNotifications = {
  showWarning: jest.fn(),
  showError: jest.fn(),
  showSuccess: jest.fn()
};

describe('ScanInterface Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders scan interface with tabs', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('Camera Scan')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  test('shows manual entry tab by default', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    expect(screen.getByLabelText('Medication Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter medication name...')).toBeInTheDocument();
    expect(screen.getByText('Analyze Medication')).toBeInTheDocument();
  });

  test('switches to camera tab when clicked', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    const cameraTab = screen.getByText('Camera Scan');
    fireEvent.click(cameraTab);
    
    expect(screen.getByText('Start Camera')).toBeInTheDocument();
  });

  test('switches to upload tab when clicked', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    const uploadTab = screen.getByText('Upload Image');
    fireEvent.click(uploadTab);
    
    expect(screen.getByText('Select Image')).toBeInTheDocument();
  });

  test('shows quota information for free tier users', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    expect(screen.getByText(/Remaining scans today: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to premium for unlimited scans/)).toBeInTheDocument();
  });

  test('handles medication name input', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    const input = screen.getByPlaceholderText('Enter medication name...');
    fireEvent.change(input, { target: { value: 'Aspirin' } });
    
    expect(input.value).toBe('Aspirin');
  });

  test('analyze button is disabled when no medication name', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    const analyzeButton = screen.getByText('Analyze Medication');
    expect(analyzeButton).toBeDisabled();
  });

  test('analyze button is enabled when medication name is entered', () => {
    render(<ScanInterface notifications={mockNotifications} />);
    
    const input = screen.getByPlaceholderText('Enter medication name...');
    fireEvent.change(input, { target: { value: 'Aspirin' } });
    
    const analyzeButton = screen.getByText('Analyze Medication');
    expect(analyzeButton).not.toBeDisabled();
  });
}); 