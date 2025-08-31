import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Import web components
import WebNavigation from './components/WebNavigation';
import WebHome from './pages/WebHome';
import WebLogin from './pages/WebLogin';
import WebDashboard from './pages/WebDashboard';
import WebScan from './pages/WebScan';
import WebHistory from './pages/WebHistory';
import WebSubscription from './pages/WebSubscription';
import WebProfile from './pages/WebProfile';
import WebPrivacy from './pages/WebPrivacy';
import WebTerms from './pages/WebTerms';
import WebPayment from './pages/WebPayment';

// Import Firebase config for web
import '../firebase.web';

const theme = createTheme({
  palette: {
    primary: {
      main: '#10B981',
      light: '#34D399',
      dark: '#059669',
    },
    secondary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#2563EB',
    },
    background: {
      default: '#F3F4F6',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

function WebApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const PrivateRoute = ({ children }) => {
    if (loading) {
      return <div>Loading...</div>;
    }
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {user && <WebNavigation user={user} />}
          <main style={{ flex: 1, padding: user ? '20px' : 0 }}>
            <Routes>
              <Route path="/" element={user ? <Navigate to="/dashboard" /> : <WebHome />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <WebLogin />} />
              <Route path="/dashboard" element={<PrivateRoute><WebDashboard /></PrivateRoute>} />
              <Route path="/scan" element={<PrivateRoute><WebScan /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><WebHistory /></PrivateRoute>} />
              <Route path="/subscription" element={<PrivateRoute><WebSubscription /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><WebProfile /></PrivateRoute>} />
              <Route path="/payment" element={<PrivateRoute><WebPayment /></PrivateRoute>} />
              <Route path="/privacy" element={<WebPrivacy />} />
              <Route path="/terms" element={<WebTerms />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default WebApp;