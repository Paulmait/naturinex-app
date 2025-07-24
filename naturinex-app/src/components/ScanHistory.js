import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

function ScanHistory({ user }) {
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadScanHistory = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setScanHistory(data.scanHistory || []);
        }
      } catch (error) {
        console.error("Error loading scan history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.uid) {
      loadScanHistory();
    }
  }, [user?.uid]);

  const exportToPDF = (scan) => {
    // Create a simple text-based PDF export
    const content = `
Naturinex REPORT
Generated: ${new Date().toLocaleDateString()}

Medication: ${scan.medication}
Date Scanned: ${new Date(scan.timestamp).toLocaleDateString()}

Natural Alternatives:
${scan.results}

DISCLAIMER: This information is for educational purposes only. 
Always consult healthcare professionals before making any medical decisions.
    `;
    
    // Create blob and download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Naturinex-${scan.medication}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const shareResults = (scan) => {
    const shareText = `Naturinex Results for ${scan.medication}:\n\n${scan.results}\n\nGenerated on ${new Date(scan.timestamp).toLocaleDateString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Naturinex Results - ${scan.medication}`,
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Results copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading scan history...</p>
      </div>
    );
  }

  if (scanHistory.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>📊 Scan History</h3>
        <p style={{ color: '#666' }}>No scans yet. Start scanning medications to build your history!</p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ color: '#2c5530', marginBottom: '20px' }}>📊 Scan History ({scanHistory.length} scans)</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {scanHistory.slice().reverse().map((scan, index) => (
          <div key={index} style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '15px',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#2c5530', fontSize: '16px' }}>
                {scan.medication}
              </h4>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {new Date(scan.timestamp).toLocaleDateString()}
              </span>
            </div>
            
            <div style={{ 
              marginBottom: '15px', 
              fontSize: '14px', 
              color: '#333',
              lineHeight: '1.5',
              maxHeight: '100px',
              overflowY: 'auto'
            }}>
              {scan.results.length > 200 ? `${scan.results.substring(0, 200)}...` : scan.results}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => exportToPDF(scan)}
                style={{
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📄 Export PDF
              </button>
              <button
                onClick={() => shareResults(scan)}
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📤 Share
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e7f3ff',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#0066cc' }}>
          💎 Premium Feature: Your scan history is automatically saved and available anytime!
        </p>
      </div>
    </div>
  );
}

// Helper function to save scan to history (to be called from Dashboard)
export const saveScanToHistory = async (user, medication, results) => {
  try {
    const userRef = doc(db, "users", user.uid);
    const scanEntry = {
      medication: medication,
      results: results,
      timestamp: Date.now()
    };
    
    await updateDoc(userRef, {
      scanHistory: arrayUnion(scanEntry)
    });
  } catch (error) {
    console.error("Error saving scan to history:", error);
  }
};

export default ScanHistory;
