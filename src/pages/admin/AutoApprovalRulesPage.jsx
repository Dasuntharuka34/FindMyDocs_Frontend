import React, { useState, useEffect, useContext } from 'react';
import {
    Box,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Switch,
    FormControlLabel,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Rule as RuleIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import MessageModal from '../../components/MessageModal';
import Footer from '../../components/Footer';

const AutoApprovalRulesPage = () => {
    const { token } = useContext(AuthContext);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRule, setCurrentRule] = useState({
        name: '',
        requestType: 'Excuse',
        conditions: [{ field: '', operator: 'equals', value: '' }],
        priority: 0,
        isActive: true
    });

    const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auto-approval-rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch rules');
            const data = await response.json();
            setRules(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (rule = null) => {
        if (rule) {
            setIsEditing(true);
            setCurrentRule(rule);
        } else {
            setIsEditing(false);
            setCurrentRule({
                name: '',
                requestType: 'Excuse',
                conditions: [{ field: '', operator: 'equals', value: '' }],
                priority: 0,
                isActive: true
            });
        }
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleRuleChange = (field, value) => {
        setCurrentRule({ ...currentRule, [field]: value });
    };

    const handleConditionChange = (index, field, value) => {
        const newConditions = [...currentRule.conditions];
        newConditions[index][field] = value;
        setCurrentRule({ ...currentRule, conditions: newConditions });
    };

    const addCondition = () => {
        setCurrentRule({
            ...currentRule,
            conditions: [...currentRule.conditions, { field: '', operator: 'equals', value: '' }]
        });
    };

    const removeCondition = (index) => {
        const newConditions = currentRule.conditions.filter((_, i) => i !== index);
        setCurrentRule({ ...currentRule, conditions: newConditions });
    };

    const handleSaveRule = async () => {
        try {
            const url = isEditing
                ? `${process.env.REACT_APP_BACKEND_URL}/api/auto-approval-rules/${currentRule._id}`
                : `${process.env.REACT_APP_BACKEND_URL}/api/auto-approval-rules`;

            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(currentRule)
            });

            if (!response.ok) throw new Error('Failed to save rule');

            fetchRules();
            handleCloseModal();
            setMessageModal({ show: true, title: 'Success', message: `Rule ${isEditing ? 'updated' : 'created'} successfully`, onConfirm: () => setMessageModal({ show: false }) });

        } catch (error) {
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        }
    };

    const handleDeleteRule = async (id) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auto-approval-rules/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete rule');

            fetchRules();
        } catch (error) {
            console.error(error);
            setMessageModal({ show: true, title: 'Error', message: error.message, onConfirm: () => setMessageModal({ show: false }) });
        }
    };

    const toggleRuleStatus = async (id) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auto-approval-rules/${id}/toggle`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to update status');
            fetchRules();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <RuleIcon color="primary" fontSize="large" />
                        <Typography variant="h4" fontWeight="bold">Auto-Approval Rules</Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenModal()}
                        sx={{ backgroundColor: '#1a237e' }}
                    >
                        Create Rule
                    </Button>
                </Box>

                <TableContainer component={Paper} elevation={2}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Type</strong></TableCell>
                                <TableCell><strong>Conditions</strong></TableCell>
                                <TableCell><strong>Priority</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell align="right"><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center">Loading...</TableCell></TableRow>
                            ) : rules.length === 0 ? (
                                <TableRow><TableCell colSpan={6} align="center">No rules found.</TableCell></TableRow>
                            ) : (
                                rules.map((rule) => (
                                    <TableRow key={rule._id} hover>
                                        <TableCell>{rule.name}</TableCell>
                                        <TableCell>
                                            <Chip label={rule.requestType} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>
                                            {rule.conditions.map((c, i) => (
                                                <div key={i} style={{ fontSize: '0.85rem' }}>
                                                    {c.field} {c.operator} {c.value}
                                                </div>
                                            ))}
                                        </TableCell>
                                        <TableCell>{rule.priority}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={rule.isActive}
                                                onChange={() => toggleRuleStatus(rule._id)}
                                                color="primary"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={() => handleOpenModal(rule)} color="primary"><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDeleteRule(rule._id)} color="error"><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Create/Edit Modal */}
            <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <DialogTitle>{isEditing ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
                <DialogContent dividers>
                    <Box display="grid" gap={2}>
                        <TextField
                            label="Rule Name"
                            fullWidth
                            value={currentRule.name}
                            onChange={(e) => handleRuleChange('name', e.target.value)}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel>Request Type</InputLabel>
                            <Select
                                value={currentRule.requestType}
                                label="Request Type"
                                onChange={(e) => handleRuleChange('requestType', e.target.value)}
                            >
                                <MenuItem value="Excuse">Excuse</MenuItem>
                                <MenuItem value="Leave">Leave</MenuItem>
                                <MenuItem value="Letter">Letter</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            label="Priority (Higher runs first)"
                            type="number"
                            fullWidth
                            value={currentRule.priority}
                            onChange={(e) => handleRuleChange('priority', e.target.value)}
                        />

                        <Typography variant="subtitle1" sx={{ mt: 2 }}>Conditions</Typography>
                        {currentRule.conditions.map((condition, index) => (
                            <Box key={index} display="flex" gap={1} alignItems="center">
                                <TextField
                                    label="Field"
                                    size="small"
                                    value={condition.field}
                                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                                    placeholder="e.g. durationDays"
                                />
                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Operator</InputLabel>
                                    <Select
                                        value={condition.operator}
                                        label="Operator"
                                        onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                                    >
                                        <MenuItem value="equals">Equals</MenuItem>
                                        <MenuItem value="notEquals">Not Equals</MenuItem>
                                        <MenuItem value="greaterThan">Greater Than</MenuItem>
                                        <MenuItem value="lessThan">Less Than</MenuItem>
                                        <MenuItem value="contains">Contains</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Value"
                                    size="small"
                                    value={condition.value}
                                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                                />
                                <IconButton onClick={() => removeCondition(index)} color="error" size="small"><DeleteIcon /></IconButton>
                            </Box>
                        ))}
                        <Button startIcon={<AddIcon />} onClick={addCondition} size="small">Add Condition</Button>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={currentRule.isActive}
                                    onChange={(e) => handleRuleChange('isActive', e.target.checked)}
                                />
                            }
                            label="Active"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseModal}>Cancel</Button>
                    <Button onClick={handleSaveRule} variant="contained" color="primary">
                        {isEditing ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default AutoApprovalRulesPage;
