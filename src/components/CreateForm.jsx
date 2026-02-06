
import React, { useState } from 'react';
import api from '../utils/api';

const CreateForm = () => {
  const [formName, setFormName] = useState('');
  const [formFields, setFormFields] = useState([{ fieldName: '', fieldType: 'text', required: false }]);
  const [message, setMessage] = useState('');

  const handleAddField = () => {
    setFormFields([...formFields, { fieldName: '', fieldType: 'text', required: false }]);
  };

  const handleRemoveField = (index) => {
    const newFormFields = [...formFields];
    newFormFields.splice(index, 1);
    setFormFields(newFormFields);
  };

  const handleFieldChange = (index, event) => {
    const newFormFields = [...formFields];
    newFormFields[index][event.target.name] = event.target.value;
    setFormFields(newFormFields);
  };

  const handleCheckboxChange = (index, event) => {
    const newFormFields = [...formFields];
    newFormFields[index][event.target.name] = event.target.checked;
    setFormFields(newFormFields);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formattedFields = formFields.map(field => ({
        name: field.fieldName,
        label: field.fieldName, // Or add a separate label input
        type: field.fieldType,
        validation: { required: field.required },
      }));

      await api.post('/forms', { name: formName, description: '', fields: formattedFields });
      setMessage('Form created successfully!');
      setFormName('');
      setFormFields([{ fieldName: '', fieldType: 'text', required: false }]);
    } catch (error) {
      setMessage('Error creating form.');
    }
  };

  return (
    <div>
      <h3>Create a new form</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Form Name:</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
        </div>
        {formFields.map((field, index) => (
          <div key={index}>
            <input
              type="text"
              name="fieldName"
              placeholder="Field Name"
              value={field.fieldName}
              onChange={(e) => handleFieldChange(index, e)}
              required
            />
            <select
              name="fieldType"
              value={field.fieldType}
              onChange={(e) => handleFieldChange(index, e)}
            >
              <option value="text">Text</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="file">File</option>
              <option value="date">Date</option>
            </select>
            <label>
              <input
                type="checkbox"
                name="required"
                checked={field.required}
                onChange={(e) => handleCheckboxChange(index, e)}
              />
              Required
            </label>
            <button type="button" onClick={() => handleRemoveField(index)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={handleAddField}>Add Field</button>
        <button type="submit">Create Form</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateForm;
