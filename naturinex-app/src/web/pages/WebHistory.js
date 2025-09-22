import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Pagination,
  Alert,
} from '@mui/material';
import {
  Search,
  Download,
  Delete,
  MoreVert,
} from '@mui/icons-material';
// Firebase auth imported from firebase.web
import { collection, query, where, orderBy, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase.web';
function WebHistory() {
  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);
  const [userData, setUserData] = useState(null);
  const user = auth.currentUser;
  const itemsPerPage = 10;
  useEffect(() => {
    loadScans();
    loadUserData();
  }, [user]);
  const loadUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  useEffect(() => {
    filterScans();
  }, [scans, searchTerm, filterType]);
  const loadScans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const scansQuery = query(
        collection(db, 'scans'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(scansQuery);
      const scansData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(doc.data().timestamp),
      }));
      setScans(scansData);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };
  const filterScans = () => {
    let filtered = [...scans];
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(scan =>
        scan.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.analysis?.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(scan => scan.scanType === filterType);
    }
    setFilteredScans(filtered);
    setPage(1);
  };
  const handleMenuOpen = (event, scan) => {
    setAnchorEl(event.currentTarget);
    setSelectedScan(scan);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedScan(null);
  };
  const handleDelete = async () => {
    if (selectedScan) {
      try {
        await deleteDoc(doc(db, 'scans', selectedScan.id));
        setScans(scans.filter(s => s.id !== selectedScan.id));
        handleMenuClose();
      } catch (error) {
        console.error('Error deleting scan:', error);
      }
    }
  };
  const exportScans = () => {
    // Check if user has premium subscription
    if (userData?.subscriptionType !== 'premium') {
      alert('Export to CSV is a Premium feature. Please upgrade to access this feature.');
      return;
    }
    const data = filteredScans.map(scan => ({
      date: scan.timestamp.toLocaleDateString(),
      product: scan.productName,
      type: scan.scanType,
      summary: scan.analysis?.summary || '',
    }));
    const csv = [
      ['Date', 'Product', 'Type', 'Summary'],
      ...data.map(row => [row.date, row.product, row.type, row.summary])
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scan-history.csv';
    a.click();
  };
  const paginatedScans = filteredScans.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Loading scan history...</Typography>
      </Container>
    );
  }
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Scan History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Download />}
          onClick={exportScans}
          disabled={filteredScans.length === 0}
          title={userData?.subscriptionType !== 'premium' ? 'Premium feature' : ''}
        >
          Export {userData?.subscriptionType !== 'premium' && '🔒'}
        </Button>
      </Box>
      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={filterType === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('all')}
                  size="small"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'image' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('image')}
                  size="small"
                >
                  Image
                </Button>
                <Button
                  variant={filterType === 'text' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('text')}
                  size="small"
                >
                  Text
                </Button>
                <Button
                  variant={filterType === 'barcode' ? 'contained' : 'outlined'}
                  onClick={() => setFilterType('barcode')}
                  size="small"
                >
                  Barcode
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {/* Scan List */}
      {paginatedScans.length > 0 ? (
        <>
          <Grid container spacing={2}>
            {paginatedScans.map((scan) => (
              <Grid item xs={12} key={scan.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {scan.productName || 'Unknown Product'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          <Chip
                            label={scan.scanType || 'Manual'}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={scan.timestamp.toLocaleDateString()}
                            size="small"
                          />
                          {scan.analysis?.safetyRating && (
                            <Chip
                              label={`Safety: ${scan.analysis.safetyRating}/10`}
                              size="small"
                              color={scan.analysis.safetyRating >= 7 ? 'success' : 'warning'}
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {scan.analysis?.summary || 'No summary available'}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, scan)}
                        size="small"
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(filteredScans.length / itemsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      ) : (
        <Alert severity="info">
          {searchTerm || filterType !== 'all'
            ? 'No scans found matching your filters.'
            : 'No scan history yet. Start scanning products to see them here!'}
        </Alert>
      )}
      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          // View details logic
          handleMenuClose();
        }}>
          View Details
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
}
export default WebHistory;