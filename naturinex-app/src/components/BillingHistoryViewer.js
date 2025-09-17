/**
 * Billing History Viewer Component
 * Comprehensive billing history with export and filtering capabilities
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import {
  Download,
  Receipt,
  FilterList,
  Search,
  FileDownload,
  Visibility,
  Print,
  CalendarToday,
  TrendingUp,
  AttachMoney
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { supabase } from '../config/supabase';
import subscriptionManager from '../services/subscriptionManager';

const BillingHistoryViewer = ({ userId }) => {
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');

  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    if (userId) {
      loadBillingHistory();
    }
  }, [userId]);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBillingHistory(data || []);
    } catch (error) {
      setError('Failed to load billing history');
      console.error('Error loading billing history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredHistory = useMemo(() => {
    return billingHistory.filter((item) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!item.description?.toLowerCase().includes(searchLower) &&
            !item.invoice_id?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Date range filter
      const itemDate = new Date(item.created_at);
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo && itemDate > dateTo) return false;

      // Amount range filter
      const amount = item.amount / 100; // Convert from cents
      if (amountFrom && amount < parseFloat(amountFrom)) return false;
      if (amountTo && amount > parseFloat(amountTo)) return false;

      return true;
    });
  }, [billingHistory, searchTerm, statusFilter, dateFrom, dateTo, amountFrom, amountTo]);

  // Pagination logic
  const paginatedHistory = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredHistory.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredHistory, page, rowsPerPage]);

  // Summary calculations
  const summary = useMemo(() => {
    const paidTransactions = filteredHistory.filter(item => item.status === 'paid');
    const totalPaid = paidTransactions.reduce((sum, item) => sum + item.amount, 0) / 100;
    const totalTransactions = filteredHistory.length;
    const averageAmount = totalTransactions > 0 ? totalPaid / paidTransactions.length : 0;

    return {
      totalPaid,
      totalTransactions,
      averageAmount: averageAmount || 0,
      paidCount: paidTransactions.length
    };
  }, [filteredHistory]);

  const handleDownloadInvoice = async (invoiceId) => {
    if (!invoiceId) return;

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/download-invoice/${invoiceId}`, {
        headers: {
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (error) {
      setError('Failed to download invoice');
      console.error('Error downloading invoice:', error);
    }
  };

  const handleExportHistory = async (format = 'csv') => {
    try {
      const queryParams = new URLSearchParams({
        format,
        search: searchTerm,
        status: statusFilter,
        dateFrom: dateFrom?.toISOString() || '',
        dateTo: dateTo?.toISOString() || '',
        amountFrom: amountFrom || '',
        amountTo: amountTo || ''
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/export-billing-history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${await subscriptionManager.getAuthToken()}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-history-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setExportDialogOpen(false);
      } else {
        throw new Error('Failed to export billing history');
      }
    } catch (error) {
      setError('Failed to export billing history');
      console.error('Error exporting billing history:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom(null);
    setDateTo(null);
    setAmountFrom('');
    setAmountTo('');
    setPage(0);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'refunded': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt />
                Billing History
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<FileDownload />}
                  onClick={() => setExportDialogOpen(true)}
                  size="small"
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={clearFilters}
                  size="small"
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <AttachMoney color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">
                      ${summary.totalPaid.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Receipt color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">
                      {summary.totalTransactions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Transactions
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TrendingUp color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">
                      ${summary.averageAmount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Amount
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <CalendarToday color="primary" sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="h6">
                      {summary.paidCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Successful Payments
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Filters */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Filters
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Search"
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                      >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                        <MenuItem value="refunded">Refunded</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="From Date"
                      value={dateFrom}
                      onChange={setDateFrom}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <DatePicker
                      label="To Date"
                      value={dateTo}
                      onChange={setDateTo}
                      renderInput={(params) => <TextField {...params} size="small" fullWidth />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Min Amount ($)"
                      variant="outlined"
                      size="small"
                      type="number"
                      value={amountFrom}
                      onChange={(e) => setAmountFrom(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Max Amount ($)"
                      variant="outlined"
                      size="small"
                      type="number"
                      value={amountTo}
                      onChange={(e) => setAmountTo(e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Billing History Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedHistory.length > 0 ? (
                    paginatedHistory.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{formatDate(item.created_at)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {item.description || 'Subscription payment'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(item.amount, item.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            color={getStatusColor(item.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {item.invoice_id ? (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {item.invoice_id.substring(0, 8)}...
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {item.period_start && item.period_end ? (
                            <Typography variant="body2">
                              {formatDate(item.period_start)} - {formatDate(item.period_end)}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedTransaction(item);
                                  setDetailDialogOpen(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            {item.invoice_id && (
                              <Tooltip title="Download Invoice">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadInvoice(item.invoice_id)}
                                >
                                  <Download />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 4 }}>
                          <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No billing history found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {billingHistory.length === 0
                              ? 'You haven\'t made any payments yet'
                              : 'No transactions match your current filters'
                            }
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {filteredHistory.length > 0 && (
              <TablePagination
                component="div"
                count={filteredHistory.length}
                page={page}
                onPageChange={(event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Dialog */}
        <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogContent>
            {selectedTransaction && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>Date</Typography>
                    <Typography variant="body2">{formatDate(selectedTransaction.created_at)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>Amount</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>Status</Typography>
                    <Chip
                      label={selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      color={getStatusColor(selectedTransaction.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>Invoice ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {selectedTransaction.invoice_id || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Description</Typography>
                    <Typography variant="body2">
                      {selectedTransaction.description || 'Subscription payment'}
                    </Typography>
                  </Grid>
                  {selectedTransaction.period_start && selectedTransaction.period_end && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Billing Period</Typography>
                      <Typography variant="body2">
                        {formatDate(selectedTransaction.period_start)} - {formatDate(selectedTransaction.period_end)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            {selectedTransaction?.invoice_id && (
              <Button
                onClick={() => handleDownloadInvoice(selectedTransaction.invoice_id)}
                startIcon={<Download />}
              >
                Download Invoice
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)}>
          <DialogTitle>Export Billing History</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>
              Export your billing history in your preferred format. The export will include all transactions matching your current filters.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Found {filteredHistory.length} transactions to export.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleExportHistory('csv')} variant="contained">
              Export as CSV
            </Button>
            <Button onClick={() => handleExportHistory('pdf')} variant="outlined">
              Export as PDF
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BillingHistoryViewer;