import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import universityLogo from '../assets/uoj.png';
import Footer from '../components/Footer';
import '../styles/pages/RegisterPage.css';
import MessageModal from '../components/MessageModal';
import { validateEmail, validateNic } from '../utils/validation';


export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    nic: "",
    mobile: "", // Added mobile field
    department: "",
    accountType: "Student",
    password: "",
    confirmPassword: "",
    indexNumber: ""
  });

  const [error, setError] = useState("");
  const [departmentsList, setDepartmentsList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [messageModal, setMessageModal] = useState({ show: false, title: '', message: '' });
  const navigate = useNavigate();

  React.useEffect(() => {
    // Fetch departments
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/departments`)
      .then(res => res.json())
      .then(data => setDepartmentsList(data))
      .catch(err => console.error("Error fetching departments:", err));

    // Fetch public roles
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/roles/public`)
      .then(res => res.json())
      .then(data => {
        setRolesList(data);
        // Set default accountType if 'Student' exists in fetched roles
        if (data.some(role => role.name === 'Student')) {
          setFormData(prev => ({ ...prev, accountType: 'Student' }));
        } else if (data.length > 0) {
          setFormData(prev => ({ ...prev, accountType: data[0].name }));
        }
      })
      .catch(err => console.error("Error fetching roles:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const closeMessageModal = () => {
    setMessageModal({ show: false, title: '', message: '' });
    if (messageModal.title === 'Success') {
      navigate('/login');
    }
  };

  const validatePassword = (password) => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    return pattern.test(password);
  };



  const validateMobile = (mobile) => {
    // Sri Lankan mobile number validation
    const mobilePattern = /^(\+94|0)(7[0-9]{8})$/;
    return mobilePattern.test(mobile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Frontend validation
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!validateNic(formData.nic)) {
      setError("Please enter a valid 9-digit (with V/X) or 12-digit NIC number.");
      return;
    }
    if (!validateMobile(formData.mobile)) {
      setError("Please enter a valid Sri Lankan mobile number (07XXXXXXXX or +947XXXXXXXX)");
      return;
    }
    if (!validatePassword(formData.password)) {
      setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a symbol.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.accountType === "Student" && formData.indexNumber.trim() === "") {
      setError("Student must provide an Index Number.");
      return;
    }
    if (
      formData.accountType !== "Dean" &&
      formData.accountType !== "VC" &&
      formData.department.trim() === ""
    ) {
      setError("Please select a department.");
      return;
    }


    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          nic: formData.nic,
          mobile: formData.mobile, // Send mobile to backend
          password: formData.password,
          role: formData.accountType,
          department:
            formData.accountType !== "Dean" && formData.accountType !== "VC"
              ? formData.department
              : "N/A",
          indexNumber: formData.accountType === "Student" ? formData.indexNumber : undefined,

        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessageModal({ show: true, title: 'Success', message: data.message || 'Registration request submitted successfully! Please wait for admin approval to log in.' });
        setFormData({
          fullName: "",
          email: "",
          nic: "",
          mobile: "",
          department: "",
          accountType: "Student",
          password: "",
          confirmPassword: "",
          indexNumber: ""
        });
      } else {
        setMessageModal({ show: true, title: 'Registration Failed', message: data.message || 'Something went wrong during registration.' });
      }
    } catch (apiError) {
      console.error("API Error during registration:", apiError);
      setMessageModal({ show: true, title: 'Error', message: 'Network error or server unavailable. Please try again later.' });
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-title">School of Alchemist</div>
        <div className="flex justify-center mb-4">
          <img
            src={universityLogo}
            alt="School of Alchemist Logo"
            className="registration-logo"
          />
        </div>
        <h2 className="registration-subtitle">Register</h2>

        <form onSubmit={handleSubmit}>
          <label className="block font-semibold" htmlFor="fullName">
            Full Name
          </label>
          <input
            className="registration-input"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="email">
            Email
          </label>
          <input
            className="registration-input"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="nic">
            NIC Number
          </label>
          <input
            className="registration-input"
            type="text"
            name="nic"
            placeholder="e.g., 901234567V or 200012345678"
            value={formData.nic}
            onChange={handleChange}
            required
          />

          {/* Add Mobile Number Field */}
          <label className="block font-semibold" htmlFor="mobile">
            Mobile Number
          </label>
          <input
            className="registration-input"
            type="tel"
            name="mobile"
            placeholder="e.g., 0712345678 or +94712345678"
            value={formData.mobile}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="accountType">
            Account Type (Role)
          </label>
          <select
            className="registration-select"
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            required
          >
            {rolesList.length > 0 ? (
              rolesList.map(role => (
                <option key={role._id} value={role.name}>{role.name}</option>
              ))
            ) : (
              <>
                <option value="Student">Student</option>
                <option value="Staff">Staff</option>
                <option value="Lecturer">Lecturer</option>
                <option value="HOD">HOD</option>
                <option value="Dean">Dean</option>
                <option value="VC">VC</option>
              </>
            )}
          </select>

          {formData.accountType === "Student" && (
            <>
              <label className="block font-semibold" htmlFor="indexNumber">
                Index Number
              </label>
              <input
                className="registration-input"
                name="indexNumber"
                type="text"
                placeholder="e.g., 2021/CSC/001"
                value={formData.indexNumber}
                onChange={handleChange}
                required={formData.accountType === "Student"}
              />
            </>
          )}

          {formData.accountType !== "Dean" && formData.accountType !== "VC" && (
            <>
              <label className="block font-semibold" htmlFor="department">
                Department
              </label>
              <select
                className="registration-select"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required={
                  formData.accountType !== "Dean" && formData.accountType !== "VC"
                }
              >
                <option value="">-- Select Department --</option>
                {departmentsList.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </>
          )}


          <label className="block font-semibold" htmlFor="password">
            Password
          </label>
          <input
            className="registration-input"
            type="password"
            name="password"
            placeholder="Min 8 chars, incl. A-Z, a-z, 0-9, symbol"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label className="block font-semibold" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            className="registration-input"
            type="password"
            name="confirmPassword"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && <p className="registration-error">{error}</p>}

          <button type="submit" className="registration-button">
            Sign Up
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
        <div className="footer-wrapper">
          <Footer />
        </div>
      </div>

      <MessageModal
        show={messageModal.show}
        title={messageModal.title}
        message={messageModal.message}
        onConfirm={closeMessageModal}
      />
    </div>
  );
}
