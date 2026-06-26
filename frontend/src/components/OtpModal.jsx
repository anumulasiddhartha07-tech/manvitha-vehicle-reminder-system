import React, { useState, useEffect, useRef } from 'react';
import { Mail, X, AlertCircle } from 'lucide-react';

const OtpModal = ({ isOpen, email, onVerifySuccess, onClose }) => {
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const inputRefs = useRef([]);

  const handleSendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        // Console log for local debugging by developers, hidden from production UI
        console.log(`[DEV ONLY] OTP code sent: ${data.otp}`);
      } else {
        setError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setError('Connection error. Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger automatically when modal opens
  useEffect(() => {
    if (isOpen && email) {
      handleSendOtp();
      setOtpValues(['', '', '', '', '', '']);
    } else {
      setOtpValues(['', '', '', '', '', '']);
      setSent(false);
      setError('');
    }
  }, [isOpen, email]);

  const handleInputChange = (index, value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newOtpValues = [...otpValues];
      newOtpValues[index] = '';
      setOtpValues(newOtpValues);
      return;
    }

    const char = cleanValue[cleanValue.length - 1];
    const newOtpValues = [...otpValues];
    newOtpValues[index] = char;
    setOtpValues(newOtpValues);

    // Auto-focus next input field
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = '';
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = '';
        setOtpValues(newOtpValues);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newOtpValues = [...otpValues];
      for (let i = 0; i < 6; i++) {
        newOtpValues[i] = pastedData[i] || '';
      }
      setOtpValues(newOtpValues);
      
      // Focus on the last filled element or the next empty one
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        onVerifySuccess();
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Failed to verify OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white border border-slate-100 rounded-2xl max-w-[400px] w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-1 text-slate-455 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer bg-transparent border-0 outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3.5 pt-2">
          <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-full flex items-center justify-center text-teal-brand shadow-inner">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-[16px] font-extrabold text-slate-800 tracking-tight font-outfit">Confirm Authorization</h4>
            <p className="text-[12px] text-slate-500 leading-relaxed mt-1">
              To save these changes, enter the 6-digit verification code sent to <span className="font-bold text-slate-700">{email}</span>.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-650 rounded-xl p-3 flex items-start space-x-2 text-[11px] leading-snug">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          {/* Segmented OTP input fields */}
          <div className="flex justify-between items-center gap-2 max-w-[320px] mx-auto">
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={val}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                disabled={loading || !sent}
                className="w-11 h-12 text-center text-[18px] font-extrabold border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all text-slate-800 bg-slate-50 focus:bg-white"
              />
            ))}
          </div>

          <div className="flex space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-655 text-[13px] font-bold rounded-xl transition-colors cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !sent}
              className="flex-1 py-2.5 bg-teal-brand hover:bg-teal-brandHover disabled:bg-teal-brand/50 text-white text-[13px] font-bold rounded-xl transition-all shadow-md shadow-teal-700/10 cursor-pointer border-0"
            >
              {loading ? 'Verifying...' : 'Verify & Confirm'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={loading}
            className="text-[11px] font-semibold text-teal-brand hover:underline cursor-pointer bg-transparent border-0"
          >
            Resend Verification Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpModal;
