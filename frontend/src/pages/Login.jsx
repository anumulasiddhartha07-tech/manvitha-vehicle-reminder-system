import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, User, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); // 'login' | 'login-otp' | 'register' | 'forgot-email'
  
  // Login fields
  const [email, setEmail] = useState('admin@manivtha.com');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register fields
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // OTP Verification fields
  const [otpCode, setOtpCode] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  // Password reset fields
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  // UI state
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Reset status alerts on view toggles
  useEffect(() => {
    setError('');
    setSuccess('');
    setOtpCode('');
  }, [view]);

  // Load remember me email if stored
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
    }
  }, []);

  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Email address is required.');
      return;
    }
    if (!password) {
      setError('Password is required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      // Check remember me checkbox
      const rememberCheckbox = document.getElementById('remember-me-checkbox');
      if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('settings', JSON.stringify(data.settings));

      onLoginSuccess(data.user, data.settings);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (registerPassword !== registerConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: registerName,
          email: registerEmail,
          password: registerPassword,
          confirmPassword: registerConfirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      if (data.requiresVerification) {
        setDemoOtp(data.otp || '');
        setSuccess('A verification OTP code has been sent to your email.');
        setTargetEmail(registerEmail);
        setView('register-verify');
      } else {
        setSuccess('Account created successfully! Please log in.');
        setView('login');
        setEmail(registerEmail);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode) {
      setError('OTP verification code is required.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          otp: otpCode
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      setSuccess('Your email has been verified successfully! You can now log in.');
      setTimeout(() => {
        setView('login');
        setEmail(targetEmail);
        setPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendRegisterOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend verification code.');
      }

      setDemoOtp(data.otp || '');
      setSuccess('A new verification code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    if (!targetEmail) {
      setError('Email address is required.');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset request failed.');
      }

      setSuccess('Please enter your new password.');
      setView('forgot-reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://manvitha-vehicle-reminder-system-1.onrender.com/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: resetPassword,
          confirmPassword: resetConfirmPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setSuccess('Password updated successfully. You can now log in.');
      setTimeout(() => {
        setView('login');
        setEmail(targetEmail);
        setPassword('');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-[#F1F5F9] via-[#EEF2F6] to-[#E0E7FF] font-sans relative overflow-hidden select-none">
      
      {/* Background Decorative Blur Accents */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-sky-200/45 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] -left-20 w-[400px] h-[400px] bg-indigo-100/35 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Background Dot Grids */}
      {/* Top Right Grid */}
      <div className="absolute top-10 right-10 opacity-[0.18] select-none pointer-events-none grid grid-cols-6 gap-2.5">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
        ))}
      </div>
      {/* Bottom Left Grid */}
      <div className="absolute bottom-10 left-10 opacity-[0.18] select-none pointer-events-none grid grid-cols-6 gap-2.5">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
        ))}
      </div>

      {/* Centered Login Card Container */}
      <div className="relative z-10 w-full max-w-[500px] mx-4 flex flex-col items-stretch">
        
        {/* Dynamic Card */}
        <div className="w-full bg-white border border-slate-100/80 rounded-[24px] shadow-[0_10px_40px_rgba(30,41,59,0.04)] p-8 md:p-10 space-y-6">
          
          {/* Brand Name Text Header */}
          <div className="flex flex-col items-center justify-center text-center select-none pt-2">
            <div className="text-[28px] font-extrabold font-sans text-[#0EA5A8] tracking-wide leading-none">
              Manivtha
            </div>
            <div className="text-[14px] font-bold font-sans text-slate-500 mt-1.5 uppercase tracking-wider">
              Tours & Travels
            </div>
            <div className="w-10 h-[2px] bg-[#0EA5A8] mt-3.5 rounded-full"></div>
          </div>

          {/* Status Banners */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-650 rounded-xl p-3.5 flex items-start space-x-2.5 text-[12px] font-sans">
              <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3.5 flex items-start space-x-2.5 text-[12px] font-sans">
              <CheckCircle2 className="w-4.5 h-4.5 mt-0.5 shrink-0 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}


          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <>
              <div className="space-y-2 text-center">
                <h3 className="text-[28px] font-bold text-slate-900 tracking-tight font-sans">
                  Welcome <span className="text-[#0284C7]">Back!</span>
                </h3>
                <p className="text-slate-400 text-[14px] font-medium font-sans">Please login to your account</p>
                <div className="flex justify-center pt-2">
                  <div className="w-12 h-1 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] rounded-full"></div>
                </div>
              </div>

              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Password</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setTargetEmail(email);
                        setView('forgot-email');
                      }} 
                      className="text-[12px] font-bold text-[#0284C7] hover:underline font-sans"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="p-2 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[13px] pt-1 font-semibold font-sans">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-slate-500">
                    <input 
                      type="checkbox" 
                      id="remember-me-checkbox"
                      defaultChecked
                      className="rounded text-[#0EA5A8] focus:ring-[#0EA5A8] border-slate-200 w-4 h-4 cursor-pointer" 
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0EA5A8]/90 hover:to-[#0284C7]/90 text-white font-bold text-[15px] rounded-[14px] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2 font-sans"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    <span>{loading ? 'Logging In...' : 'Login'}</span>
                  </button>
                </div>

                <div className="text-center text-[13px] font-semibold text-slate-500 pt-2 font-sans">
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setView('register')} 
                    className="text-[#0EA5A8] hover:underline font-bold"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <>
              <div className="space-y-2 text-center">
                <h3 className="text-[28px] font-bold text-slate-900 tracking-tight font-sans">
                  Create <span className="text-[#0284C7]">Account</span>
                </h3>
                <p className="text-slate-400 text-[14px] font-medium font-sans">Sign up to manage vehicle document renewals</p>
                <div className="flex justify-center pt-2">
                  <div className="w-12 h-1 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] rounded-full"></div>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Full Name</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="Enter your full name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Create a password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="p-2 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showRegPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm your password"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="p-2 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0EA5A8]/90 hover:to-[#0284C7]/90 text-white font-bold text-[15px] rounded-[14px] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center font-sans"
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>

                <div className="text-center text-[13px] font-semibold text-slate-500 pt-2 font-sans">
                  Already have an account?{' '}
                  <button 
                    type="button" 
                    onClick={() => setView('login')} 
                    className="text-[#0EA5A8] hover:underline font-bold"
                  >
                    Login
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: REGISTER VERIFY */}
          {view === 'register-verify' && (
            <>
              <div className="space-y-2 text-center">
                <h3 className="text-[28px] font-bold text-slate-900 tracking-tight font-sans">
                  Verify <span className="text-[#0284C7]">Email</span>
                </h3>
                <p className="text-slate-400 text-[14px] font-medium font-sans">Enter the 6-digit verification code sent to your email</p>
                <div className="flex justify-center pt-2">
                  <div className="w-12 h-1 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] rounded-full"></div>
                </div>
              </div>

              <form onSubmit={handleRegisterVerify} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Verification OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.15em] text-[18px] font-bold h-14 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl placeholder-slate-400 placeholder:tracking-normal placeholder:text-[14px] font-sans transition-all bg-slate-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0EA5A8]/90 hover:to-[#0284C7]/90 text-white font-bold text-[15px] rounded-[14px] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center font-sans"
                >
                  {loading ? 'Verifying Account...' : 'Verify & Activate'}
                </button>

                <div className="flex flex-col items-center space-y-3 pt-2 text-[13px] font-semibold text-slate-500 font-sans">
                  <div>
                    Didn't receive code?{' '}
                    <button 
                      type="button" 
                      onClick={handleResendRegisterOtp} 
                      className="text-[#0EA5A8] hover:underline font-bold"
                    >
                      Resend OTP
                    </button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setView('register')} 
                    className="text-slate-550 hover:underline font-bold"
                  >
                    Back to Registration
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: FORGOT EMAIL */}
          {view === 'forgot-email' && (
            <>
              <div className="space-y-2 text-center">
                <h3 className="text-[28px] font-bold text-slate-900 tracking-tight font-sans">
                  Reset <span className="text-[#0284C7]">Password</span>
                </h3>
                <p className="text-slate-400 text-[14px] font-medium font-sans">Enter your email address to reset your password</p>
                <div className="flex justify-center pt-2">
                  <div className="w-12 h-1 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] rounded-full"></div>
                </div>
              </div>

              <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="Enter your email address"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0EA5A8]/90 hover:to-[#0284C7]/90 text-white font-bold text-[15px] rounded-[14px] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center font-sans"
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </button>

                <div className="text-center text-[13px] font-semibold text-slate-500 pt-2 font-sans">
                  Remember password?{' '}
                  <button 
                    type="button" 
                    onClick={() => setView('login')} 
                    className="text-[#0EA5A8] hover:underline font-bold"
                  >
                    Login
                  </button>
                </div>
              </form>
            </>
          )}

          {/* VIEW: FORGOT RESET */}
          {view === 'forgot-reset' && (
            <>
              <div className="space-y-2 text-center">
                <h3 className="text-[28px] font-bold text-slate-900 tracking-tight font-sans">
                  New <span className="text-[#0284C7]">Password</span>
                </h3>
                <p className="text-slate-400 text-[14px] font-medium font-sans">Choose a new password for your account</p>
                <div className="flex justify-center pt-2">
                  <div className="w-12 h-1 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] rounded-full"></div>
                </div>
              </div>

              <form onSubmit={handleForgotResetSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">New Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password (min. 8 chars)"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-800 font-sans bg-slate-50/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="p-2 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showResetPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11.5px] font-bold text-slate-500 font-sans tracking-wide uppercase">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-450 absolute left-4.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="w-full h-14 pl-12 pr-12 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0EA5A8] focus:border-[#0EA5A8] rounded-xl text-[14px] placeholder-slate-400 text-slate-808 font-sans bg-slate-50/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      className="p-2 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showResetConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-[#0EA5A8] to-[#0284C7] hover:from-[#0EA5A8]/90 hover:to-[#0284C7]/90 text-white font-bold text-[15px] rounded-[14px] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center font-sans"
                >
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>

                <div className="text-center text-[13px] font-semibold text-slate-500 pt-2 font-sans">
                  <button 
                    type="button" 
                    onClick={() => setView('login')} 
                    className="text-slate-550 hover:underline font-bold"
                  >
                    Cancel & Back to Login
                  </button>
                </div>
              </form>
            </>
          )}

        </div>

        {/* Bottom Centered Copyright */}
        <div className="text-[11.5px] font-semibold text-slate-400 text-center select-none pt-6 pb-2 font-sans">
          © 2026 <span className="text-[#0EA5A8] font-bold">Manivtha Tours & Travels</span>. All rights reserved.
        </div>
      </div>

    </div>
  );
};

export default Login;;
