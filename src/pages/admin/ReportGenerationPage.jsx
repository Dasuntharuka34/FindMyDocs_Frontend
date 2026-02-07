import React, { useState, useContext } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Download as DownloadIcon, BarChart as ReportIcon } from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  background: 'var(--card-bg)',
}));

const ReportGenerationPage = () => {
  const { token } = useContext(AuthContext);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);

    try {
      // Use token from context (sessionStorage) instead of localStorage
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(process.env.REACT_APP_BACKEND_URL + '/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ startDate, endDate, reportType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertToCSV = (objArray) => {
    if (!objArray || objArray.length === 0) return '';
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';

    // Extract headers
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';

    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (const index in headers) {
        if (line !== '') line += ',';

        let val = array[i][headers[index]];
        // Handle nested objects (like user or submittedBy)
        if (typeof val === 'object' && val !== null) {
          val = val.name || val.regNumber || val.indexNumber || JSON.stringify(val);
        }

        // Escape commas and wrap in quotes if needed
        const stringVal = String(val).replace(/"/g, '""');
        line += `"${stringVal}"`;
      }
      str += line + '\r\n';
    }
    return str;
  };

  const downloadCSV = (data, filename = 'report.csv') => {
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderTable = (data, title, type) => {
    if (!data || data.length === 0) return null;

    let headers = [];
    if (type === 'users') {
      headers = ['Name', 'Email', 'Role', 'NIC', 'Registration Date'];
    } else if (type === 'submissions') {
      headers = ['User', 'Index/Reg Number', 'Form Title', 'Status', 'Date'];
    } else {
      headers = ['User', 'Index/Reg Number', 'Reason/Type', 'Status', 'Date'];
    }

    return (
      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            {title} ({data.length})
          </Typography>
          <Tooltip title="Download CSV">
            <IconButton onClick={() => downloadCSV(data, `${title.replace(/\s+/g, '_')}_Report.csv`)} color="primary">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index} hover>
                  {type === 'users' ? (
                    <>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>{row.nic}</TableCell>
                      <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                    </>
                  ) : type === 'submissions' ? (
                    <>
                      <TableCell>{row.submittedBy?.name || row.user?.name || row.studentName || 'N/A'}</TableCell>
                      <TableCell>{row.submittedBy?.indexNumber || row.user?.regNumber || row.studentId || row.regNo || 'N/A'}</TableCell>
                      <TableCell>{row.formTitle || row.form?.title || 'Form Submission'}</TableCell>
                      <TableCell>{row.status || 'Submitted'}</TableCell>
                      <TableCell>{new Date(row.createdAt || row.submittedAt).toLocaleDateString()}</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{row.studentName || row.user?.name || 'N/A'}</TableCell>
                      <TableCell>{row.studentId || row.regNo || row.user?.regNumber || 'N/A'}</TableCell>
                      <TableCell>{row.reason || row.leaveType || row.excuseType || 'Request'}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{new Date(row.createdAt || row.submittedDate).toLocaleDateString()}</TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderReportData = () => {
    if (!reportData) return null;

    if (reportType === 'all') {
      return (
        <>
          {renderTable(reportData.formSubmissions, 'Form Submissions', 'submissions')}
          {renderTable(reportData.leaveRequests, 'Leave Requests', 'requests')}
          {renderTable(reportData.excuseRequests, 'Excuse Requests', 'requests')}
        </>
      );
    }

    if (reportType === 'users') {
      return renderTable(reportData.users, 'User Registrations', 'users');
    }

    if (reportType === 'formSubmissions') {
      return renderTable(reportData, 'Form Submissions', 'submissions');
    }

    if (reportType === 'leaveRequests') {
      return renderTable(reportData, 'Leave Requests', 'requests');
    }

    if (reportType === 'excuseRequests') {
      return renderTable(reportData, 'Excuse Requests', 'requests');
    }

    if (reportType === 'approvedRequests') {
      return (
        <>
          {renderTable(reportData.formSubmissions, 'Approved Form Submissions', 'submissions')}
          {renderTable(reportData.leaveRequests, 'Approved Leave Requests', 'requests')}
          {renderTable(reportData.excuseRequests, 'Approved Excuse Requests', 'requests')}
        </>
      );
    }

    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'var(--text-h2)' }}>
              Admin Report Generation
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-primary)' }}>
              Generate detailed reports for user registrations, form submissions, and various requests.
            </Typography>
          </Box>
          <Button
            component={Link}
            to="/admin/reports/custom"
            variant="outlined"
            startIcon={<ReportIcon />}
          >
            Custom Report Builder
          </Button>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                label="Report Type"
              >
                <MenuItem value="all">All Activities</MenuItem>
                <MenuItem value="users">User Registrations</MenuItem>
                <MenuItem value="formSubmissions">Form Submissions</MenuItem>
                <MenuItem value="leaveRequests">Leave Requests</MenuItem>
                <MenuItem value="excuseRequests">Excuse Requests</MenuItem>
                <MenuItem value="approvedRequests">Approved Requests</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={handleGenerateReport}
              disabled={loading}
              sx={{
                height: '56px',
                background: 'linear-gradient(45deg, #1a237e 30%, #3f51b5 90%)',
                color: 'white',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0d47a1 30%, #1a237e 90%)',
                }
              }}
              fullWidth
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Report'}
            </Button>
          </Grid>
        </Grid>
        {error && (
          <Box mt={2}>
            <Typography color="error" variant="body2">{error}</Typography>
          </Box>
        )}
        {renderReportData()}

        {reportData && (
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (reportType === 'all' || reportType === 'approvedRequests') {
                  downloadCSV(reportData.formSubmissions, 'Form_Submissions.csv');
                  downloadCSV(reportData.leaveRequests, 'Leave_Requests.csv');
                  downloadCSV(reportData.excuseRequests, 'Excuse_Requests.csv');
                } else if (reportType === 'users') {
                  downloadCSV(reportData.users, 'Users.csv');
                } else {
                  downloadCSV(reportData, `${reportType}.csv`);
                }
              }}
              variant="outlined"
            >
              Export All to CSV
            </Button>
          </Box>
        )}
      </StyledPaper>
    </Container>
  );
};

export default ReportGenerationPage;
