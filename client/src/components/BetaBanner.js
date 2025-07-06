import React, { useState } from 'react';

/**
 * BetaBanner Component - Displays a beta version banner with information about mock features
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.version - Beta version number
 * @returns {JSX.Element} - Rendered component
 */
const BetaBanner = ({ version = process.env.REACT_APP_BETA_VERSION || '1.0.0-beta' }) => {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div style={{
      backgroundColor: '#ffeb3b',
      color: '#333',
      padding: expanded ? '15px' : '8px 15px',
      textAlign: 'center',
      fontSize: expanded ? '14px' : '12px',
      position: 'relative',
      transition: 'all 0.3s ease'
    }}>
      <button
        onClick={() => setVisible(false)}
        aria-label="Close beta notice"
        style={{
          position: 'absolute',
          top: '5px',
          right: '8px',
          background: 'none',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          color: '#333'
        }}
      >
        ×
      </button>
      
      <div style={{ fontWeight: 'bold', marginBottom: expanded ? '10px' : '0' }}>
        🧪 BETA TEST VERSION {version}{' '}
        <button 
          onClick={() => setExpanded(!expanded)} 
          style={{
            background: 'none',
            border: 'none',
            textDecoration: 'underline',
            cursor: 'pointer',
            color: '#333',
            padding: '0',
            fontSize: 'inherit'
          }}
        >
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      </div>
      
      {expanded && (
        <div style={{ textAlign: 'left', marginTop: '10px' }}>
          <p style={{ margin: '0 0 10px 0', lineHeight: '1.4' }}>
            <strong>⚠️ Important Beta Tester Information:</strong>
          </p>
          <ul style={{ margin: '0 0 0 20px', padding: '0', lineHeight: '1.4' }}>
            <li><strong>Mock Barcode Scanning:</strong> Currently using simulated data for testing purposes.</li>
            <li><strong>Known Limitations:</strong> Some features may be incomplete or use placeholder functionality.</li>
            <li><strong>Report Issues:</strong> Use the Feedback button to report any problems.</li>
          </ul>
          <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>
            Thank you for helping test Naturinex!
          </p>
        </div>
      )}
    </div>
  );
};

export default BetaBanner;
