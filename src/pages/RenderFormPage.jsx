import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  MenuItem,
  CircularProgress,
  Alert,
  Divider,
  Stack
} from '@mui/material';
import api from '../utils/api';

const RenderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useContext(AuthContext);

  const getAutofillValue = (field, userData) => {
    if (!userData) return '';

    const normalizedName = field.name.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

    const matches = (keywords) =>
      keywords.some(kw => normalizedName.includes(kw) || normalizedLabel.includes(kw));

    if (matches(['fullname', 'name']) && !matches(['reason', 'lecturer', 'dean', 'hod', 'approver'])) return userData.name;
    if (matches(['email'])) return userData.email;
    if (matches(['nic'])) return userData.nic;
    if (matches(['mobile', 'contact', 'phone', 'tel'])) return userData.mobile;
    if (matches(['index', 'reg', 'registration', 'studentid'])) return userData.indexNumber;
    if (matches(['dept', 'department'])) return userData.department;

    return '';
  };

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get(`/forms/${id}`);
        setForm(response.data);

        // Initialize form data state with autofill logic
        const initialData = {};
        response.data.fields.forEach(field => {
          if (field.type === 'checkbox') {
            initialData[field.name] = [];
          } else {
            const autofilled = getAutofillValue(field, user);
            initialData[field.name] = autofilled || '';
          }
        });
        setFormData(initialData);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching form.');
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      const currentValues = [...(formData[name] || [])];
      if (checked) {
        currentValues.push(value);
      } else {
        const index = currentValues.indexOf(value);
        if (index > -1) currentValues.splice(index, 1);
      }
      setFormData(prev => ({ ...prev, [name]: currentValues }));
    } else if (type === 'file') {
      setFormData(prevData => ({
        ...prevData,
        [name]: files[0],
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const isVisible = (field) => {
    if (!field.logic?.showIf?.field) return true;

    const targetValue = formData[field.logic.showIf.field];
    const expectedValue = field.logic.showIf.value;
    const operator = field.logic.showIf.operator || 'equals';

    if (operator === 'equals') return targetValue === expectedValue;
    if (operator === 'notEquals') return targetValue !== expectedValue;
    if (operator === 'contains') return targetValue?.toString().includes(expectedValue);

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('formId', id);

      const submissionData = {};
      form.fields.forEach(f => {
        if (isVisible(f)) {
          if (f.type === 'file' && formData[f.name]) {
            formDataToSend.append(f.name, formData[f.name]);
          } else {
            submissionData[f.name] = formData[f.name];
          }
        }
      });

      formDataToSend.append('data', JSON.stringify(submissionData));

      await api.post('/form-submissions', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting form.');
      setSubmitting(false);
    }
  };

  const renderFieldInput = (field) => {
    const commonProps = {
      name: field.name,
      required: isVisible(field) && field.validation?.required,
      onChange: handleChange,
      fullWidth: true,
      variant: 'outlined',
      size: 'medium'
    };

    switch (field.type) {
      case 'text':
        return <TextField {...commonProps} value={formData[field.name] || ''} />;

      case 'textarea':
        return <TextField {...commonProps} multiline rows={4} value={formData[field.name] || ''} />;

      case 'select':
        return (
          <TextField {...commonProps} select value={formData[field.name] || ''}>
            <MenuItem value=""><em>-- Select an option --</em></MenuItem>
            {field.options.map((option, index) => (
              <MenuItem key={index} value={option}>{option}</MenuItem>
            ))}
          </TextField>
        );

      case 'radio':
        return (
          <FormControl component="fieldset">
            <RadioGroup name={field.name} value={formData[field.name] || ''} onChange={handleChange}>
              {field.options.map((option, index) => (
                <FormControlLabel key={index} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormGroup>
            {field.options.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    name={field.name}
                    value={option}
                    checked={(formData[field.name] || []).includes(option)}
                    onChange={handleChange}
                  />
                }
                label={option}
              />
            ))}
          </FormGroup>
        );

      case 'date':
        return <TextField {...commonProps} type="date" InputLabelProps={{ shrink: true }} value={formData[field.name] || ''} />;

      case 'file':
        return (
          <Box>
            {!formData[field.name] ? (
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{
                  height: '56px',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: 'primary.main',
                  '&:hover': { borderWidth: 2, borderStyle: 'dashed' }
                }}
              >
                Upload File Attachment
                <input type="file" hidden name={field.name} onChange={handleChange} />
              </Button>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: 'action.hover',
                  borderColor: 'success.main'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    📎 {formData[field.name].name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({(formData[field.name].size / 1024).toFixed(1)} KB)
                  </Typography>
                </Box>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setFormData(prev => ({ ...prev, [field.name]: null }))}
                >
                  Remove
                </Button>
              </Paper>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>;
  if (error) return <Box p={3}><Alert severity="error">{error}</Alert></Box>;
  if (!form) return <Box p={3}><Alert severity="warning">Form not found.</Alert></Box>;

  return (
    <Box sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>{form.name}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{form.description}</Typography>
        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleSubmit}>
          <Stack spacing={4}>
            {form.fields.map(field => isVisible(field) && (
              <Box key={field._id}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {field.label} {field.validation?.required && <span style={{ color: 'red' }}>*</span>}
                </Typography>
                {renderFieldInput(field)}
              </Box>
            ))}

            <Box sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                fullWidth
                sx={{ height: '56px', fontSize: '1.1rem' }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Form'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default RenderFormPage;