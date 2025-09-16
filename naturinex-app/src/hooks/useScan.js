import { useState, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';
import { APP_CONFIG } from '../constants/appConfig';

export const useScan = (user, notifications) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMessage, setScanningMessage] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start camera stream
  const startCamera = async () => {
    try {
      setScanningMessage('Initializing camera...');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setCameraStream(stream);
      setScanningMessage('Camera ready');
      
      await trackEvent(APP_CONFIG.ANALYTICS_EVENTS.SCAN_STARTED, {
        deviceId: navigator.userAgent,
        isLoggedIn: !!user?.uid
      });
      
    } catch (error) {
      console.error('Camera access error:', error);
      setScanningMessage('Camera access denied');
      notifications?.showError(APP_CONFIG.ERROR_MESSAGES.CAMERA_ERROR);
      
      await trackEvent('camera_access_failed', {
        error: error.message,
        deviceId: navigator.userAgent
      });
      
      setIsScanning(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsScanning(false);
    setScanningMessage('');
  };

  // Capture image from camera
  const captureImage = () => {
    if (!cameraStream) return;
    
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    video.srcObject = cameraStream;
    video.play();
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const imageUrl = URL.createObjectURL(blob);
        setSelectedImage(blob);
        setImagePreview(imageUrl);
        stopCamera();
      }, 'image/jpeg', 0.8);
    };
  };

  // Handle file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  // Process medication scan
  const processScan = async (medicationName) => {
    if (!medicationName?.trim()) {
      notifications?.showWarning('Please enter a medication name to get suggestions.', 'Missing Information');
      await trackEvent('scan_attempt_failed', { reason: 'empty_medication_name' });
      return null;
    }

    setIsProcessing(true);
    setScanningMessage('Analyzing medication...');
    
    try {
      await trackEvent(APP_CONFIG.ANALYTICS_EVENTS.SCAN_STARTED, {
        medicationName: medicationName.trim(),
        deviceId: navigator.userAgent,
        isLoggedIn: !!user?.uid,
        hasImage: !!selectedImage
      });

      // Call the actual API for natural alternatives
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://naturinex-app.onrender.com'}/api/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': user ? `Bearer ${await user.getIdToken()}` : '',
          },
          body: JSON.stringify({
            medication: medicationName.trim(),
            source: 'manual_input',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to analyze medication');
        }

        const results = await response.json();

        // Format the results
        const formattedResults = {
          medicationName: medicationName.trim(),
          scannedAt: new Date(),
          alternatives: results.alternatives || [],
          warnings: results.warnings || [
            'Always consult with a healthcare provider before switching medications',
            'Natural alternatives may not be suitable for all individuals',
            'Results are for informational purposes only'
          ],
          research: results.research || [],
          interactions: results.interactions || [],
        };

        setScanResults(formattedResults);
        setScanningMessage('Analysis complete');

        await trackEvent(APP_CONFIG.ANALYTICS_EVENTS.SCAN_COMPLETED, {
          medicationName: medicationName.trim(),
          alternativesFound: formattedResults.alternatives.length,
          deviceId: navigator.userAgent
        });

        return formattedResults;
      } catch (apiError) {
        console.error('API call failed:', apiError);

        // Fallback to basic data from naturalAlternativesService
        const { naturalAlternativesService } = await import('../services/naturalAlternativesService');
        const fallbackResults = naturalAlternativesService.getAlternatives(medicationName.trim());

        setScanResults(fallbackResults);
        setScanningMessage('Analysis complete (offline mode)');

        return fallbackResults;
      }
      
    } catch (error) {
      console.error('Scan processing error:', error);
      setScanningMessage('Processing failed');
      notifications?.showError(APP_CONFIG.ERROR_MESSAGES.SCAN_FAILED);
      
      await trackEvent(APP_CONFIG.ANALYTICS_EVENTS.SCAN_FAILED, {
        error: error.message,
        medicationName: medicationName.trim(),
        deviceId: navigator.userAgent
      });
      
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Clear scan results
  const clearScan = () => {
    setScanResults(null);
    setSelectedImage(null);
    setImagePreview(null);
    setScanningMessage('');
  };

  // Reset scan state
  const resetScan = () => {
    clearScan();
    stopCamera();
    setIsProcessing(false);
  };

  return {
    // State
    isScanning,
    scanningMessage,
    cameraStream,
    selectedImage,
    imagePreview,
    scanResults,
    isProcessing,
    
    // Actions
    startCamera,
    stopCamera,
    captureImage,
    handleImageSelect,
    processScan,
    clearScan,
    resetScan
  };
}; 