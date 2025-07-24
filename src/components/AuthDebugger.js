import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';

function AuthDebugger() {
  const [authInfo, setAuthInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  useEffect(() => {
    const info = {
      currentURL: window.location.href,
      userAgent: navigator.userAgent.substring(0, 50) + '...',
      authDomain: auth.app.options.authDomain,
      projectId: auth.app.options.projectId,
      timestamp: new Date().toLocaleString()
    };
    setAuthInfo(info);
  }, []);

  // Hide debug info in production or when not needed
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <>      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '90px', // Positioned above bottom navigation
          right: '20px',
          backgroundColor: '#2c5530',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '16px',
          cursor: 'pointer',
          zIndex: 10000,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title="Debug Info"
      >
        🔧
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div style={{
          position: 'fixed',
          bottom: '140px', // Positioned above button and navigation
          right: '20px',
          backgroundColor: 'white',
          color: '#333',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '320px',
          zIndex: 9999,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#2c5530',
            color: 'white',
            padding: '8px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            <span>🔧 Debug Info</span>
            <div>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                {isMinimized ? '📖' : '📕'}
              </button>
              <button
                onClick={() => setIsVisible(false)}
                style={{
                  backgroundColor: 'transparent',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div style={{
              padding: '12px',
              fontSize: '11px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>URL:</strong><br />
                <span style={{ wordBreak: 'break-all', color: '#666' }}>
                  {authInfo.currentURL}
                </span>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Project:</strong><br />
                <span style={{ color: '#666' }}>{authInfo.projectId}</span>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Auth Domain:</strong><br />
                <span style={{ color: '#666', wordBreak: 'break-all' }}>
                  {authInfo.authDomain}
                </span>
              </div>
              
              <div style={{ marginBottom: '8px' }}>
                <strong>Device:</strong><br />
                <span style={{ color: '#666' }}>{authInfo.userAgent}</span>
              </div>
              
              <div>
                <strong>Last Update:</strong><br />
                <span style={{ color: '#666' }}>{authInfo.timestamp}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default AuthDebugger;
