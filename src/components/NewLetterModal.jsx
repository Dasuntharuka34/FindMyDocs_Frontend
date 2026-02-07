import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import '../styles/components/NewLetterModal.css';

function NewLetterModal({ user, onClose, onSubmit }) {
  const navigate = useNavigate();
  const [dynamicForms, setDynamicForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicForms = async () => {
      try {
        const response = await api.get('/forms/available');
        setDynamicForms(response.data);
      } catch (error) {
        console.error("Error fetching dynamic forms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDynamicForms();
  }, []);

  const getLetterTypes = () => {
    // Only use names from the forms returned by the API (which are already filtered as available)
    const types = dynamicForms.map(form => form.name);

    // Ensure "Other" is always an option if needed, but per requirements we want to control everything
    if (!types.includes("Other")) {
      types.push("Other");
    }

    return types;
  };

  const letterTypes = getLetterTypes();

  const [formData, setFormData] = useState({
    type: letterTypes[0] || "Medical Certificate",
    reason: "",
    date: "",
    attachments: null,
  });

  // Update initial type when forms are loaded
  useEffect(() => {
    if (letterTypes.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: letterTypes[0] }));
    }
  }, [letterTypes, formData.type]);

  const handleChange = e => {
    const { name, value, files } = e.target;
    if (name === 'attachments') {
      setFormData(prev => ({ ...prev, attachments: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = e => {
    e.preventDefault();

    const selectedDynamicForm = dynamicForms.find(f => f.name === formData.type);

    if (formData.type === "Medical Certificate") {
      onClose();
      navigate('/excuse-request');
    } else if (formData.type === "Leave Request") {
      onClose();
      navigate('/leave-request');
    } else if (selectedDynamicForm) {
      onClose();
      navigate(`/fill-form/${selectedDynamicForm._id}`);
    } else {
      onSubmit({
        type: formData.type,
        reason: formData.reason,
        date: formData.date,
        attachments: formData.attachments
      });
    }
  };

  const isDynamicTypeSelected = dynamicForms.some(f => f.name === formData.type);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="modal">
        <h2 id="modalTitle">New Letter Request</h2>
        {loading ? (
          <p>Loading form options...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Letter Type
              <select name="type" value={formData.type} onChange={handleChange} required>
                {letterTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>

            {/* The following fields are now conditionally rendered based on selected type */}
            {formData.type !== "Medical Certificate" &&
              formData.type !== "Leave Request" &&
              !isDynamicTypeSelected && (
                <>
                  <label>
                    Reason
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows="3"
                      required
                    />
                  </label>

                  <label>
                    Date
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </label>

                  <label>
                    Attachments
                    <input
                      type="file"
                      name="attachments"
                      accept=".pdf,.jpg,.png,.doc,.docx"
                      onChange={handleChange}
                      required
                    />
                  </label>
                </>
              )}

            {/* Message for non-static forms */}
            {(formData.type === "Medical Certificate" ||
              formData.type === "Leave Request" ||
              isDynamicTypeSelected) && (
                <p className="form-note">
                  Please click "Next" to proceed to the specific {formData.type} Form.
                </p>
              )}

            <div className="modal-actions">
              <button type="submit" className="submit-btn">Next</button>
              <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default NewLetterModal;
