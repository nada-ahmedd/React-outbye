import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/VerifyCode.css';

const VerifySignUp = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0); // Start at 0 since no resend has happened yet
  const [canResend, setCanResend] = useState(true); // Allow resend initially
  const [lastResendTime, setLastResendTime] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const email = localStorage.getItem('signupEmail');
  const RESEND_COOLDOWN = 30;

  const fetchWithToken = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    console.log('Token used for request:', token);
    console.log('Request URL:', url);
    console.log('Request Options:', options);

    if (!token) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No token found. Please sign up again.' });
      setTimeout(() => navigate('/signup'), 2000);
      return null;
    }

    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    try {
      const response = await fetch(url, options);
      console.log('Response Status:', response.status);
      console.log('Response Status Text:', response.statusText);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Unauthorized: Invalid or expired token. Please sign up again.');
        }
        throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Parsed Response Data:', data);
      return data;
    } catch (error) {
      console.error('FetchWithToken Error:', error);
      if (error.message.includes('Unauthorized')) {
        Swal.fire({ icon: 'error', title: 'Authentication Error', text: error.message });
        setTimeout(() => navigate('/signup'), 2000);
      } else if (error.message.includes('Failed to fetch')) {
        Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Network error: Unable to connect to the server.' });
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: `An error occurred: ${error.message}` });
      }
      return null;
    }
  }, [navigate]);

  const checkEmail = useCallback(() => {
    console.log('Checking email:', email);
    if (!email) {
      if (!isVerified) {
        Swal.fire({ icon: 'error', title: 'No Email Found', text: 'Please sign up again.' });
        setTimeout(() => navigate('/signup'), 2000);
      }
      return false;
    }
    return true;
  }, [email, navigate, isVerified]);

  const resendCode = useCallback(async () => {
    if (!checkEmail()) return;

    const currentTime = Date.now();
    if (currentTime - lastResendTime < RESEND_COOLDOWN * 1000) {
      Swal.fire({ icon: 'warning', title: 'Wait', text: `Please wait ${Math.ceil((RESEND_COOLDOWN * 1000 - (currentTime - lastResendTime)) / 1000)} seconds before resending.` });
      return;
    }

    const data = await fetchWithToken('https://abdulrahmanantar.com/outbye/auth/resend.php', {
      method: 'POST',
      body: new URLSearchParams({ email }),
    });

    if (data === null) return;

    if (data.status === 'success') {
      Swal.fire({ icon: 'success', title: 'Code Resent!', text: 'A new verification code has been sent.' });
      setLastResendTime(Date.now());
      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);
      // Start the timer immediately after a successful resend
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Swal.fire({ icon: 'error', title: 'Resend Failed', text: data.message || 'Failed to resend the code.' });
    }
  }, [checkEmail, fetchWithToken, email, lastResendTime]);

  const verifyCode = useCallback(async () => {
    const enteredCode = code.join('');
    if (enteredCode.length !== 5) {
      Swal.fire({ icon: 'error', title: 'Incomplete Code', text: 'Please enter all five digits.' });
      return;
    }

    if (!checkEmail()) return;

    console.log('Sending verification code:', enteredCode);
    console.log('Email used for verification:', email);

    const data = await fetchWithToken('https://abdulrahmanantar.com/outbye/auth/verfiycode.php', {
      method: 'POST',
      body: new URLSearchParams({ email, verifycode: enteredCode }),
    });

    if (data === null) return;

    if (data.status === 'success') {
      setIsVerified(true);
      localStorage.removeItem('signupEmail');
      Swal.fire({
        icon: 'success',
        title: 'Account Verified!',
        text: 'Redirecting to sign in...',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        navigate('/signin');
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: data.message || 'Invalid verification code.',
      });
    }
  }, [code, checkEmail, fetchWithToken, email, navigate]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 4) document.getElementById(`verifyCodeField${index + 2}`).focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`verifyCodeField${index}`).focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('text');
    if (pastedData.length === 5) {
      const newCode = pastedData.split('');
      setCode(newCode);
      document.getElementById('verifyCodeField5').focus();
      e.preventDefault();
    }
  };

  return (
    <div className="verify-code-container">
      <h1>Verify Your Account</h1>
      <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }}>
        <div className="verify-code-group">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`verifyCodeField${index + 1}`}
              type="text"
              maxLength="1"
              className="verify-code-field"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              required
            />
          ))}
        </div>
        <button type="submit">Verify</button>
      </form>
      <p>
        Didn't receive a code?{' '}
        <a
          href="#"
          id="resendCodeLink"
          className={canResend ? 'enabled' : ''}
          onClick={(e) => {
            e.preventDefault();
            if (!canResend) {
              Swal.fire({ icon: 'warning', title: 'Wait', text: `Try again after ${resendTimer} seconds.` });
              return;
            }
            resendCode();
          }}
        >
          Resend Code
        </a>
      </p>
      {resendTimer > 0 && <div className="timer">Resend available in {resendTimer} seconds</div>}
    </div>
  );
};

export default VerifySignUp;