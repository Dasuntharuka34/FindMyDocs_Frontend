import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Stack,
    Divider,
    IconButton,
    Tooltip,
    Alert,
    Breadcrumbs,
    Link as MuiLink
} from '@mui/material';
import {
    BarChart as ReportIcon,
    Download as DownloadIcon,
    Save as SaveIcon,
    Schedule as ScheduleIcon,
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const MODEL_FIELDS = {
    ExcuseRequest: ['studentName', 'indexNumber', 'reason', 'status', 'submittedDate', 'department'],
    LeaveRequest: ['studentName', 'indexNumber', 'reason', 'status', 'submittedAt', 'leaveType'],
    Letter: ['student', 'regNo', 'reason', 'status', 'createdAt'],
    User: ['name', 'email', 'role', 'nic', 'mobile', 'department', 'indexNumber', 'createdAt']
};

const CustomReportPage = () => {
    const { token } = useContext(AuthContext);
    const [modelName, setModelName] = useState('ExcuseRequest');
    const [selectedFields, setSelectedFields] = useState(MODEL_FIELDS['ExcuseRequest']);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    useEffect(() => {
        setSelectedFields(MODEL_FIELDS[modelName]);
    }, [modelName]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const filters = {};
            if (statusFilter !== 'All') filters.status = statusFilter;

            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reports/custom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    modelName,
                    fields: selectedFields,
                    filters,
                    startDate,
                    endDate
                })
            });

            if (!response.ok) throw new Error('Failed to generate report');
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (reportData.length === 0) return;

        const headers = selectedFields.join(',');
        const rows = reportData.map(row =>
            selectedFields.map(field => {
                let cell = row[field] === undefined ? '' : row[field];
                if (cell instanceof Date) cell = cell.toLocaleDateString();
                if (typeof cell === 'string' && cell.includes(',')) cell = `"${cell}"`;
                return cell;
            }).join(',')
        );

        const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${modelName}_Custom_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadJSON = () => {
        if (reportData.length === 0) return;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${modelName}_Custom_Report.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Breadcrumbs sx={{ mb: 2 }}>
                    <MuiLink component={Link} to="/admin/reports" underline="hover" color="inherit">Reports</MuiLink>
                    <Typography color="text.primary">Custom Report Builder</Typography>
                </Breadcrumbs>

                <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <ReportIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Custom Report Builder</Typography>
                    </Box>
                    <Stack direction="row" spacing={2}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={downloadJSON}
                            disabled={reportData.length === 0}
                        >
                            Export JSON
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<DownloadIcon />}
                            onClick={downloadCSV}
                            disabled={reportData.length === 0}
                        >
                            Export CSV
                        </Button>
                    </Stack>
                </Box>

                <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel>Data Source</InputLabel>
                                <Select
                                    value={modelName}
                                    label="Data Source"
                                    onChange={(e) => setModelName(e.target.value)}
                                >
                                    <MenuItem value="ExcuseRequest">Excuse Requests</MenuItem>
                                    <MenuItem value="LeaveRequest">Leave Requests</MenuItem>
                                    <MenuItem value="Letter">Letters</MenuItem>
                                    <MenuItem value="User">Users</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <FormControl fullWidth>
                                <InputLabel>Fields to Include</InputLabel>
                                <Select
                                    multiple
                                    value={selectedFields}
                                    onChange={(e) => setSelectedFields(e.target.value)}
                                    input={<OutlinedInput label="Fields to Include" />}
                                    renderValue={(selected) => selected.join(', ')}
                                >
                                    {MODEL_FIELDS[modelName].map((field) => (
                                        <MenuItem key={field} value={field}>
                                            <Checkbox checked={selectedFields.indexOf(field) > -1} />
                                            <ListItemText primary={field} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="Start Date"
                                type="date"
                                fullWidth
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                label="End Date"
                                type="date"
                                fullWidth
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={statusFilter}
                                    label="Status"
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="All">All statuses</MenuItem>
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Approved">Approved</MenuItem>
                                    <MenuItem value="Rejected">Rejected</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                fullWidth
                                sx={{ height: '56px' }}
                                onClick={handleGenerate}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Data'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {reportData.length > 0 && (
                    <TableContainer component={Paper} elevation={2}>
                        <Table stickyHeader>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    {selectedFields.map(field => (
                                        <TableCell key={field}><strong>{field.toUpperCase()}</strong></TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reportData.map((row, idx) => (
                                    <TableRow key={idx} hover>
                                        {selectedFields.map(field => (
                                            <TableCell key={field}>
                                                {typeof row[field] === 'string' && row[field].startsWith('http') ? (
                                                    <MuiLink href={row[field]} target="_blank">View</MuiLink>
                                                ) : (
                                                    row[field]?.toString() || 'N/A'
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
            <MessageModal
                show={messageModal.show}
                title={messageModal.title}
                message={messageModal.message}
                onConfirm={messageModal.onConfirm}
            />
            <Footer />
        </Box>
    );
};

export default CustomReportPage;
