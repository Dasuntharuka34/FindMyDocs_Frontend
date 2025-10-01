import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../utils/api';

const ViewFormPage = () => {
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await api.get(`/forms/${id}`);
        setForm(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching form details.');
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

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
      <hr />
      <h3>Form Fields</h3>
      {form.fields.length === 0 ? (
        <p>No fields in this form.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {form.fields.map((field, index) => (
            <li key={index} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
              <strong>Label:</strong> {field.label} <br />
              <strong>Name:</strong> {field.name} <br />
              <strong>Type:</strong> {field.type} <br />
              {field.options && field.options.length > 0 && (
                <>
                  <strong>Options:</strong> {field.options.join(', ')} <br />
                </>
              )}
              <strong>Required:</strong> {field.validation?.required ? 'Yes' : 'No'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewFormPage;