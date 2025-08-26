import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app.onrender.com';

function Dashboard({ user }) {
  const [suggestions, setSuggestions] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [medicationName, setMedicationName] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [scanCount, setScanCount] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleSignOut = () => {
    signOut(auth).catch(console.error);
  };

  // const handleImage = (e) => {
  //   // File upload for future image processing implementation
  //   console.log('File selected:', e.target.files[0]);
  // };

  const handleScan = async () => {
    if (!medicationName.trim()) {
      alert("Please enter a medication name to get suggestions.");
      return;
    }

    setIsLoading(true);
    
    try {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      const today = new Date().toISOString().slice(0, 10);

      let scans = 0;

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastScanDate === today) {
          scans = data.scanCount || 0;
        } else {
          await updateDoc(userRef, { scanCount: 0, lastScanDate: today });
        }
      } else {
        await setDoc(userRef, { scanCount: 0, lastScanDate: today, isPremium: false });
      }

      setScanCount(scans);

      if (scans >= 5) {
        setShowPremiumModal(true);
        setIsLoading(false);
        return;
      }

      await updateDoc(userRef, {
        scanCount: scans + 1,
        lastScanDate: today
      });

      setScanCount(scans + 1);

      const res = await fetch(`${API_URL}/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicationName: medicationName.trim() })
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      alert("AI is currently unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmail = () => {
    if (!suggestions) {
      alert("No suggestions to email yet.");
      return;
    }
    const mailto = `mailto:${user.email}?subject=Your Naturinex Results&body=${encodeURIComponent(suggestions)}`;
    window.location.href = mailto;
  };

  const handleShare = () => {
    if (navigator.share && suggestions) {
      navigator.share({
        title: 'Naturinex Results',
        text: suggestions,
        url: window.location.href,
      });
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(suggestions);
      alert('Results copied to clipboard!');
    }
  };

  const PremiumModal = () => (
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '400px',
        margin: '20px',
        textAlign: 'center'
      }}>
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
        </div>
        <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
          <button style={{
            backgroundColor: '#2c5530',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}>
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
  );

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
          Naturinex
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
      </div>

      {/* Main Content */}
      <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
        
        {/* Description */}
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
            {5 - scanCount} scans remaining today.
          </p>
          <p style={{ 
            color: '#888', 
            fontSize: '12px',
            margin: '5px 0 0 0'
          }}>
            User ID: {user.uid.substring(0, 20)}...
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
        </div>

        {/* Photo Scanner */}
        {activeTab === "photo" && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              backgroundColor: '#f0f0f0',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              marginBottom: '15px'
            }}>
              <p style={{ color: '#999', margin: 0 }}>Photo Scanner</p>
            </div>
            <button style={{
              width: '100%',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}>
              Select Image
            </button>
            <button style={{
              width: '100%',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              padding: '15px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}>
              Scan Medication
            </button>
          </div>
        )}

        {/* Results */}
        {suggestions && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Natural Alternatives:</h3>
            <div style={{ 
              whiteSpace: 'pre-wrap', 
              marginBottom: '20px',
              color: '#333',
              lineHeight: '1.6'
            }}>
              {suggestions}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={handleEmail}
                style={{
                  flex: 1,
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📧 Email
              </button>
              <button 
                onClick={handleShare}
                style={{
                  flex: 1,
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📤 Share
              </button>
            </div>
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
      }}>
        <div style={{ textAlign: 'center', color: '#2c5530' }}>
          <div style={{ fontSize: '20px' }}>🏠</div>
          <div style={{ fontSize: '12px' }}>Home</div>
        </div>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '20px' }}>📊</div>
          <div style={{ fontSize: '12px' }}>Scans</div>
        </div>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '20px' }}>ℹ️</div>
          <div style={{ fontSize: '12px' }}>Info</div>
        </div>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '20px' }}>👤</div>
          <div style={{ fontSize: '12px' }}>Profile</div>
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && <PremiumModal />}
    </div>
  );
}

export default Dashboard;
