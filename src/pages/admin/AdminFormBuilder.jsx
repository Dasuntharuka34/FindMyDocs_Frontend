import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

export default function AdminFormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', fields: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      const fetchForm = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/forms/${id}`);
          setForm(data);
          setLoading(false);
        } catch (err) {
          setError('Failed to load form');
          setLoading(false);
        }
      };
      fetchForm();
    }
  }, [id]);

  const handleAddField = () => {
    setForm({ ...form, fields: [...form.fields, { name: '', label: '', type: 'text' }] });
  };

  const handleRemoveField = (index) => {
    const fields = [...form.fields];
    fields.splice(index, 1);
    setForm({ ...form, fields });
  };

  const handleFieldChange = (index, e) => {
    const fields = [...form.fields];
    fields[index][e.target.name] = e.target.value;
    setForm({ ...form, fields });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (id) {
        await api.put(`/forms/${id}`, form);
      } else {
        await api.post('/forms', form);
      }
      setLoading(false);
      navigate('/admin/forms');
    } catch (err) {
      setError('Failed to save form');
      setLoading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name</label>
      <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

      <label>Description</label>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />

      <h3>Fields</h3>
      {form.fields.map((field, index) => (
        <div key={index}>
          <input type="text" name="name" placeholder="Field Name" value={field.name} onChange={(e) => handleFieldChange(index, e)} />
          <input type="text" name="label" placeholder="Field Label" value={field.label} onChange={(e) => handleFieldChange(index, e)} />
          <select name="type" value={field.type} onChange={(e) => handleFieldChange(index, e)}>
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="select">Select</option>
            <option value="file">File</option>
            <option value="date">Date</option>
          </select>
          <button type="button" onClick={() => handleRemoveField(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={handleAddField}>Add Field</button>

      <button type="submit">Save Form</button>
    </form>
  );
}
