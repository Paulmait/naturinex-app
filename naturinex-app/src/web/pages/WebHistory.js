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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Search,
  Download,
  Delete,
  MoreVert,
  Lock,
  CheckCircle,
  Visibility,
  LocalFlorist,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
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
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [viewingScan, setViewingScan] = useState(null);

  const navigate = useNavigate();
  const user = auth.currentUser;
  const itemsPerPage = 10;

  const isPremium = ['premium', 'plus', 'pro'].includes(userData?.subscriptionType?.toLowerCase());

  useEffect(() => {
    loadUserData();
  }, [user]);

  useEffect(() => {
    if (isPremium) {
      loadScans();
    } else {
      setLoading(false);
    }
  }, [user, isPremium]);

  const loadUserData = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
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

    if (searchTerm) {
      filtered = filtered.filter(scan =>
        scan.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.analysis?.summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

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

  const handleViewDetails = () => {
    setViewingScan(selectedScan);
    setDetailsDialogOpen(true);
    handleMenuClose();
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
    const data = filteredScans.map(scan => ({
      date: scan.timestamp.toLocaleDateString(),
      product: scan.productName || scan.medication_name || 'Unknown',
      type: scan.scanType || 'manual',
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
    a.download = `naturinex-scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paginatedScans = filteredScans.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Premium upgrade prompt for free users
  if (!isPremium && !loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Lock sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Scan History
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Upgrade to Premium to save and access your complete scan history.
          </Typography>

          <Card sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Premium Features
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Unlimited scan history" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Access from any device" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Export to CSV & PDF" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Advanced AI analysis" />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/subscription')}
            sx={{ px: 4, py: 1.5 }}
          >
            Upgrade to Premium
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading scan history...</Typography>
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
        >
          Export CSV
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
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 3 },
                    transition: 'box-shadow 0.2s',
                  }}
                  onClick={() => {
                    setViewingScan(scan);
                    setDetailsDialogOpen(true);
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {scan.productName || scan.medication_name || 'Unknown Medication'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip
                            label={scan.scanType || 'Manual'}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={scan.timestamp.toLocaleDateString()}
                            size="small"
                          />
                          {scan.natural_alternatives && (
                            <Chip
                              icon={<LocalFlorist />}
                              label={`${Array.isArray(scan.natural_alternatives) ? scan.natural_alternatives.length : '?'} alternatives`}
                              size="small"
                              color="success"
                            />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {scan.analysis?.summary || 'Click to view details'}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuOpen(e, scan);
                        }}
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
        <MenuItem onClick={handleViewDetails}>
          <Visibility fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Scan Details
        </DialogTitle>
        <DialogContent dividers>
          {viewingScan && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {viewingScan.productName || viewingScan.medication_name || 'Unknown Medication'}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  Scanned on
                </Typography>
                <Typography>
                  {viewingScan.timestamp.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Typography>
              </Box>

              {viewingScan.analysis?.summary && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Analysis Summary
                  </Typography>
                  <Typography>{viewingScan.analysis.summary}</Typography>
                </Box>
              )}

              {viewingScan.natural_alternatives && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Natural Alternatives
                  </Typography>
                  <List>
                    {(Array.isArray(viewingScan.natural_alternatives)
                      ? viewingScan.natural_alternatives
                      : []
                    ).map((alt, index) => (
                      <ListItem key={index} sx={{ bgcolor: 'success.50', borderRadius: 1, mb: 1 }}>
                        <ListItemIcon>
                          <LocalFlorist color="success" />
                        </ListItemIcon>
                        <ListItemText
                          primary={alt.name || alt}
                          secondary={alt.description || alt.dosage || null}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default WebHistory;
