import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CameraAlt,
  History,
  TrendingUp,
  LocalOffer,
  ArrowForward,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { } from 'firebase/auth';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';

function WebDashboard() {
  const [userData, setUserData] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [stats, setStats] = useState({
    totalScans: 0,
    scansToday: 0,
    scansThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      // Load user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      // Load recent scans
      const scansQuery = query(
        collection(db, 'scans'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      const scansSnapshot = await getDocs(scansQuery);
      const scansData = scansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentScans(scansData);

      // Calculate stats
      const allScansQuery = query(
        collection(db, 'scans'),
        where('userId', '==', user.uid)
      );
      const allScansSnapshot = await getDocs(allScansQuery);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      let scansToday = 0;
      let scansThisMonth = 0;
      
      allScansSnapshot.docs.forEach(doc => {
        const scanDate = doc.data().timestamp?.toDate() || new Date(doc.data().timestamp);
        if (scanDate >= today) scansToday++;
        if (scanDate >= thisMonth) scansThisMonth++;
      });
      
      setStats({
        totalScans: allScansSnapshot.size,
        scansToday,
        scansThisMonth,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionColor = (type) => {
    return type === 'premium' ? 'success' : 'default';
  };

  const getScanLimit = () => {
    if (userData?.subscriptionType === 'premium') return 'Unlimited';
    return `${userData?.dailyScans || 0}/5`;
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Welcome back, {user?.displayName || user?.email?.split('@')[0]}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your wellness journey continues here
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Daily Scans
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {getScanLimit()}
                  </Typography>
                </Box>
                <CameraAlt color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total Scans
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalScans}
                  </Typography>
                </Box>
                <History color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.scansThisMonth}
                  </Typography>
                </Box>
                <TrendingUp color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Subscription
                  </Typography>
                  <Chip
                    label={userData?.subscriptionType?.toUpperCase() || 'FREE'}
                    color={getSubscriptionColor(userData?.subscriptionType)}
                    size="small"
                  />
                </Box>
                <LocalOffer color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
              color: 'white',
              cursor: 'pointer',
              transition: 'transform 0.3s',
              '&:hover': {
                transform: 'scale(1.02)',
              },
            }}
            onClick={() => navigate('/scan')}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Start New Scan
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Scan or upload product images for instant wellness insights
                  </Typography>
                </Box>
                <CameraAlt sx={{ fontSize: 48 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {userData?.subscriptionType !== 'premium' && (
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'transform 0.3s',
                '&:hover': {
                  transform: 'scale(1.02)',
                },
              }}
              onClick={() => navigate('/subscription')}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Upgrade to Premium
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Unlimited scans & advanced features for $9.99/month
                    </Typography>
                  </Box>
                  <LocalOffer sx={{ fontSize: 48 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Recent Scans */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Recent Scans
          </Typography>
          <Box>
            <IconButton onClick={loadDashboardData} size="small">
              <Refresh />
            </IconButton>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => navigate('/history')}
            >
              View All
            </Button>
          </Box>
        </Box>
        
        {recentScans.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentScans.map((scan) => (
              <Card key={scan.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {scan.productName || 'Product Scan'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(scan.timestamp?.seconds * 1000 || scan.timestamp).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={scan.scanType || 'Manual'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Alert severity="info">
            No scans yet. Start scanning products to see them here!
          </Alert>
        )}
      </Paper>
    </Container>
  );
}

export default WebDashboard;