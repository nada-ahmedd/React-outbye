import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles/VerifyCode.css';

const VerifyForgetPassword = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [lastResendTime, setLastResendTime] = useState(Date.now());
  const [errorMessage, setErrorMessage] = useState('');

  const email = localStorage.getItem('resetEmail');
  const RESEND_COOLDOWN = 30;

  const fetchWithoutToken = async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const text = await response.text();
      const jsonMatch = text.match(/{.*}/s);
      let data = { status: 'error', message: 'Invalid response' };
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[0]);
      }
      return data;
    } catch (error) {
      console.error('FetchWithoutToken Error:', error);
      setErrorMessage(error.message.includes('Failed to fetch') ? 'Network error: Unable to connect to the server.' : `Error: ${error.message}`);
      return null;
    }
  };

  const checkEmail = () => {
    if (!email) {
      setErrorMessage('Email not found in storage. Please start the password reset process again.');
      setTimeout(() => navigate('/signin'), 2000);
      return false;
    }
    return true;
  };

  const resendCode = async () => {
    if (!checkEmail()) return;

    const data = await fetchWithoutToken('https://abdulrahmanantar.com/outbye/auth/resend.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email }),
    });

    if (data && data.status === 'success') {
      Swal.fire({ icon: 'success', title: 'Code Resent!', text: 'A new verification code has been sent.' });
      setCode(['', '', '', '', '']);
      document.getElementById('verifyCodeField1').focus();
      setLastResendTime(Date.now());
      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);
      startResendTimer();
      setErrorMessage('');
    } else {
      setErrorMessage(data?.message || 'Failed to resend the code.');
    }
  };

  const verifyCode = async () => {
    const enteredCode = code.join('');
    if (enteredCode.length !== 5) {
      setErrorMessage('Please enter all five digits.');
      return;
    }

    if (!checkEmail()) return;

    const data = await fetchWithoutToken('https://abdulrahmanantar.com/outbye/forgetpassword/verifycode.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, verifycode: enteredCode }),
    });

    if (data && data.status === 'success') {
      Swal.fire({ icon: 'success', title: 'Code Verified!', text: 'Redirecting to reset password...' });
      setTimeout(() => navigate('/signin?reset=true'), 2000);
    } else {
      setErrorMessage(data?.message || 'Invalid verification code.');
    }
  };

  const startResendTimer = () => {
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
  };

  const updateTimer = () => {
    const interval = setInterval(() => {
      const timeLeft = Math.ceil((lastResendTime + RESEND_COOLDOWN * 1000 - Date.now()) / 1000);
      if (timeLeft <= 0) {
        clearInterval(interval);
      }
      setResendTimer(timeLeft);
    }, 1000);
  };

  useEffect(() => {
    if (!checkEmail()) return;
    startResendTimer();
    updateTimer();
  }, []);

  const handleInputChange = (index, value) => {
    if (value.length > 1 || !/^[0-9]*$/.test(value)) return;
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
    if (pastedData.length === 5 && /^[0-9]{5}$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      document.getElementById('verifyCodeField5').focus();
      e.preventDefault();
    }
  };

  return (
    <div className="verify-code-container">
      <h1>Verify Code</h1>
      <form onSubmit={(e) => { e.preventDefault(); verifyCode(); }}>
        <div className="verify-code-group">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`verifyCodeField${index + 1}`}
              type="number"
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
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      <button className="back-btn" onClick={() => navigate('/signin')}>
        Back to Sign In
      </button>
    </div>
  );
};

export default VerifyForgetPassword;