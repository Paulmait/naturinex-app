import React, { useState, useRef } from 'react';
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
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  Search,
  ContentCopy,
  Share,
  Save,
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.web';
import webConfig from '../../config/webConfig';

function WebScan() {
  const [scanMode, setScanMode] = useState('upload'); // 'upload', 'text', 'camera'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [scanLimitReached, setScanLimitReached] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;

  const API_URL = webConfig.API_URL;

  const checkScanLimit = async () => {
    if (!user) return false;
    
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
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanMode('camera');
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      canvasRef.current.toBlob((blob) => {
        setImageFile(blob);
        setImagePreview(canvasRef.current.toDataURL());
        
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
      
      if (scanMode === 'text' || textInput) {
        // Text-based analysis
        const response = await fetch(`${API_URL}/api/analyze-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({ text: textInput }),
        });
        
        if (!response.ok) throw new Error('Analysis failed');
        analysisData = await response.json();
        
      } else if (imageFile) {
        // Image-based analysis
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const response = await fetch(`${API_URL}/api/analyze-image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
          body: formData,
        });
        
        if (!response.ok) throw new Error('Analysis failed');
        analysisData = await response.json();
      }
      
      setAnalysisResult(analysisData);
      
      // Save scan to database
      await addDoc(collection(db, 'scans'), {
        userId: user.uid,
        timestamp: new Date(),
        scanType: scanMode === 'text' ? 'text' : 'image',
        productName: analysisData.productName || 'Unknown Product',
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
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const shareResult = async () => {
    if (navigator.share && analysisResult) {
      try {
        await navigator.share({
          title: 'Naturinex Wellness Analysis',
          text: `Analysis for ${analysisResult.productName}:\n${analysisResult.summary}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Product Scanner
      </Typography>
      
      {scanLimitReached && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You've reached your daily scan limit. Upgrade to Premium for unlimited scans!
        </Alert>
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
                          maxHeight: 400,
                          objectFit: 'contain',
                          borderRadius: 8,
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
                        Click to upload image
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
                    style={{
                      width: '100%',
                      borderRadius: 8,
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
              
              {scanMode === 'text' && (
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Enter product name or ingredients..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  variant="outlined"
                />
              )}
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                onClick={analyzeScan}
                disabled={loading || (!imageFile && !textInput)}
              >
                {loading ? <CircularProgress size={24} /> : 'Analyze Product'}
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
                    <Typography variant="subtitle1" fontWeight="bold">
                      {analysisResult.productName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {analysisResult.category && (
                        <Chip label={analysisResult.category} size="small" />
                      )}
                      {analysisResult.safetyRating && (
                        <Chip
                          label={`Safety: ${analysisResult.safetyRating}/10`}
                          size="small"
                          color={analysisResult.safetyRating >= 7 ? 'success' : 'warning'}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Summary
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {analysisResult.summary}
                    </Typography>
                  </Box>
                  
                  {analysisResult.ingredients && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Key Ingredients
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {analysisResult.ingredients.slice(0, 5).map((ing, index) => (
                          <Chip key={index} label={ing} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {analysisResult.alternatives && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Natural Alternatives
                      </Typography>
                      <Typography variant="body2">
                        {analysisResult.alternatives}
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                    <IconButton onClick={() => copyToClipboard(analysisResult.summary)}>
                      <ContentCopy />
                    </IconButton>
                    <IconButton onClick={shareResult}>
                      <Share />
                    </IconButton>
                    <IconButton>
                      <Save />
                    </IconButton>
                  </Box>
                </Box>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">
                    Upload or capture a product image to see analysis results
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default WebScan;