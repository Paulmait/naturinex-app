import React from 'react';

function PrivacyPolicy({ onBack }) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '1px solid #e0e0e0',
        paddingBottom: '15px'
      }}>
        <h2 style={{ color: '#2c5530', margin: 0 }}>🔒 Privacy Policy</h2>
        <button 
          onClick={onBack}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ lineHeight: '1.6', color: '#333' }}>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          <strong>Last Updated: June 22, 2025</strong>
        </p>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Introduction</h3>
          <p>
            Naturinex ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web service (the "Service").
          </p>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Information We Collect</h3>
          
          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Personal Information</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Account Information:</strong> Name, email address from Google authentication</li>
            <li><strong>Profile Data:</strong> Age, health goals, medical conditions (voluntary)</li>
            <li><strong>Usage Data:</strong> Scan history, medication searches, feature usage</li>
          </ul>

          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Health Information</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Medication Data:</strong> Photos and information about medications you scan</li>
            <li><strong>Search History:</strong> Queries and AI-generated suggestions</li>
            <li><strong>Preferences:</strong> Health goals and interests you provide</li>
          </ul>

          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Technical Information</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Device Information:</strong> Device type, operating system, browser type</li>
            <li><strong>Usage Analytics:</strong> App performance, feature usage, error logs</li>
            <li><strong>IP Address:</strong> For security and analytics purposes</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>How We Use Your Information</h3>
          
          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Primary Uses</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Service Delivery:</strong> Process medication scans and provide AI suggestions</li>
            <li><strong>Account Management:</strong> Maintain your profile and preferences</li>
            <li><strong>Premium Features:</strong> Provide scan history, exports, and enhanced features</li>
          </ul>

          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Secondary Uses</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Improvement:</strong> Enhance app functionality and user experience</li>
            <li><strong>Support:</strong> Provide customer service and technical assistance</li>
            <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security issues</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Information Sharing and Disclosure</h3>
          
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #e9ecef',
            marginBottom: '15px'
          }}>
            <h4 style={{ color: '#d63384', marginTop: 0, marginBottom: '10px' }}>We DO NOT Share Your Health Information</h4>
            <ul style={{ paddingLeft: '20px', color: '#666', margin: 0 }}>
              <li>Your medication data and health information are <strong>NEVER</strong> sold to third parties</li>
              <li>We do not share personal health data with pharmaceutical companies</li>
              <li>Scan results and health queries remain private to your account</li>
            </ul>
          </div>

          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Limited Sharing Scenarios</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Service Providers:</strong> Trusted partners who help operate our service (Firebase, Stripe)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
            <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale (with notice)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Data Security</h3>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Encryption:</strong> All data transmitted using industry-standard encryption</li>
            <li><strong>Secure Storage:</strong> Health data stored in encrypted, HIPAA-compliant systems</li>
            <li><strong>Access Controls:</strong> Strict employee access limitations</li>
            <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Your Rights and Choices</h3>
          
          <h4 style={{ color: '#333', marginTop: '15px', marginBottom: '10px' }}>Account Controls</h4>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Access:</strong> View and download your personal data</li>
            <li><strong>Correction:</strong> Update or correct your information</li>
            <li><strong>Deletion:</strong> Request account and data deletion</li>
            <li><strong>Portability:</strong> Export your data in common formats</li>
          </ul>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            padding: '15px', 
            borderRadius: '8px', 
            border: '1px solid #ffeaa7'
          }}>
            <h3 style={{ color: '#856404', marginTop: 0, marginBottom: '10px' }}>⚠️ Medical Disclaimer</h3>
            <p style={{ color: '#856404', margin: 0 }}>
              <strong>IMPORTANT:</strong> Naturinex provides educational information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult qualified healthcare providers before making medical decisions.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>Contact Information</h3>
          <p style={{ color: '#666' }}>
            If you have questions about this Privacy Policy, please contact us:
          </p>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li><strong>Email:</strong> privacy@Naturinex.app</li>
            <li><strong>Address:</strong> [Your Business Address]</li>
            <li><strong>Phone:</strong> [Your Phone Number]</li>
          </ul>
        </section>

        <div style={{ 
          textAlign: 'center', 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginTop: '30px'
        }}>
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            This Privacy Policy is effective as of the date listed above and governs your use of the Naturinex service.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
