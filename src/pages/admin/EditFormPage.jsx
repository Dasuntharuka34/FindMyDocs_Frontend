import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const EditFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get(`/forms/${id}`);
        const { name, description, fields } = response.data;
        setName(name);
        setDescription(description);
        setFields(fields);
        setLoading(false);
      } catch (err) {
        setError('Error fetching form details.');
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleFieldChange = (index, e) => {
    const newFields = [...fields];
    if (e.target.name === 'required') {
        newFields[index].validation = { ...newFields[index].validation, required: e.target.checked };
    } else if (e.target.name === 'options') {
        newFields[index].options = e.target.value.split(',').map(opt => opt.trim());
    } else {
        newFields[index][e.target.name] = e.target.value;
    }
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { name: '', label: '', type: 'text', options: [], validation: { required: false } }]);
  };

  const removeField = (index) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/forms/${id}`, { name, description, fields });
      navigate('/admin/forms');
    } catch (err) {
      setError('Error updating form.');
    }
  };

  if (loading) {
    return <p>Loading form...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <div>
      <h2>Edit Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Form Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Form Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <hr />

        <h3>Form Fields</h3>
        {fields.map((field, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
            <div>
              <label>Label</label>
              <input type="text" name="label" value={field.label} onChange={(e) => handleFieldChange(index, e)} required />
            </div>
            <div>
              <label>Name (for internal use)</label>
              <input type="text" name="name" value={field.name} onChange={(e) => handleFieldChange(index, e)} required />
            </div>
            <div>
              <label>Type</label>
              <select name="type" value={field.type} onChange={(e) => handleFieldChange(index, e)}>
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="select">Select</option>
                <option value="file">File</option>
                <option value="date">Date</option>
              </select>
            </div>
            {field.type === 'select' && (
              <div>
                <label>Options (comma-separated)</label>
                <input type="text" name="options" value={field.options.join(', ')} onChange={(e) => handleFieldChange(index, e)} />
              </div>
            )}
            <div>
              <label>
                <input type="checkbox" name="required" checked={field.validation?.required || false} onChange={(e) => handleFieldChange(index, e)} />
                Required
              </label>
            </div>
            <button type="button" onClick={() => removeField(index)}>Remove Field</button>
          </div>
        ))}

        <button type="button" onClick={addField}>Add Field</button>

        <hr />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditFormPage;