// Admin Dashboard for Naturinex
// Comprehensive analytics and management interface

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People,
  Scanner,
  TrendingUp,
  AttachMoney,
  Refresh,
  Download,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalScans: 0,
    todayScans: 0,
    premiumUsers: 0,
    revenue: 0,
    conversionRate: 0,
    avgScansPerUser: 0,
  });
  const [recentScans, setRecentScans] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    checkAdminAccess();
    if (isAdmin) {
      loadDashboardData();
    }
  }, [currentUser]);

  const checkAdminAccess = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // Check if user is admin in Supabase
      if (supabase) {
        const { data } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('user_id', currentUser.uid)
          .single();

        if (data && (data.role === 'admin' || data.is_admin)) {
          setIsAdmin(true);
          loadDashboardData();
        } else {
          // Fallback: Check if email matches admin email
          if (currentUser.email === 'guampaul@gmail.com') {
            setIsAdmin(true);
            loadDashboardData();
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        }
      } else {
        // Firebase fallback
        const idTokenResult = await currentUser.getIdTokenResult();
        if (idTokenResult.claims.admin || currentUser.email === 'guampaul@gmail.com') {
          setIsAdmin(true);
          loadDashboardData();
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Admin check error:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (supabase) {
        // Load from Supabase
        await Promise.all([
          loadSupabaseStats(),
          loadRecentScans(),
          loadRecentUsers(),
          loadSubscriptions(),
        ]);
      } else {
        // Fallback to API
        await loadAPIStats();
      }
    } catch (error) {
      console.error('Dashboard loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupabaseStats = async () => {
    try {
      // Get user stats
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');

      if (!profileError) {
        const totalUsers = profiles.length;
        const premiumUsers = profiles.filter(p =>
          p.subscription_tier === 'plus' || p.subscription_tier === 'pro'
        ).length;
        const activeToday = profiles.filter(p => {
          const lastActive = new Date(p.updated_at);
          const today = new Date();
          return lastActive.toDateString() === today.toDateString();
        }).length;

        // Get scan stats
        const { data: scans } = await supabase
          .from('scans')
          .select('*');

        const totalScans = scans?.length || 0;
        const todayScans = scans?.filter(s => {
          const scanDate = new Date(s.created_at);
          const today = new Date();
          return scanDate.toDateString() === today.toDateString();
        }).length || 0;

        // Calculate revenue (example: $6.99 * plus users + $12.99 * pro users)
        const plusUsers = profiles.filter(p => p.subscription_tier === 'plus').length;
        const proUsers = profiles.filter(p => p.subscription_tier === 'pro').length;
        const monthlyRevenue = (plusUsers * 6.99) + (proUsers * 12.99);

        setStats({
          totalUsers,
          activeUsers: activeToday,
          totalScans,
          todayScans,
          premiumUsers,
          revenue: monthlyRevenue,
          conversionRate: ((premiumUsers / totalUsers) * 100).toFixed(2),
          avgScansPerUser: (totalScans / totalUsers).toFixed(1),
        });
      }
    } catch (error) {
      console.error('Stats loading error:', error);
    }
  };

  const loadRecentScans = async () => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentScans(data);
      }
    } catch (error) {
      console.error('Recent scans error:', error);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentUsers(data);
      }
    } catch (error) {
      console.error('Recent users error:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('subscription_tier', 'free')
        .order('updated_at', { ascending: false });

      if (!error && data) {
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Subscriptions error:', error);
    }
  };

  const loadAPIStats = async () => {
    // Fallback to API endpoint
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('API stats error:', error);
    }
  };

  const exportData = async (type) => {
    try {
      let dataToExport = [];
      let filename = '';

      switch (type) {
        case 'users':
          dataToExport = recentUsers;
          filename = 'users-export.csv';
          break;
        case 'scans':
          dataToExport = recentScans;
          filename = 'scans-export.csv';
          break;
        case 'revenue':
          dataToExport = subscriptions;
          filename = 'revenue-export.csv';
          break;
      }

      // Convert to CSV
      const csv = convertToCSV(dataToExport);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>You do not have admin privileges to access this page.</Typography>
        </Alert>
        <Button onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Return to Home
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Admin Dashboard
        </Typography>
        <Box>
          <IconButton onClick={() => loadDashboardData()}>
            <Refresh />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportData('revenue')}
          >
            Export Data
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h3" color="white">
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {stats.activeUsers} active today
                  </Typography>
                </Box>
                <People sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom>
                    Total Scans
                  </Typography>
                  <Typography variant="h3" color="white">
                    {stats.totalScans}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {stats.todayScans} today
                  </Typography>
                </Box>
                <Scanner sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom>
                    Revenue (Monthly)
                  </Typography>
                  <Typography variant="h3" color="white">
                    ${stats.revenue}
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {stats.premiumUsers} premium users
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="white" gutterBottom>
                    Conversion Rate
                  </Typography>
                  <Typography variant="h3" color="white">
                    {stats.conversionRate}%
                  </Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.7)">
                    {stats.avgScansPerUser} scans/user
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 50, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Recent Activity" />
          <Tab label="Users" />
          <Tab label="Subscriptions" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Scans
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Medication</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentScans.map((scan) => (
                      <TableRow key={scan.id}>
                        <TableCell>{scan.medication_name}</TableCell>
                        <TableCell>{scan.user_id?.substring(0, 8)}...</TableCell>
                        <TableCell>
                          {new Date(scan.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                New Users
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Email</TableCell>
                      <TableCell>Tier</TableCell>
                      <TableCell>Joined</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.subscription_tier || 'free'}
                            size="small"
                            color={user.subscription_tier === 'pro' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Add more tab content as needed */}
    </Container>
  );
}