import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const EmailVerificationPage = () => {
  const [message, setMessage] = useState('Verifying your email...');
  const { token } = useParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/registrations/verify/${token}`);
        const data = await response.text();
        if (response.ok) {
          setMessage('Email verified successfully! You can now log in after admin approval.');
        } else {
          setMessage(data);
        }
      } catch (error) {
        setMessage('An error occurred while verifying your email.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </div>
  );
};

export default EmailVerificationPage;
