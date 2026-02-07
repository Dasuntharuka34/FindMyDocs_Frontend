import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Stack,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import '../../styles/pages/AdminFormBuilder.css';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  History as VersionIcon,
  ContentPaste as TemplateIcon,
  AltRoute as LogicIcon
} from '@mui/icons-material';
import api from '../../utils/api';

export default function AdminFormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    fields: [],
    version: 1,
    isEnabled: true
  });
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, formRes] = await Promise.all([
        api.get('/form-templates'),
        id ? api.get(`/forms/${id}`) : Promise.resolve({ data: null })
      ]);
      setTemplates(templatesRes.data);
      if (formRes.data) setForm(formRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddField = () => {
    const newField = {
      name: '',
      label: '',
      type: 'text',
      options: [],
      validation: { required: false },
      logic: { showIf: { field: '', value: '', operator: 'equals' } }
    };
    setForm({ ...form, fields: [...form.fields, newField] });
  };

  const handleRemoveField = (index) => {
    const fields = [...form.fields];
    fields.splice(index, 1);
    setForm({ ...form, fields });
  };

  const handleFieldChange = (index, field, value) => {
    const fields = [...form.fields];
    const keys = field.split('.');
    if (keys.length > 1) {
      fields[index][keys[0]][keys[1]] = value;
    } else {
      fields[index][field] = value;
    }
    setForm({ ...form, fields });
  };

  const handleLoadTemplate = (template) => {
    setForm({
      ...form,
      fields: template.fields.map(f => ({
        ...f,
        logic: { showIf: { field: '', value: '', operator: 'equals' } }
      }))
    });
  };

  const handleSaveAsTemplate = async () => {
    try {
      await api.post('/form-templates', {
        name: `${form.name} Template`,
        description: form.description,
        fields: form.fields,
        category: 'General'
      });
      alert('Saved as template!');
      fetchData();
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const handleCreateNewVersion = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await api.post(`/forms/${id}/version`);
      alert('New version created!');
      navigate(`/admin/forms/edit/${data._id}`);
    } catch (err) {
      setError('Failed to create new version');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (id) {
        await api.put(`/forms/${id}`, form);
      } else {
        await api.post('/forms', form);
      }
      navigate('/admin/forms');
    } catch (err) {
      setError('Failed to save form');
      setLoading(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" p={5}><CircularProgress /></Box>;

  return (
    <Box className="form-builder-container">
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} className="form-builder-header">
          <Typography variant="h4" fontWeight="bold">
            {id ? 'Edit Form' : 'Create New Form'}
          </Typography>
          <Stack direction="row" spacing={2} className="form-controls-stack">
            {id && (
              <Button variant="outlined" startIcon={<VersionIcon />} onClick={handleCreateNewVersion}>
                Save as New Version
              </Button>
            )}
            <Button variant="outlined" startIcon={<TemplateIcon />} onClick={handleSaveAsTemplate}>
              Save as Template
            </Button>
            <FormControl size="small" sx={{ minWidth: 200 }} className="form-template-select">
              <InputLabel>Load Template</InputLabel>
              <Select label="Load Template" value="" onChange={(e) => handleLoadTemplate(e.target.value)}>
                {templates.map(t => (
                  <MenuItem key={t._id} value={t}>{t.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} className="form-alert error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }} className="form-info-panel">
              <Typography variant="h6" gutterBottom>General Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={3}>
                <TextField
                  label="Form Name"
                  fullWidth
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
                <FormControlLabel
                  control={<Switch checked={form.isEnabled} onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })} />}
                  label="Form Enabled"
                />
                {id && (
                  <Typography variant="body2" color="textSecondary">
                    Current Version: <strong>{form.version}</strong>
                  </Typography>
                )}
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box className="form-fields-header">
              <Typography variant="h6" display="flex" justifyContent="space-between">
                Form Fields
              </Typography>
              <Button startIcon={<AddIcon />} onClick={handleAddField} variant="contained">Add Field</Button>
            </Box>
            <Stack spacing={2}>
              {form.fields.map((field, idx) => (
                <Card key={idx} elevation={2} className="field-card">
                  <CardContent>
                    <Box className="field-inputs-row">
                      <Box className="field-id-input">
                        <label>Field ID (Machine Name)</label>
                        <TextField
                          fullWidth
                          size="small"
                          value={field.name}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.9rem' } }}
                        />
                      </Box>
                      <Box className="field-label-input">
                        <label>Label (Display Text)</label>
                        <TextField
                          fullWidth
                          size="small"
                          value={field.label}
                          onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                          className="field-label-textarea"
                          inputProps={{ style: { minHeight: '40px' } }}
                        />
                      </Box>
                      <Box className="field-type-select">
                        <label>Type</label>
                        <FormControl fullWidth size="small">
                          <Select
                            value={field.type}
                            onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                          >
                            <MenuItem value="text">Text</MenuItem>
                            <MenuItem value="textarea">Textarea</MenuItem>
                            <MenuItem value="select">Select Dropdown</MenuItem>
                            <MenuItem value="radio">Radio Buttons</MenuItem>
                            <MenuItem value="checkbox">Checkboxes</MenuItem>
                            <MenuItem value="file">File Attachment</MenuItem>
                            <MenuItem value="date">Date Picker</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      <Box className="field-required-toggle">
                        <label>Required</label>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={field.validation?.required || false}
                              onChange={(e) => handleFieldChange(idx, 'validation.required', e.target.checked)}
                            />
                          }
                          label=""
                        />
                      </Box>
                      <Box>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveField(idx)}
                          className="field-delete-btn"
                          title="Delete field"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {['select', 'radio', 'checkbox'].includes(field.type) && (
                      <Box className="options-box">
                        <Typography className="options-box-title">Options</Typography>
                        <Box className="options-chips">
                          {field.options?.map((opt, optIdx) => (
                            <Chip
                              key={optIdx}
                              label={opt}
                              onDelete={() => {
                                const newOpts = [...field.options];
                                newOpts.splice(optIdx, 1);
                                handleFieldChange(idx, 'options', newOpts);
                              }}
                            />
                          ))}
                        </Box>
                        <Box className="options-input-container">
                          <TextField
                            size="small"
                            placeholder="Add option and press Enter"
                            fullWidth
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.target.value.trim();
                                if (val) {
                                  const newOpts = [...(field.options || []), val];
                                  handleFieldChange(idx, 'options', newOpts);
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </Box>
                      </Box>
                    )}

                    {/* Logic Section */}
                    <Box className="logic-box">
                      <Typography className="logic-title">
                        <LogicIcon fontSize="small" /> Conditional Logic
                      </Typography>
                      <Box className="logic-controls">
                        <Typography variant="body2">Show if</Typography>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                          <InputLabel>Select Field</InputLabel>
                          <Select
                            label="Select Field"
                            value={field.logic?.showIf?.field || ''}
                            onChange={(e) => handleFieldChange(idx, 'logic.showIf.field', e.target.value)}
                          >
                            <MenuItem value="">Always Visible</MenuItem>
                            {form.fields.filter((_, i) => i !== idx).map(f => (
                              <MenuItem key={f.name} value={f.name}>{f.label || f.name}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {field.logic?.showIf?.field && (
                          <>
                            <FormControl size="small" sx={{ width: 120 }}>
                              <Select
                                value={field.logic.showIf.operator || 'equals'}
                                onChange={(e) => handleFieldChange(idx, 'logic.showIf.operator', e.target.value)}
                              >
                                <MenuItem value="equals">equals</MenuItem>
                                <MenuItem value="notEquals">not equals</MenuItem>
                                <MenuItem value="contains">contains</MenuItem>
                              </Select>
                            </FormControl>
                            <TextField
                              placeholder="Value"
                              size="small"
                              value={field.logic.showIf.value || ''}
                              onChange={(e) => handleFieldChange(idx, 'logic.showIf.value', e.target.value)}
                            />
                          </>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <Button
              variant="contained"
              size="large"
              startIcon={<SaveIcon />}
              type="submit"
              fullWidth
              className="form-save-button"
            >
              Save Form
            </Button>
          </Grid>
        </Grid>
      </form>
      </Box>
    </Box>
  );
}
