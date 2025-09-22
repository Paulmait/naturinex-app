import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  Search,
  ContentCopy,
  Share,
  Save,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
// Firebase auth imported from firebase.web
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';
// import webConfig from '../../config/webConfig';
import Tesseract from 'tesseract.js';
function WebScan() {
  const [scanMode, setScanMode] = useState('upload'); // 'upload', 'text', 'camera'
  const [, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [userData, setUserData] = useState(null);
  const [remainingScans, setRemainingScans] = useState(null);
  const [, setRateLimitInfo] = useState(null); // Will be used for rate limit display
  const [deviceId] = useState(() => {
    // Generate a simple device ID for now
    return 'web-' + Math.random().toString(36).substring(2, 15);
  });
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const user = auth.currentUser;
  // Use Render backend URL
  const API_URL = process.env.REACT_APP_API_URL_SUPABASE || process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com';
  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    loadUserData();
  }, [user]);
  const checkScanLimit = async () => {
    if (!user) return true; // Allow anonymous users for testing
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (userData?.subscriptionType === 'premium') {
        return true;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastReset = userData?.lastScanReset ? new Date(userData.lastScanReset) : null;
      if (!lastReset || lastReset < today) {
        await updateDoc(doc(db, 'users', user.uid), {
          dailyScans: 0,
          lastScanReset: today.toISOString(),
        });
        return true;
      }
      if ((userData?.dailyScans || 0) >= 5) {
        setScanLimitReached(true);
        return false;
      }
      return true;
    } catch (err) {
      return true; // Allow scan if check fails
    }
  };
  const performOCR = async (imageData) => {
    setIsProcessingOCR(true);
    setOcrProgress(0);
    setOcrText('');
    try {
      const result = await Tesseract.recognize(
        imageData,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      const extractedText = result.data.text;
      setOcrText(extractedText);
      // Try to extract medication name from OCR text
      const lines = extractedText.split('\n').filter(line => line.trim());
      const medicationName = lines[0] || 'Unknown medication';
      // Auto-fill the text input with extracted text
      setTextInput(medicationName);
      return extractedText;
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to extract text from image. Please try typing the medication name manually.');
      return null;
    } finally {
      setIsProcessingOCR(false);
    }
  };
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        setImagePreview(reader.result);
        // Automatically perform OCR on uploaded image
        await performOCR(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };
  const startCamera = async () => {
    try {
      // Check if we're on HTTPS or localhost
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) {
        setError('Camera access requires HTTPS. Please use file upload instead or access the site via HTTPS.');
        return;
      }

      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API not supported in this browser. Please use file upload.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Use back camera on mobile
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanMode('camera');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please use file upload instead.');
      } else {
        setError('Unable to access camera. Please use file upload instead.');
      }
      console.error('Camera error:', err);
    }
  };
  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const imageDataUrl = canvasRef.current.toDataURL();
      setImagePreview(imageDataUrl);
      // Perform OCR on captured image
      await performOCR(imageDataUrl);
      canvasRef.current.toBlob((blob) => {
        setImageFile(blob);
        // Stop camera
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        setScanMode('upload');
      });
    }
  };
  const analyzeScan = async () => {
    if (!await checkScanLimit()) {
      setError('Daily scan limit reached. Upgrade to Premium for unlimited scans.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let analysisData;
      // Use the text input (which may be from OCR or manual entry)
      if (textInput.trim()) {
        // Use the correct medication name endpoint
        const endpoint = `${API_URL}/api/analyze/name`;
        console.log('Calling API endpoint:', endpoint, 'with medication:', textInput.trim());
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          mode: 'cors',
          body: JSON.stringify({ medicationName: textInput.trim() }),
        });
        // Check rate limit headers
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        if (rateLimitRemaining !== null) {
          setRemainingScans(parseInt(rateLimitRemaining));
          setRateLimitInfo({
            remaining: parseInt(rateLimitRemaining),
            reset: rateLimitReset ? new Date(parseInt(rateLimitReset)) : null
          });
        }
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            // Rate limit exceeded
            setScanLimitReached(true);
            setError(`${errorData.error || 'Rate limit exceeded.'}${!user ? ' Sign up for unlimited scans!' : ''}`);
            return;
          } else if (response.status === 403) {
            // Suspicious activity
            setError('Your request was blocked. Please try again later.');
            return;
          }
          throw new Error(errorData.message || 'Analysis failed');
        }
        const data = await response.json();
        // Format the response for display
        analysisData = {
          productName: data.medication || textInput,
          summary: data.details || 'No analysis available',
          alternatives: extractAlternatives(data.details),
          category: 'Medication',
          safetyRating: calculateSafetyRating(data.details),
          fullAnalysis: data.details,
          timestamp: data.timestamp,
          wasOCR: !!ocrText
        };
      } else if (ocrText) {
        // If we have OCR text but no manual input, use the OCR endpoint
        const endpoint = API_URL.includes('supabase.co') ? `${API_URL}/analyze` : `${API_URL}/api/analyze`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            medication: ocrText.split('\n')[0]
          }),
        });
        // Check rate limit headers
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        if (rateLimitRemaining !== null) {
          setRemainingScans(parseInt(rateLimitRemaining));
          setRateLimitInfo({
            remaining: parseInt(rateLimitRemaining),
            reset: rateLimitReset ? new Date(parseInt(rateLimitReset)) : null
          });
        }
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 429) {
            // Rate limit exceeded
            setScanLimitReached(true);
            setError(`${errorData.error || 'Rate limit exceeded.'}${!user ? ' Sign up for unlimited scans!' : ''}`);
            return;
          } else if (response.status === 403) {
            // Suspicious activity
            setError('Your request was blocked. Please try again later.');
            return;
          }
          throw new Error(errorData.message || 'Analysis failed');
        }
        const data = await response.json();
        analysisData = {
          productName: data.medication || 'Unknown Product',
          summary: data.analysis || data.naturalAlternatives || 'No analysis available',
          alternatives: extractAlternatives(data.analysis),
          category: 'Medication',
          safetyRating: 7,
          fullAnalysis: data.analysis,
          wasOCR: true
        };
      } else {
        throw new Error('Please provide a medication name or upload an image');
      }
      setAnalysisResult(analysisData);
      // Save scan to database if user is logged in
      if (user) {
        try {
          await addDoc(collection(db, 'scans'), {
            userId: user.uid,
            timestamp: new Date(),
            scanType: analysisData.wasOCR ? 'ocr' : 'text',
            productName: analysisData.productName,
            analysis: analysisData,
          });
          // Update scan count
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          if (userData?.subscriptionType !== 'premium') {
            await updateDoc(userRef, {
              dailyScans: (userData?.dailyScans || 0) + 1,
            });
          }
        } catch (dbError) {
          console.error('Failed to save scan result to database:', dbError);
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };
  // Helper function to extract natural alternatives from the analysis
  const extractAlternatives = (text) => {
    if (!text) return 'No alternatives available';
    // Look for natural alternatives section in the text
    const alternativesMatch = text.match(/natural alternatives?:?(.*?)(?:\n\n|$)/is);
    if (alternativesMatch) {
      return alternativesMatch[1].trim();
    }
    // Look for keywords
    const keywords = ['alternative', 'natural', 'herbal', 'supplement'];
    const sentences = text.split('.').filter(s => 
      keywords.some(keyword => s.toLowerCase().includes(keyword))
    );
    return sentences.length > 0 ? sentences.join('. ') : 'See full analysis for alternatives';
  };
  // Helper function to calculate safety rating
  const calculateSafetyRating = (text) => {
    if (!text) return 5;
    const warningKeywords = ['warning', 'danger', 'risk', 'severe', 'avoid'];
    const safeKeywords = ['safe', 'well-tolerated', 'minimal risk', 'generally safe'];
    const textLower = text.toLowerCase();
    const warningCount = warningKeywords.filter(k => textLower.includes(k)).length;
    const safeCount = safeKeywords.filter(k => textLower.includes(k)).length;
    const baseRating = 7;
    const adjustedRating = baseRating + safeCount - (warningCount * 2);
    return Math.min(10, Math.max(1, adjustedRating));
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };
  const shareResult = async () => {
    // Check if user has premium subscription
    if (!user) {
      setError('Please log in to share results');
      return;
    }
    // Get user data to check subscription
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      if (userData?.subscriptionType !== 'premium') {
        setError('Sharing is a Premium feature. Please upgrade to share your results.');
        return;
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
    if (navigator.share && analysisResult) {
      try {
        await navigator.share({
          title: 'Naturinex Analysis',
          text: `Medication: ${analysisResult.productName}\n\n${analysisResult.summary}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      const text = `Medication: ${analysisResult.productName}\n\n${analysisResult.summary}`;
      navigator.clipboard.writeText(text);
      alert('Result copied to clipboard!');
    }
  };
  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Medication Scanner
      </Typography>
      {scanLimitReached && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You&apos;ve reached your daily scan limit. Upgrade to Premium for unlimited scans!
        </Alert>
      )}
      {/* Rate limit info for anonymous users */}
      {!user && remainingScans !== null && remainingScans <= 2 && !scanLimitReached && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You have <strong>{remainingScans}</strong> free scan{remainingScans !== 1 ? 's' : ''} remaining.
            {' '}<Button size="small" onClick={() => window.location.href = '/signup'}>Sign up for more!</Button>
          </Typography>
        </Alert>
      )}
      {/* Device fingerprint status */}
      {deviceId && (
        <Box sx={{ mb: 2, display: 'none' }}>
          <Chip
            label={`Device ID: ${deviceId.substring(0, 8)}...`}
            size="small"
            color="success"
          />
        </Box>
      )}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scan Method
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                  variant={scanMode === 'upload' ? 'contained' : 'outlined'}
                  onClick={() => setScanMode('upload')}
                  startIcon={<CloudUpload />}
                >
                  Upload
                </Button>
                <Button
                  variant={scanMode === 'camera' ? 'contained' : 'outlined'}
                  onClick={startCamera}
                  startIcon={<CameraAlt />}
                >
                  Camera
                </Button>
                <Button
                  variant={scanMode === 'text' ? 'contained' : 'outlined'}
                  onClick={() => setScanMode('text')}
                  startIcon={<Search />}
                >
                  Text
                </Button>
              </Box>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {isProcessingOCR && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">Extracting text from image...</Typography>
                  <LinearProgress variant="determinate" value={ocrProgress} sx={{ mt: 1 }} />
                </Alert>
              )}
              {ocrText && !isProcessingOCR && (
                <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
                  Text extracted successfully! Review and edit if needed below.
                </Alert>
              )}
              {scanMode === 'upload' && (
                <Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  {imagePreview ? (
                    <Box>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          maxHeight: 300,
                          objectFit: 'contain',
                          borderRadius: 8,
                          border: '1px solid #e0e0e0',
                        }}
                      />
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </Button>
                    </Box>
                  ) : (
                    <Paper
                      sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '2px dashed',
                        borderColor: 'grey.300',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'grey.50',
                        },
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Click to upload medication image
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        or drag and drop
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        PNG, JPG up to 10MB
                      </Typography>
                    </Paper>
                  )}
                </Box>
              )}
              {scanMode === 'camera' && (
                <Box>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      maxHeight: 400,
                    }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{ mt: 2 }}
                    onClick={captureImage}
                  >
                    Capture Photo
                  </Button>
                </Box>
              )}
              {(scanMode === 'text' || ocrText) && (
                <Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Enter medication name or edit extracted text..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                  {ocrText && (
                    <Typography variant="caption" color="text.secondary">
                      Original OCR text: {ocrText.substring(0, 100)}...
                    </Typography>
                  )}
                </Box>
              )}
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                onClick={analyzeScan}
                disabled={loading || (!textInput.trim() && !ocrText)}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Medication'
                )}
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analysis Results
              </Typography>
              {analysisResult ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      {analysisResult.productName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {analysisResult.category && (
                        <Chip label={analysisResult.category} size="small" color="primary" />
                      )}
                      {analysisResult.safetyRating && (
                        <Chip
                          label={`Safety: ${analysisResult.safetyRating}/10`}
                          size="small"
                          color={analysisResult.safetyRating >= 7 ? 'success' : 'warning'}
                          icon={analysisResult.safetyRating >= 7 ? <CheckCircle /> : <Warning />}
                        />
                      )}
                      {analysisResult.wasOCR && (
                        <Chip label="OCR Scanned" size="small" variant="outlined" />
                      )}
                    </Box>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Analysis Summary
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {analysisResult.fullAnalysis || analysisResult.summary}
                      </Typography>
                    </Paper>
                  </Box>
                  {analysisResult.alternatives && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom color="primary">
                        Natural Alternatives
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
                        <Typography variant="body2">
                          {analysisResult.alternatives}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<ContentCopy />}
                      onClick={() => copyToClipboard(analysisResult.fullAnalysis || analysisResult.summary)}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Share />}
                      onClick={shareResult}
                    >
                      Share {!user || userData?.subscriptionType !== 'premium' ? '🔒' : ''}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Save />}
                      disabled={!user}
                    >
                      Save
                    </Button>
                  </Box>
                  {!user && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Login to save your scan history
                    </Typography>
                  )}
                </Box>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">
                    Upload or capture a medication image to see AI-powered analysis and natural alternatives
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>Disclaimer:</strong> This information is for educational purposes only. 
          Always consult with a healthcare provider before making changes to your medication regimen.
        </Typography>
      </Box>
    </Container>
  );
}
export default WebScan;