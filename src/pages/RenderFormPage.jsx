import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const RenderFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get(`/forms/${id}`);
        setForm(response.data);
        // Initialize form data state
        const initialData = {};
        response.data.fields.forEach(field => {
          initialData[field.name] = '';
        });
        setFormData(initialData);
        setLoading(false);
      } catch (err) {
        setError('Error fetching form.');
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/form-submissions', { formId: id, data: formData });
      navigate('/my-submissions'); // Redirect to a page where users can see their submissions
    } catch (err) {
      setError('Error submitting form.');
    }
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'text':
        return <input type="text" name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.validation?.required} />;
      case 'textarea':
        return <textarea name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.validation?.required} />;
      case 'select':
        return (
          <select name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.validation?.required}>
            <option value="">-- Select an option --</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      case 'date':
        return <input type="date" name={field.name} value={formData[field.name] || ''} onChange={handleChange} required={field.validation?.required} />;
      case 'file':
        // File input requires special handling, which is more complex.
        // For now, we will render a simple file input.
        return <input type="file" name={field.name} onChange={handleChange} required={field.validation?.required} />;
      default:
        return null;
    }
  };

  if (loading) {
    return <p>Loading form...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!form) {
    return <p>Form not found.</p>;
  }

  return (
    <div>
      <h2>{form.name}</h2>
      <p>{form.description}</p>
      <form onSubmit={handleSubmit}>
        {form.fields.map(field => (
          <div key={field._id} style={{ marginBottom: '15px' }}>
            <label>{field.label}</label>
            {renderField(field)}
          </div>
        ))}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default RenderFormPage;