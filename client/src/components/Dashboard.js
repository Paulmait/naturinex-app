import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import EnhancedPremiumCheckout from './EnhancedPremiumCheckout';
import AccountDeletion from './AccountDeletion';
import ScanHistory, { saveScanToHistory } from './ScanHistory';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfUse from './TermsOfUse';
import Login from './Login';
import AnalyticsDashboard from './AnalyticsDashboard';
import analytics, { trackScan, trackEvent, getDeviceId } from '../utils/analytics';
import storageManager, { addWatermark, getScanQuota } from '../utils/storageManager';
import { generateEmailContent, generateDownloadReport, generateShareContent } from '../utils/shareWatermarkHelper';

function Dashboard({ user, notifications }) {
  const [suggestions, setSuggestions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [activeTab, setActiveTab] = useState("barcode");    const [scanCount, setScanCount] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [userTier, setUserTier] = useState('free'); // New: Track user tier
  const [showCheckout, setShowCheckout] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState("home");
  
  // Analytics state
  const [deviceAnalytics, setDeviceAnalytics] = useState(null);
    // Check if user is admin - Updated to include your email
  const isAdmin = user?.email === 'admin@naturinex.com' || 
                  user?.email === 'guampaul@gmail.com' || 
                  user?.email === 'maito@example.com';


    // User profile state
  const [userProfile, setUserProfile] = useState(null);
    // Legal documents state
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);
  
  // AI Sharing disclaimer state
  const [showAIDisclaimer, setShowAIDisclaimer] = useState(false);
  const [pendingShareAction, setPendingShareAction] = useState(null);
    // Login modal state - only shown when upgrade needed
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Account deletion state
  const [showAccountDeletion, setShowAccountDeletion] = useState(false);
  
  // eslint-disable-next-line no-unused-vars
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningMessage, setScanningMessage] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
    const handleSignOut = () => {
    signOut(auth).catch(console.error);
  };  // Function to close all modals - helps prevent stuck overlays
  const closeAllModals = () => {
    setShowPremiumModal(false);
    setShowCheckout(false);
    setShowAIDisclaimer(false);
    setShowLoginModal(false);
    setShowAccountDeletion(false);
    setPendingShareAction(null);
  };

  // Function to show AI disclaimer before sharing
  const showAIDisclaimerModal = (action) => {
    setPendingShareAction(action);
    setShowAIDisclaimer(true);
  };

  // Function to handle AI disclaimer acceptance
  const handleAIDisclaimerAccept = () => {
    setShowAIDisclaimer(false);
    if (pendingShareAction === 'email') {
      executeEmailShare();
    } else if (pendingShareAction === 'share') {
      executeShare();
    }
    setPendingShareAction(null);
  };

  // Function to handle AI disclaimer rejection
  const handleAIDisclaimerReject = () => {
    setShowAIDisclaimer(false);
    setPendingShareAction(null);
  };

  // Function to handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeAllModals();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);  // Auto-close modals after 30 seconds to prevent stuck overlays
  useEffect(() => {
    if (showPremiumModal || showCheckout || showAIDisclaimer || showLoginModal) {
      const timer = setTimeout(() => {
        closeAllModals();
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [showPremiumModal, showCheckout, showAIDisclaimer, showLoginModal]);
  // Load user's current scan count when component mounts
  useEffect(() => {
    const loadScanCount = async () => {
      try {
        // Load device analytics
        const deviceData = await analytics.getAnalytics();
        setDeviceAnalytics(deviceData);
        
        // Track user session
        await trackEvent('dashboard_loaded', { 
          isLoggedIn: !!user?.uid,
          deviceId: getDeviceId(),
          userAgent: navigator.userAgent,
          screenSize: `${window.screen.width}x${window.screen.height}`
        });
        
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);        const today = new Date().toISOString().slice(0, 7); // YYYY-MM format for monthly tracking

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lastScanMonth === today) {
            setScanCount(data.scanCount || 0);          } else {
            // Reset count for new month
            setScanCount(0);
            await updateDoc(userRef, { scanCount: 0, lastScanMonth: today });
          }
          // Load premium status
          setIsPremium(data.isPremium || false);
          // Load user tier
          setUserTier(data.userTier || 'free');
          // Load user profile data
          setUserProfile(data);        } else {
          // New user
          setScanCount(0);
          await setDoc(userRef, { scanCount: 0, lastScanMonth: today, isPremium: false, userTier: 'free' });
        }
      } catch (error) {
        console.error("Error loading scan count:", error);
        setScanCount(0);
      } finally {
        setIsLoadingCount(false);
      }    };    if (user?.uid) {
      loadScanCount();
    } else {
      // Free tier - no persistent storage, use session-based counting
      const sessionScanCount = sessionStorage.getItem('freeTierScanCount') || '0';
      setScanCount(parseInt(sessionScanCount));
      setIsPremium(false);
      setIsLoadingCount(false);
      
      // Still track device analytics for free tier users
      (async () => {
        const deviceData = await analytics.getAnalytics();
        setDeviceAnalytics(deviceData);
        
        await trackEvent('dashboard_loaded', { 
          isLoggedIn: false,
          deviceId: getDeviceId(),
          userType: 'free_tier',
          sessionScans: parseInt(sessionScanCount),
          userAgent: navigator.userAgent,
          screenSize: `${window.screen.width}x${window.screen.height}`
        });
      })();
    }
  }, [user?.uid]);
  
  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);  const handleScan = async () => {
    if (!medicationName.trim()) {
      notifications?.showWarning("Please enter a medication name to get suggestions.", "Missing Information");
      await trackEvent('scan_attempt_failed', { reason: 'empty_medication_name' });
      return;
    }

    setIsLoading(true);
    
    // Track scan attempt with device analytics
    await trackEvent('scan_started', { 
      medicationName: medicationName.trim(),
      deviceId: getDeviceId(),
      isLoggedIn: !!user?.uid,
      isPremium: isPremium,
      userTier: userTier
    });
    
    try {
      let scans = 0;
      let dailyScans = 0;
      let currentUserTier = 'free';
      
      if (user?.uid) {
        // Logged in user - check Firestore and determine tier
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        if (docSnap.exists()) {
          const data = docSnap.data();
            // Determine user tier
          if (data.isPremium) {
            currentUserTier = 'premium';
          } else if (data.isBasic) {
            currentUserTier = 'basic';
          } else if (data.isProfessional) {
            currentUserTier = 'professional';
          } else {
            currentUserTier = 'basic'; // Default tier for registered users
          }
          
          setUserTier(currentUserTier);
          setIsPremium(data.isPremium || false);
          
          // Get monthly scans
          if (data.lastScanMonth === currentMonth) {
            scans = data.scanCount || 0;
          } else {
            await updateDoc(userRef, { scanCount: 0, lastScanMonth: currentMonth });
            scans = 0;
          }
          
          // Get daily scans
          if (data.lastScanDate === today) {
            dailyScans = data.dailyScanCount || 0;
          } else {
            await updateDoc(userRef, { dailyScanCount: 0, lastScanDate: today });
            dailyScans = 0;
          }
          
          // Check scan limits based on tier
          const scanQuota = getScanQuota(currentUserTier);
          
          // Check monthly limit
          if (scans >= scanQuota.monthly) {
            await trackEvent('scan_limit_reached', { 
              scanType: 'monthly_limit',
              currentScans: scans,
              userType: currentUserTier,
              limit: scanQuota.monthly
            });
            setShowPremiumModal(true);
            setIsLoading(false);
            return;
          }
          
          // Check daily limit
          if (dailyScans >= scanQuota.daily) {
            await trackEvent('scan_limit_reached', { 
              scanType: 'daily_limit',
              currentScans: dailyScans,
              userType: currentUserTier,
              limit: scanQuota.daily
            });
            notifications?.showWarning(`Daily limit reached! You can do ${scanQuota.daily} scans per day. Try again tomorrow or upgrade for more scans.`, "Daily Limit Reached");
            setIsLoading(false);
            return;
          }        } else {
          // New user - set as basic tier by default
          currentUserTier = 'basic';
          await setDoc(userRef, { 
            scanCount: 0, 
            dailyScanCount: 0,
            lastScanMonth: currentMonth, 
            lastScanDate: today,
            isPremium: false,
            isBasic: false, // Start as free, can upgrade to basic
            isProfessional: false,
            tier: 'basic'
          });
        }        // Increment scan counts for non-premium/professional users
        if (currentUserTier !== 'premium' && currentUserTier !== 'professional') {
          await updateDoc(userRef, {
            scanCount: scans + 1,
            dailyScanCount: dailyScans + 1,
            lastScanMonth: currentMonth,
            lastScanDate: today
          });
          setScanCount(scans + 1);
        }
      } else {
        // Free tier user (no login) - NEW DAILY LIMIT SYSTEM
        currentUserTier = 'free';
        setUserTier('free');
        
        const today = new Date().toISOString().slice(0, 10);
        const lastScanDate = localStorage.getItem('freeTierLastScanDate');
        
        if (lastScanDate === today) {
          // Same day - check daily limit
          dailyScans = parseInt(localStorage.getItem('freeTierDailyCount') || '0');
          if (dailyScans >= 1) {
            await trackEvent('scan_limit_reached', { 
              scanType: 'daily_limit',
              currentScans: dailyScans,
              userType: 'free',
              limit: 1
            });
            setShowLoginModal(true);
            setIsLoading(false);
            return;
          }
        } else {
          // New day - reset count
          localStorage.setItem('freeTierDailyCount', '0');
          localStorage.setItem('freeTierLastScanDate', today);
          dailyScans = 0;
        }
          // Increment daily count
        localStorage.setItem('freeTierDailyCount', (dailyScans + 1).toString());
      }

      // Make API call for suggestions
      const res = await fetch('http://localhost:5000/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },        body: JSON.stringify({ 
          medicationName: medicationName.trim(),
          userTier: currentUserTier,
          advancedAnalysis: currentUserTier === 'premium' || currentUserTier === 'professional'
        })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      
      // Add watermark for free tier users
      const processedSuggestions = addWatermark(data.suggestions, currentUserTier);
      setSuggestions(processedSuggestions);
      
      // Show success notification
      notifications?.showSuccess(`Successfully analyzed ${medicationName.trim()}!`, 'Analysis Complete');
      
      // Track successful scan with comprehensive analytics
      await trackScan({
        medicationName: medicationName.trim(),
        suggestions: data.suggestions,
        userId: user?.uid,
        isPremium: isPremium,
        userTier: currentUserTier,
        scanMethod: 'manual',
        scanType: 'medication',
        scanCount: scans + 1,
        dailyScanCount: dailyScans + 1,
        success: true
      });
        // Save scan to history based on tier and storage limits
      if (user && (currentUserTier === 'basic' || currentUserTier === 'premium' || currentUserTier === 'professional')) {
        await saveScanToHistory(user, medicationName.trim(), processedSuggestions);
        
        // Clean up expired scans for non-premium users
        if (currentUserTier !== 'premium' && currentUserTier !== 'professional') {
          await storageManager.cleanupExpiredScans(user.uid, currentUserTier);
        }
      }
      
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      
      // Track scan failure
      await trackEvent('scan_failed', {
        medicationName: medicationName.trim(),
        error: error.message,
        userId: user?.uid,
        isPremium: isPremium,
        userTier: userTier
      });
      
      notifications?.showError("AI is currently unavailable. Please try again later.", "Service Unavailable");
    } finally {
      setIsLoading(false);
    }
  };const handleEmail = () => {
    if (!suggestions) {
      notifications?.showWarning("No suggestions to email yet.", "Nothing to Share");
      return;
    }
      // Free tier users need to sign up for email functionality
    if (!user) {
      notifications?.showInfo("Please sign up to email your results! Get 5 scans per month + permanent history.", "Sign Up Required");
      return;
    }
    
    // Check if user has exceeded free limit and is not premium
    if (!isPremium && scanCount > 5) {
      setShowPremiumModal(true);
      return;
    }
    
    // Show AI disclaimer before sharing
    showAIDisclaimerModal('email');
  };  const executeEmailShare = () => {
    if (!user?.email) {
      notifications?.showInfo("Please sign up to email your results!", "Sign Up Required");
      return;
    }
    
    const emailData = generateEmailContent(suggestions, medicationName, userTier, user);
    const mailto = `mailto:${user.email}?subject=${emailData.subject}&body=${emailData.body}`;
    window.location.href = mailto;
  };

  const handleShare = () => {
    if (!suggestions) {
      notifications?.showWarning("No suggestions to share yet.", "Nothing to Share");
      return;
    }
    
    // Check if user has exceeded free limit and is not premium
    if (!isPremium && scanCount > 5) {
      setShowPremiumModal(true);
      return;
    }
    
    // Show AI disclaimer before sharing
    showAIDisclaimerModal('share');
  };
  const executeShare = () => {
    const shareContent = generateShareContent(suggestions, medicationName, userTier, user);
    
    if (navigator.share) {
      navigator.share({
        title: `MediScan Analysis: ${medicationName}`,
        text: shareContent,
        url: window.location.href,
      });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(shareContent);
      notifications?.showSuccess('Results copied to clipboard!', 'Copied');
    }
  };

  const handlePremiumSuccess = async () => {
    try {      // Update user's premium status in Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { isPremium: true });
      setIsPremium(true);
      setShowCheckout(false);
      setShowPremiumModal(false);
      
      // Track successful premium upgrade
      await trackEvent('premium_upgrade_success', {
        userId: user.uid,
        deviceId: getDeviceId(),
        upgradeMethod: 'stripe_checkout',
        previousScanCount: scanCount
      });
      
      notifications?.showSuccess('🎉 Welcome to Premium! You now have unlimited scans and access to scan history.', 'Premium Activated');
    } catch (error) {
      console.error('Error updating premium status:', error);
      
      // Track premium upgrade failure
      await trackEvent('premium_upgrade_failed', {
        userId: user.uid,
        deviceId: getDeviceId(),
        error: error.message
      });
    }
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    
    // Track checkout cancellation
    trackEvent('checkout_cancelled', {
      userId: user?.uid,
      deviceId: getDeviceId(),
      stage: 'checkout_modal'
    });
  };

  const handleBarcodeScan = () => {
    // Check scan limits for non-premium users
    if (!isPremium && scanCount >= 5) {
      trackEvent('feature_blocked', { 
        feature: 'barcode_scan', 
        reason: 'scan_limit_reached',
        currentScans: scanCount 
      });
      setShowPremiumModal(true);
      return;
    }
    
    setIsScanning(true);
    // Simulate barcode scanning (in a real app, this would open camera for barcode scanning)
    setTimeout(() => {
      const mockMedications = [
        'Ibuprofen', 'Acetaminophen', 'Aspirin', 'Lisinopril', 'Metformin',
        'Atorvastatin', 'Amlodipine', 'Omeprazole', 'Levothyroxine', 'Albuterol'
      ];
      const randomMed = mockMedications[Math.floor(Math.random() * mockMedications.length)];
      setMedicationName(randomMed);
      setIsScanning(false);
      // Auto-trigger search after barcode scan
      setTimeout(() => handleScan(), 500);
    }, 2000);
  };
  const handleImageSelect = () => {
    // Check scan limits for non-premium users
    if (!isPremium && scanCount >= 5) {
      setShowPremiumModal(true);
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setSelectedImage(file);
        
        // Create image preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
        
        // Show processing feedback
        setIsScanning(true);
        setScanningMessage(`Processing ${file.name}...`);
        
        // Simulate image processing with realistic timing
        setTimeout(() => {
          const mockMedications = [
            'Tylenol', 'Advil', 'Benadryl', 'Claritin', 'Pepto-Bismol',
            'Tums', 'Robitussin', 'Sudafed', 'Mylanta', 'Mucinex'
          ];
          const randomMed = mockMedications[Math.floor(Math.random() * mockMedications.length)];
          setMedicationName(randomMed);
          setScanningMessage('Image processed successfully!');
          
          // Show success message briefly, then trigger search
          setTimeout(() => {
            setIsScanning(false);
            setScanningMessage('');
            handleScan();
          }, 1000);
        }, 3000);
      }
    };
    input.click();
  };
  const handlePhotoScan = async () => {
    // Check scan limits for non-premium users
    if (!isPremium && scanCount >= 5) {
      setShowPremiumModal(true);
      return;
    }
    
    try {
      setIsScanning(true);
      setScanningMessage('Requesting camera access...');
      
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setCameraStream(stream);
      setScanningMessage('Camera ready! Position medication in view...');
      
      // Create video element to show camera feed
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      
      // After 3 seconds, simulate capture
      setTimeout(() => {
        // Create canvas to capture frame
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to blob and create preview
        canvas.toBlob((blob) => {
          const imageUrl = URL.createObjectURL(blob);
          setImagePreview(imageUrl);
          setSelectedImage(blob);
        });
        
        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
        
        setScanningMessage('Photo captured! Processing...');
        
        setTimeout(() => {
          const mockMedications = [
            'Nexium', 'Lipitor', 'Zoloft', 'Plavix', 'Singular',
            'Lexapro', 'Crestor', 'Cymbalta', 'Humira', 'Enbrel'
          ];
          const randomMed = mockMedications[Math.floor(Math.random() * mockMedications.length)];
          setMedicationName(randomMed);
          setScanningMessage('Photo processed successfully!');
          
          setTimeout(() => {
            setIsScanning(false);
            setScanningMessage('');
            handleScan();
          }, 1000);
        }, 2000);
      }, 3000);
      
    } catch (error) {
      console.error('Camera access error:', error);
      setIsScanning(false);
      setScanningMessage('');
      
      // Fallback to file upload
      if (error.name === 'NotAllowedError') {
        notifications?.showError('Camera access denied. Please allow camera access or use the "Select Image" option instead.', 'Camera Access Denied');
      } else if (error.name === 'NotFoundError') {
        notifications?.showError('No camera found. Please use the "Select Image" option instead.', 'Camera Not Found');
      } else {
        notifications?.showError('Camera not available. Please use the "Select Image" option instead.', 'Camera Unavailable');
      }
    }
  };
  const PremiumModal = () => (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}
      onClick={(e) => {
        // Close modal if clicking on overlay
        if (e.target === e.currentTarget) {
          setShowPremiumModal(false);
        }
      }}
    >
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '400px',
        margin: '20px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={() => setShowPremiumModal(false)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#999'
          }}
        >
          ×
        </button>
        
        <h2 style={{ color: '#333', marginBottom: '15px' }}>🎯 Daily Limit Reached</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          You've used all 5 free scans today. Upgrade to continue scanning and unlock premium features!
        </p>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#2c5530' }}>Premium Features:</h3>
          <ul style={{ textAlign: 'left', color: '#666' }}>
            <li>✅ Unlimited daily scans</li>
            <li>✅ Export results to PDF</li>
            <li>✅ Advanced sharing options</li>
            <li>✅ Priority AI responses</li>
            <li>✅ Historical scan tracking</li>
          </ul>
        </div><div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button 
            onClick={() => setShowCheckout(true)}
            style={{
              backgroundColor: '#2c5530',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            🚀 Upgrade to Premium
          </button>
          <button 
            onClick={() => setShowPremiumModal(false)}
            style={{
              backgroundColor: '#f5f5f5',
              color: '#333',
              border: '1px solid #ddd',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );  // Function to prompt free tier users to sign up
  const promptSignUp = () => {
    setShowLoginModal(true);
  };
  const handleDownload = () => {
    if (!suggestions) {
      notifications?.showWarning("No suggestions to download yet.", "Nothing to Download");
      return;
    }

    // Generate professional download report with proper watermarking
    const reportData = generateDownloadReport(suggestions, medicationName, userTier, user);

    // Create and trigger download
    const blob = new Blob([reportData.content], { type: reportData.mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
      paddingBottom: '80px' // Space for bottom nav
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          color: '#2c5530', 
          margin: 0,
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          Mediscan
        </h1>
        <button onClick={handleSignOut} style={{
          backgroundColor: 'transparent',
          border: '1px solid #ddd',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Sign Out
        </button>
      </div>      {/* Main Content */}
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Home Tab Content */}
        {activeBottomTab === "home" && (
          <>            {/* Description */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <p style={{ 
                color: '#666', 
                fontSize: '16px', 
                lineHeight: '1.5',
                margin: '0 0 10px 0'
              }}>
                Scan a medication's barcode or snap a photo to discover natural alternatives.
              </p>
                <p style={{ 
                color: '#2c5530', 
                fontSize: '14px',
                margin: 0
              }}>
                {isLoadingCount ? 'Loading...' : 
                 user ? (isPremium ? '♛ Premium: Unlimited scans' : `${5 - scanCount} scans remaining this month`) :
                 `Free Trial: ${2 - scanCount} scans remaining this session`}
              </p>
              
              <p style={{ 
                color: '#888', 
                fontSize: '12px',
                margin: '5px 0 0 0'
              }}>
                {user ? `Welcome, ${user.displayName || user.email}` : '🆓 Free Trial Mode - Sign up for more features!'}
              </p>
            </div>

        {/* Search Input */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="Search for medications..."
            style={{
              width: '100%',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <button 
            onClick={handleScan}
            disabled={isLoading}
            style={{
              width: '100%',
              backgroundColor: '#2c5530',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              marginTop: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '2px solid #f0f0f0',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => setActiveTab("barcode")}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === "barcode" ? '3px solid #2c5530' : '3px solid transparent',
              color: activeTab === "barcode" ? '#2c5530' : '#666'
            }}
          >
            Barcode
          </button>
          <button
            onClick={() => setActiveTab("photo")}
            style={{
              flex: 1,
              padding: '15px',
              border: 'none',
              backgroundColor: 'transparent',
              fontSize: '16px',
              cursor: 'pointer',
              borderBottom: activeTab === "photo" ? '3px solid #2c5530' : '3px solid transparent',
              color: activeTab === "photo" ? '#2c5530' : '#666'
            }}
          >
            Photo
          </button>
        </div>        {/* Barcode Scanner */}
        {activeTab === "barcode" && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '15px',
              border: isScanning ? '2px dashed #2c5530' : '1px solid #ddd'
            }}>
              {isScanning ? (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>📷</div>
                  <p style={{ color: '#2c5530', margin: 0, fontWeight: 'bold' }}>Scanning barcode...</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📊</div>
                  <p style={{ color: '#999', margin: 0 }}>Barcode Scanner</p>
                  <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '12px' }}>Position barcode in frame</p>
                </div>
              )}
            </div>
            <button 
              onClick={handleBarcodeScan}
              disabled={isScanning || isLoading}
              style={{
                width: '100%',
                backgroundColor: isScanning ? '#ccc' : '#2c5530',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: (isScanning || isLoading) ? 'not-allowed' : 'pointer',
                opacity: (isScanning || isLoading) ? 0.7 : 1
              }}
            >
              {isScanning ? '🔍 Scanning...' : '📊 Scan Barcode'}
            </button>
          </div>
        )}        {/* Photo Scanner */}
        {activeTab === "photo" && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              padding: imagePreview ? '20px' : '40px',
              textAlign: 'center',
              marginBottom: '15px',
              border: isScanning ? '2px dashed #007bff' : '1px solid #ddd',
              minHeight: imagePreview ? 'auto' : '140px'
            }}>
              {isScanning ? (
                <div>
                  <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
                  <p style={{ color: '#007bff', margin: 0, fontWeight: 'bold' }}>
                    {scanningMessage || 'Processing...'}
                  </p>
                </div>
              ) : imagePreview ? (
                <div>
                  <img 
                    src={imagePreview} 
                    alt="Selected medication" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '200px',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}
                  />
                  <p style={{ color: '#28a745', margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                    ✅ Image ready for processing
                  </p>
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setSelectedImage(null);
                    }}
                    style={{
                      marginTop: '10px',
                      backgroundColor: 'transparent',
                      color: '#666',
                      border: '1px solid #ddd',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Remove Image
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
                  <p style={{ color: '#999', margin: 0 }}>Photo Scanner</p>
                  <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '12px' }}>Take photo or select from gallery</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleImageSelect}
              disabled={isScanning || isLoading}
              style={{
                width: '100%',
                backgroundColor: isScanning ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '10px',
                cursor: (isScanning || isLoading) ? 'not-allowed' : 'pointer',
                opacity: (isScanning || isLoading) ? 0.7 : 1
              }}
            >
              {isScanning && scanningMessage.includes('Processing') ? '📂 Processing...' : '📂 Select Image'}
            </button>
            
            <button 
              onClick={handlePhotoScan}
              disabled={isScanning || isLoading}
              style={{
                width: '100%',
                backgroundColor: isScanning ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: (isScanning || isLoading) ? 'not-allowed' : 'pointer',
                opacity: (isScanning || isLoading) ? 0.7 : 1
              }}
            >
              {isScanning && scanningMessage.includes('camera') ? '📷 Opening Camera...' : '📷 Take Photo'}
            </button>
            
            {/* Camera permissions note */}
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#fff3cd',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#856404'
            }}>
              💡 <strong>Note:</strong> Camera access will be requested for photo capture. 
              If denied, use "Select Image" to upload from your device.
            </div>
          </div>
        )}{/* Results */}
        {suggestions && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginBottom: '20px'
          }}>
            {/* Disclaimer - Always at the top */}
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '15px'
            }}>
              <p style={{ 
                margin: 0, 
                color: '#856404', 
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                ⚠️ DISCLAIMER: This information is for educational purposes only. Always consult healthcare professionals before making any medical decisions.
              </p>
            </div>
            
            <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Natural Alternatives:</h3>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              marginBottom: '20px',
              color: '#333',
              lineHeight: '1.6'
            }}>
              {suggestions}
            </div>            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleEmail}
                style={{
                  flex: '1 1 calc(33.33% - 8px)',
                  minWidth: '100px',
                  backgroundColor: (!isPremium && scanCount > 5) ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px 8px',
                  borderRadius: '6px',
                  cursor: (!isPremium && scanCount > 5) ? 'not-allowed' : 'pointer',
                  opacity: (!isPremium && scanCount > 5) ? 0.6 : 1,
                  fontSize: '14px'
                }}
                disabled={!isPremium && scanCount > 5}
              >
                📧 {!user ? 'Sign Up to Email' : (!isPremium && scanCount > 5) ? 'Email (Premium)' : 'Email'}
              </button>
              
              <button 
                onClick={handleShare}
                style={{
                  flex: '1 1 calc(33.33% - 8px)',
                  minWidth: '100px',
                  backgroundColor: (!isPremium && scanCount > 5) ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px 8px',
                  borderRadius: '6px',
                  cursor: (!isPremium && scanCount > 5) ? 'not-allowed' : 'pointer',
                  opacity: (!isPremium && scanCount > 5) ? 0.6 : 1,
                  fontSize: '14px'
                }}
                disabled={!isPremium && scanCount > 5}
              >
                📤 {(!isPremium && scanCount > 5) ? 'Share (Premium)' : 'Share'}
              </button>
              
              <button 
                onClick={handleDownload}
                style={{
                  flex: '1 1 calc(33.33% - 8px)',
                  minWidth: '100px',
                  backgroundColor: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '12px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}              >
                💾 Download
              </button>
            </div>
            
            {!isPremium && scanCount > 5 && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <p style={{ 
                  margin: 0, 
                  color: '#856404', 
                  fontSize: '14px' 
                }}>
                  🔒 Upgrade to Premium to email and share your results
                </p>
                <button
                  onClick={() => setShowPremiumModal(true)}
                  style={{
                    marginTop: '8px',
                    backgroundColor: '#2c5530',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Upgrade Now
                </button>
              </div>            )}
          </div>
        )}
        
        {/* Educational Disclaimer */}
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#2c5530', marginBottom: '10px', fontSize: '16px' }}>📚 Important Information</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
            <li>This app provides educational information only</li>
            <li>Natural alternatives may interact with medications</li>
            <li>Always consult your healthcare provider before making changes</li>
            <li>Do not stop prescribed medications without medical supervision</li>
            <li>Results are AI-generated and may not be comprehensive</li>          </ul>
        </div>
        </>
        )}
        
        {/* Scan History Tab Content (Premium Only) */}
        {activeBottomTab === "scans" && (
          <>
            {isPremium ? (
              <ScanHistory user={user} />
            ) : (
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                textAlign: 'center'
              }}>
                <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>📊 Scan History</h3>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Scan history is a premium feature. Upgrade to save and view your medication scans!
                </p>
                <button 
                  onClick={() => setShowCheckout(true)}
                  style={{
                    backgroundColor: '#2c5530',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  💎 Upgrade to Premium
                </button>
              </div>
            )}
          </>        )}
        
        {/* Info Tab Content */}
        {activeBottomTab === "info" && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <h3 style={{ color: '#2c5530', marginBottom: '20px' }}>ℹ️ About MediScan</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>What is MediScan?</h4>
              <p style={{ color: '#666', lineHeight: '1.5' }}>
                MediScan helps you discover natural alternatives to your medications using AI-powered analysis. 
                Simply scan or upload your medication to get personalized suggestions.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>Features</h4>
              <ul style={{ color: '#666', paddingLeft: '20px' }}>
                <li>📷 Camera & photo scanning</li>
                <li>🔍 Barcode recognition</li>
                <li>🤖 AI-powered suggestions</li>
                <li>📊 Scan history (Premium)</li>
                <li>📤 Export & sharing (Premium)</li>
              </ul>
            </div>            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '10px' }}>Privacy & Safety</h4>
              <p style={{ color: '#666', lineHeight: '1.5' }}>
                Your health data is encrypted and secure. Always consult healthcare professionals 
                before making medication changes.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#333', marginBottom: '15px' }}>Legal & Privacy</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#2c5530',
                    border: '1px solid #2c5530',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>🔒 Privacy Policy</span>
                  <span>→</span>
                </button>
                
                <button
                  onClick={() => setShowTermsOfUse(true)}
                  style={{
                    backgroundColor: '#f8f9fa',
                    color: '#2c5530',
                    border: '1px solid #2c5530',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>📋 Terms of Use</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            <div style={{ 
              backgroundColor: '#fff3cd', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #ffeaa7',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#856404', marginTop: 0, marginBottom: '10px' }}>⚠️ Medical Disclaimer</h4>
              <p style={{ color: '#856404', fontSize: '14px', margin: 0 }}>
                This app provides educational information only. Always consult qualified healthcare 
                professionals for medical advice, diagnosis, and treatment decisions.
              </p>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                onClick={() => setActiveBottomTab("home")}
                style={{
                  backgroundColor: '#2c5530',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Back to Scanner
              </button>
            </div>
          </div>
        )}        {/* Profile Tab Content */}
        {activeBottomTab === "profile" && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            {user ? (
              // Logged in user profile
              <>
                <h3 style={{ color: '#2c5530', marginBottom: '20px' }}>👤 Your Profile</h3>
                
                {/* User Info */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '24px', marginRight: '15px' }}>👤</div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>
                        {user.displayName || 'User'}
                      </div>
                      <div style={{ color: '#666', fontSize: '14px' }}>
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                {userProfile && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#333', marginBottom: '15px' }}>Profile Details</h4>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Age</label>
                      <div style={{ color: '#333', fontWeight: 'bold' }}>
                        {userProfile.age || 'Not specified'}
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Health Goals</label>
                      <div style={{ color: '#333' }}>
                        {userProfile.healthGoals && userProfile.healthGoals.length > 0 
                          ? userProfile.healthGoals.join(', ') 
                          : 'Not specified'}
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Onboarding Completed</label>
                      <div style={{ color: '#333' }}>
                        {userProfile.onboardingCompleted ? '✅ Yes' : '❌ No'}
                      </div>
                    </div>                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Premium Status</label>
                      <div style={{ color: '#333' }}>
                        {isPremium ? '💎 Premium Member' : '🆓 Free Plan'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Device Analytics */}
                {deviceAnalytics && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#333', marginBottom: '15px' }}>📊 Device Analytics</h4>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Device ID</label>
                      <div style={{ color: '#333', fontSize: '12px', fontFamily: 'monospace' }}>
                        {getDeviceId()?.substring(0, 16)}...
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Total Device Scans</label>
                      <div style={{ color: '#333', fontWeight: 'bold' }}>
                        {deviceAnalytics.totalScanCount || 0}
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Session Count</label>
                      <div style={{ color: '#333' }}>
                        {deviceAnalytics.sessionCount || 0}
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Platform</label>
                      <div style={{ color: '#333' }}>
                        {deviceAnalytics.platform || 'Unknown'}
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ color: '#666', fontSize: '14px' }}>Location</label>
                      <div style={{ color: '#333' }}>
                        {deviceAnalytics.ipLocation ? 
                          `${deviceAnalytics.ipLocation.city}, ${deviceAnalytics.ipLocation.country}` 
                          : 'Unknown'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Admin Analytics Dashboard */}
                {isAdmin && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ color: '#333', marginBottom: '15px' }}>🔧 Admin Controls</h4>
                    <button
                      onClick={() => setActiveBottomTab("analytics")}
                      style={{
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        width: '100%',
                        marginBottom: '10px'
                      }}
                    >
                      📊 View Analytics Dashboard
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Free tier user (not logged in)
              <>
                {/* Show device info for free tier users too */}
                <h3 style={{ color: '#2c5530', marginBottom: '20px' }}>📊 Session Info</h3>
                
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ color: '#666', fontSize: '14px' }}>Device ID</label>
                    <div style={{ color: '#333', fontSize: '12px', fontFamily: 'monospace' }}>
                      {getDeviceId()?.substring(0, 16)}...
                    </div>
                  </div>                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ color: '#666', fontSize: '14px' }}>Daily Scans</label>
                    <div style={{ color: '#333', fontWeight: 'bold' }}>
                      {localStorage.getItem('freeTierDailyCount') || 0} / 1
                    </div>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ color: '#666', fontSize: '14px' }}>Total Device Scans</label>
                    <div style={{ color: '#333' }}>
                      {deviceAnalytics?.totalScanCount || 0}
                    </div>
                  </div>
                </div>
                
                <h3 style={{ color: '#2c5530', marginBottom: '20px' }}>🚀 Free Trial</h3>
                
                <div style={{
                  backgroundColor: '#e8f5e8',
                  border: '2px solid #4caf50',
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>👋</div>
                  <h4 style={{ color: '#2c5530', marginBottom: '10px' }}>
                    Welcome to MediScan!
                  </h4>                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    You get 1 free scan per day. Sign up for more!
                  </p>
                  
                  <div style={{ 
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}>                    <div style={{ color: '#333', fontWeight: 'bold', marginBottom: '5px' }}>
                      Daily Progress: {localStorage.getItem('freeTierDailyCount') || 0}/1 scans used today
                    </div>
                    <div style={{
                      backgroundColor: '#f0f0f0',
                      height: '8px',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        backgroundColor: (localStorage.getItem('freeTierDailyCount') || 0) >= 1 ? '#ff6b6b' : '#4caf50',
                        height: '100%',
                        width: `${Math.min(((localStorage.getItem('freeTierDailyCount') || 0) / 1) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <button
                    onClick={promptSignUp}
                    style={{
                      backgroundColor: '#4285f4',
                      color: 'white',
                      border: 'none',
                      padding: '15px 30px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      width: '100%',
                      marginBottom: '15px'
                    }}
                  >
                    🚀 Sign Up for More Features!
                  </button>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                    Sign up to get 5 scans per month + permanent scan history
                  </div>
                </div>

                <div style={{
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ color: '#856404', marginTop: 0, marginBottom: '10px' }}>
                    🎯 Sign Up Benefits:
                  </h4>                  <ul style={{ color: '#856404', margin: 0, paddingLeft: '20px' }}>
                    <li><strong>Basic Plan ($7.99/month)</strong> - 10 scans monthly</li>
                    <li><strong>30-day storage</strong> vs 3-day free storage</li>
                    <li><strong>No watermarks</strong> on results</li>
                    <li><strong>Email results</strong> directly</li>
                    <li><strong>Premium upgrade option</strong> for 50 scans + permanent storage</li>
                  </ul></div>
              </>
            )}
            
            {/* Action Buttons - only for logged in users */}
            {user && (
              <div style={{ marginTop: '20px' }}>
                {!isPremium && (
                  <button 
                    onClick={() => setShowCheckout(true)}
                    style={{
                      backgroundColor: '#2c5530',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginBottom: '10px',
                      width: '100%'
                    }}
                  >
                    💎 Upgrade to Premium
                  </button>
                )}
                  <button
                  onClick={handleSignOut}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    marginBottom: '10px'
                  }}
                >
                  🚪 Sign Out
                </button>
                
                {/* Account Deletion Button */}
                <button
                  onClick={() => setShowAccountDeletion(true)}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '14px'
                  }}
                >
                  🗑️ Delete Account
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0'
      }}>        <div 
          onClick={() => {
            setActiveBottomTab("home");
            trackEvent('navigation', { tab: 'home', fromTab: activeBottomTab });
          }}
          style={{ 
            textAlign: 'center', 
            color: activeBottomTab === "home" ? '#2c5530' : '#999',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '20px' }}>🏠</div>
          <div style={{ fontSize: '12px' }}>Home</div>
        </div>
        <div 
          onClick={() => {
            if (isPremium) {
              setActiveBottomTab("scans");
              trackEvent('navigation', { tab: 'scans', fromTab: activeBottomTab, isPremium: true });
            } else {
              trackEvent('premium_feature_blocked', { feature: 'scan_history', currentTab: activeBottomTab });
            }
          }}
          style={{ 
            textAlign: 'center', 
            color: activeBottomTab === "scans" ? '#2c5530' : '#999',
            cursor: isPremium ? 'pointer' : 'not-allowed',
            opacity: isPremium ? 1 : 0.5
          }}
        >
          <div style={{ fontSize: '20px' }}>📊</div>
          <div style={{ fontSize: '12px' }}>
            {isPremium ? 'Scans' : 'Scans 💎'}
          </div>
        </div>        <div 
          onClick={() => {
            setActiveBottomTab("info");
            trackEvent('navigation', { tab: 'info', fromTab: activeBottomTab });
          }}
          style={{ 
            textAlign: 'center', 
            color: activeBottomTab === "info" ? '#2c5530' : '#999',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '20px' }}>ℹ️</div>
          <div style={{ fontSize: '12px' }}>Info</div>
        </div>
        <div 
          onClick={() => {
            setActiveBottomTab("profile");
            trackEvent('navigation', { tab: 'profile', fromTab: activeBottomTab });
          }}
          style={{ 
            textAlign: 'center', 
            color: activeBottomTab === "profile" ? '#2c5530' : '#999',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '20px' }}>👤</div>
          <div style={{ fontSize: '12px' }}>Profile</div>
        </div></div>

      {/* Legal Document Modals */}
      {showPrivacyPolicy && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
          </div>
        </div>
      )}

      {showTermsOfUse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <TermsOfUse onBack={() => setShowTermsOfUse(false)} />
          </div>
        </div>
      )}



      {/* Premium Modal */}
      {showPremiumModal && <PremiumModal />}
        {/* Checkout Modal */}
      {showCheckout && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1001
          }}
          onClick={(e) => {
            // Close modal if clicking on overlay
            if (e.target === e.currentTarget) {
              setShowCheckout(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            maxWidth: '500px',
            margin: '20px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowCheckout(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999',
                zIndex: 1002
              }}
            >
              ×
            </button>              <EnhancedPremiumCheckout 
              user={user} 
              onSuccess={handlePremiumSuccess}
              onCancel={handleCheckoutCancel}
            />
          </div>
        </div>
      )}

      {/* AI Sharing Disclaimer Modal */}
      {showAIDisclaimer && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002,
            padding: '20px'
          }}
          onClick={(e) => {
            // Close modal if clicking on overlay
            if (e.target === e.currentTarget) {
              handleAIDisclaimerReject();
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            maxWidth: '400px',
            width: '100%',
            padding: '25px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <button
              onClick={handleAIDisclaimerReject}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#999',
                lineHeight: 1
              }}
            >
              ×
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚠️</div>
              <h2 style={{ 
                color: '#dc3545', 
                marginBottom: '5px',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                AI Medical Disclaimer
              </h2>
            </div>

            <div style={{ 
              backgroundColor: '#fff9c4',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>⚠️</span>
                <span style={{ 
                  color: '#856404', 
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  IMPORTANT: This is AI-Generated Information
                </span>
              </div>
              
              <ul style={{ 
                color: '#856404',
                fontSize: '12px',
                lineHeight: '1.4',
                paddingLeft: '20px',
                margin: 0
              }}>
                <li><strong>NOT Medical Advice:</strong> This information is for educational purposes only</li>
                <li><strong>AI May Be Wrong:</strong> Artificial intelligence can make errors or provide incomplete information</li>
                <li><strong>Consult Professionals:</strong> Always verify with licensed healthcare providers, pharmacists, or doctors</li>
                <li><strong>Emergency Situations:</strong> For urgent health matters, contact emergency services immediately</li>
                <li><strong>No Liability:</strong> MediScan is not responsible for any decisions made based on AI suggestions</li>
              </ul>
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#495057'
            }}>
              <strong>By sharing this information, you acknowledge that:</strong>
              <br />
              You understand this is AI-generated educational content and not professional medical advice
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '10px',
              justifyContent: 'space-between'
            }}>
              <button
                onClick={handleAIDisclaimerReject}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  flex: 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAIDisclaimerAccept}
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  flex: 2
                }}
              >
                I Understand & Share
              </button>
            </div>          </div>
        </div>
      )}

      {/* Login Modal - Only shown when user wants to upgrade */}
      {showLoginModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1003,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLoginModal(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '100%',
            padding: '0',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                lineHeight: 1,
                zIndex: 1
              }}
            >
              ×
            </button>
            
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '30px 30px 20px 30px',
              textAlign: 'center',
              marginBottom: '0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚀</div>
              <h2 style={{ 
                color: '#2c5530', 
                marginBottom: '10px',
                fontSize: '24px'
              }}>
                Unlock Your Health Journey!
              </h2>
              <p style={{ color: '#666', margin: 0, fontSize: '16px' }}>
                Free trial limit reached. Sign up to continue scanning!
              </p>
            </div>

            <div style={{ padding: '20px 30px 30px 30px' }}>
              <div style={{
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#856404', marginTop: 0, marginBottom: '10px', fontSize: '16px' }}>
                  🎁 What You Get With Sign Up:
                </h3>
                <ul style={{ color: '#856404', margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                  <li><strong>5 scans per month</strong> (vs 2 trial scans)</li>
                  <li><strong>Permanent scan history</strong> - never lose insights</li>
                  <li><strong>Email your results</strong> to doctors and family</li>
                  <li><strong>Monthly refresh</strong> - reliable access</li>
                  <li><strong>Premium upgrade option</strong> for unlimited scans</li>
                </ul>
              </div>

              <Login />
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Modal */}
      {showAccountDeletion && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1003,
            padding: '20px'
          }}
          onClick={(e) => {
            // Close modal if clicking on overlay
            if (e.target === e.currentTarget) {
              setShowAccountDeletion(false);
            }
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowAccountDeletion(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                lineHeight: 1,
                zIndex: 10
              }}
            >
              ×
            </button>
            
            <AccountDeletion
              user={user}
              onCancel={() => setShowAccountDeletion(false)}
              onSuccess={() => {
                setShowAccountDeletion(false);
                // User will be signed out automatically by AccountDeletion component
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
