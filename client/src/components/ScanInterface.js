import React, { useState } from 'react';
import { useScan } from '../hooks/useScan';
import { useUser } from '../hooks/useUser';
import { APP_CONFIG } from '../constants/appConfig';
import aiService from '../services/aiService';
import medicationService from '../services/medicationService';
import offlineService from '../services/offlineService';
import FeedbackSystem from './FeedbackSystem';

const ScanInterface = ({ notifications, onScanComplete }) => {
  const { user, isPremium, canPerformScan, getRemainingScans, incrementScanCount } = useUser();
  const {
    isScanning,
    scanningMessage,
    cameraStream,
    selectedImage,
    imagePreview,
    scanResults,
    isProcessing,
    startCamera,
    stopCamera,
    captureImage,
    handleImageSelect,
    processScan,
    clearScan
    // resetScan - not currently used
  } = useScan(user, notifications);

  const [medicationName, setMedicationName] = useState('');
  const [activeTab, setActiveTab] = useState('manual');
  const [scanResultsState, setScanResults] = useState(null);
  const [currentInteractions, setCurrentInteractions] = useState([]);
  const [dosageInfo, setDosageInfo] = useState(null);

  // Handle scan submission
  const handleScanSubmit = async () => {
    if (!canPerformScan()) {
      notifications?.showError(APP_CONFIG.ERROR_MESSAGES.QUOTA_EXCEEDED);
      return;
    }

    const validation = aiService.validateMedicationName(medicationName);
    if (!validation.isValid) {
      notifications?.showWarning(validation.error, 'Invalid Input');
      return;
    }

    try {
      // Check cache first
      const cachedResults = await offlineService.getCachedSuggestion(medicationName);
      if (cachedResults) {
        notifications?.showInfo('Using cached results');
        setScanResults(cachedResults);
        return;
      }

      const results = await processScan(medicationName);
      if (results) {
        await incrementScanCount();
        onScanComplete?.(results);
        
        // Save to history
        if (user) {
          await medicationService.saveMedicationScan(user.uid, {
            medicationName,
            alternatives: results.alternatives.map(alt => alt.name),
            scanMethod: 'manual'
          });
        }
        
        // Cache the results
        await offlineService.cacheSuggestion(medicationName, results);
        
        notifications?.showSuccess(APP_CONFIG.SUCCESS_MESSAGES.SCAN_COMPLETED);
      }
    } catch (error) {
      console.error('Scan submission error:', error);
      
      // Try offline mode
      if (!navigator.onLine) {
        const offlineResults = offlineService.getOfflineSuggestions(medicationName);
        if (offlineResults.found) {
          setScanResults({
            medicationName,
            alternatives: offlineResults.alternatives,
            warnings: ['Offline mode - limited information available'],
            recommendations: ['Please consult healthcare provider for detailed information'],
            disclaimer: 'This information is from offline cache and may not be complete.'
          });
          notifications?.showWarning('Using offline data - connect to internet for full results');
        } else {
          notifications?.showError('No offline data available for this medication');
        }
      } else {
        notifications?.showError(error.message);
      }
    }
  };

  // Handle photo scan
  const handlePhotoScan = async () => {
    if (!canPerformScan()) {
      notifications?.showError(APP_CONFIG.ERROR_MESSAGES.QUOTA_EXCEEDED);
      return;
    }

    if (!selectedImage) {
      notifications?.showWarning('Please select an image first', 'No Image Selected');
      return;
    }

    try {
      // TODO: Implement OCR processing
      const ocrResults = await aiService.processImageForOCR(selectedImage);
      if (ocrResults) {
        setMedicationName(ocrResults.medicationName);
        await handleScanSubmit();
      } else {
        notifications?.showWarning('Could not detect medication name from image. Please enter manually.', 'OCR Failed');
      }
    } catch (error) {
      console.error('Photo scan error:', error);
      notifications?.showError('Failed to process image. Please try again.');
    }
  };

  return (
    <div className="scan-interface">
      {/* Scan Tabs */}
      <div className="scan-tabs">
        <button
          className={`tab-button ${activeTab === 'manual' ? 'active' : ''}`}
          onClick={() => setActiveTab('manual')}
        >
          Manual Entry
        </button>
        <button
          className={`tab-button ${activeTab === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          Camera Scan
        </button>
        <button
          className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload Image
        </button>
      </div>

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <div className="manual-entry">
          <div className="input-group">
            <label htmlFor="medicationName">Medication Name</label>
            <input
              id="medicationName"
              type="text"
              value={medicationName}
              onChange={(e) => setMedicationName(e.target.value)}
              placeholder="Enter medication name..."
              disabled={isProcessing}
            />
          </div>
          
          <button
            className="scan-button primary"
            onClick={handleScanSubmit}
            disabled={!medicationName.trim() || isProcessing || !canPerformScan()}
          >
            {isProcessing ? 'Analyzing...' : 'Analyze Medication'}
          </button>
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === 'camera' && (
        <div className="camera-interface">
          {!isScanning ? (
            <div className="camera-controls">
              <button
                className="scan-button primary"
                onClick={startCamera}
                disabled={isProcessing}
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div className="camera-view">
              <div className="camera-feed">
                <video
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', maxWidth: '400px' }}
                  ref={(video) => {
                    if (video && cameraStream) {
                      video.srcObject = cameraStream;
                    }
                  }}
                />
              </div>
              
              <div className="camera-controls">
                <button
                  className="scan-button secondary"
                  onClick={captureImage}
                >
                  Capture
                </button>
                <button
                  className="scan-button secondary"
                  onClick={stopCamera}
                >
                  Stop Camera
                </button>
              </div>
              
              {scanningMessage && (
                <div className="scanning-message">
                  {scanningMessage}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="upload-interface">
          <div className="file-upload">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              id="imageUpload"
              style={{ display: 'none' }}
            />
            <label htmlFor="imageUpload" className="upload-button">
              Select Image
            </label>
          </div>
          
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Selected medication" />
              <button
                className="scan-button primary"
                onClick={handlePhotoScan}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Analyze Image'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quota Information */}
      {!isPremium && (
        <div className="quota-info">
          <p>Remaining scans today: {getRemainingScans()}</p>
          <p>Upgrade to premium for unlimited scans</p>
        </div>
      )}

      {/* Scan Results */}
      {(scanResults || scanResultsState) && (
        <div className="scan-results">
          <h3>Analysis Results for {(scanResults || scanResultsState).medicationName}</h3>
          
          <div className="alternatives">
            <h4>Natural Alternatives</h4>
            {(scanResults || scanResultsState).alternatives.map((alt, index) => (
              <div key={alt.id || index} className="alternative-item">
                <h5>{alt.name}</h5>
                <p><strong>Description:</strong> {alt.description}</p>
                <p><strong>Effectiveness:</strong> {alt.effectiveness}</p>
                <p><strong>Side Effects:</strong> {alt.sideEffects}</p>
                <p><strong>Dosage:</strong> {alt.dosage}</p>
                <p><strong>Cost:</strong> {alt.cost}</p>
                
                {/* Add dosage calculator for natural remedies */}
                <button
                  className="dosage-button"
                  onClick={() => {
                    const dosageRec = medicationService.getDosageRecommendations(alt.name);
                    setDosageInfo(dosageRec);
                  }}
                >
                  Get Dosage Recommendations
                </button>
              </div>
            ))}
          </div>
          
          {/* Show dosage information if available */}
          {dosageInfo && dosageInfo.available && (
            <div className="dosage-info-panel">
              <h4>Dosage Recommendations for {dosageInfo.name}</h4>
              <p><strong>General Dosage:</strong> {dosageInfo.general}</p>
              <p><strong>Timing:</strong> {dosageInfo.timing}</p>
              {dosageInfo.precautions && (
                <p className="precaution"><strong>Precautions:</strong> {dosageInfo.precautions}</p>
              )}
              <button onClick={() => setDosageInfo(null)}>Close</button>
            </div>
          )}
          
          {/* Check for interactions if user has medication history */}
          {user && currentInteractions.length > 0 && (
            <div className="interactions-panel">
              <h4>Potential Interactions</h4>
              {currentInteractions.map((interaction, index) => (
                <div key={index} className={`interaction-item ${interaction.severity}`}>
                  <p><strong>Severity:</strong> {interaction.severity}</p>
                  <p>{interaction.description}</p>
                  <p><em>{interaction.recommendation}</em></p>
                </div>
              ))}
            </div>
          )}
          
          <div className="warnings">
            <h4>Important Warnings</h4>
            <ul>
              {(scanResults || scanResultsState).warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
          
          <div className="recommendations">
            <h4>Recommendations</h4>
            <ul>
              {(scanResults || scanResultsState).recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
          
          <div className="disclaimer">
            <p><em>{(scanResults || scanResultsState).disclaimer}</em></p>
          </div>
          
          {/* Add Feedback System */}
          <FeedbackSystem
            medicationName={(scanResults || scanResultsState).medicationName}
            naturalAlternatives={(scanResults || scanResultsState).alternatives.map(alt => alt.name)}
            scanId={Date.now().toString()}
          />
          
          <button
            className="scan-button secondary"
            onClick={() => {
              clearScan();
              setScanResults(null);
              setDosageInfo(null);
              setCurrentInteractions([]);
            }}
          >
            New Scan
          </button>
        </div>
      )}
    </div>
  );
};

export default ScanInterface; 