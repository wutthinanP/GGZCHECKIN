import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PRIMARY_DARK, PRIMARY, GLASS_FRAME, BG_PAGE, inputStyle } from '../styles/tokens';
import PageBackground from '../components/PageBackground';
import { Clock, Lock, Mail, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'verify' | 'reset'

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(null);

  // Forgot password flow state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลหรือรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (quickEmail) => {
    setEmail(quickEmail);
    setPassword('123456');
  };

  // Forgot password handlers
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail);
      setSuccessMsg(res.message);
      setMode('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyOtp(forgotEmail, otp);
      setResetToken(res.resetToken);
      setSuccessMsg('ยืนยันรหัส OTP สำเร็จ กรุณากำหนดรหัสผ่านใหม่');
      setMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.resetPassword(resetToken, newPassword);
      setSuccessMsg(res.message);
      setMode('login');
      setEmail(forgotEmail);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputBaseStyle = (field) => ({
    width: '100%',
    padding: '14px 16px',
    paddingLeft: '44px',
    borderRadius: '16px',
    fontSize: '0.92rem',
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.2s ease',
    ...inputStyle(focused === field),
  });

  const inputPlainStyle = (field) => ({
    width: '100%',
    padding: '14px 16px',
    borderRadius: '16px',
    fontSize: '0.92rem',
    fontWeight: 600,
    outline: 'none',
    transition: 'all 0.2s ease',
    ...inputStyle(focused === field),
  });

  return (
    <PageBackground>
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: '420px' }}
        >
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '18px',
                background: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,80,40,0.15)',
                marginBottom: '16px',
              }}
            >
              <Clock size={30} color={PRIMARY} />
            </motion.div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 900, 
              letterSpacing: '-0.5px', 
              marginBottom: '4px',
              color: PRIMARY_DARK,
              fontFamily: "'Montserrat', sans-serif",
            }}>
              CHECK-IN
            </h1>
            <p style={{ 
              color: PRIMARY_DARK, 
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              opacity: 0.4,
              textTransform: 'uppercase',
            }}>
              ระบบบันทึกเวลาทำงาน
            </p>
          </div>

          {/* Card */}
          <div style={{
            ...GLASS_FRAME,
            borderRadius: '28px',
            padding: '32px',
          }}>
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {successMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#059669',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Mode: Login */}
            {mode === 'login' && (
              <motion.form 
                onSubmit={handleLogin}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ 
                    fontSize: '0.72rem', 
                    fontWeight: 800, 
                    color: PRIMARY_DARK, 
                    opacity: 0.5,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginBottom: '6px',
                    display: 'block',
                  }}>
                    อีเมล
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      color={PRIMARY_DARK}
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}
                    />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused(null)}
                      style={inputBaseStyle('email')}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      color: PRIMARY_DARK, 
                      opacity: 0.5,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                    }}>
                      รหัสผ่าน
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: PRIMARY,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        opacity: 0.7,
                      }}
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={18}
                      color={PRIMARY_DARK}
                      style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}
                    />
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused(null)}
                      style={inputBaseStyle('password')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: 0.35,
                        color: PRIMARY_DARK,
                        padding: 0,
                      }}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '20px',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: PRIMARY_DARK,
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,80,40,0.15)',
                    transition: 'all 0.2s',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                >
                  {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </motion.button>

                {/* Quick Login Test Accounts */}
                <div style={{ 
                  marginTop: '24px', 
                  paddingTop: '18px', 
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                }}>
                  <div style={{ 
                    fontSize: '0.68rem', 
                    color: PRIMARY_DARK, 
                    opacity: 0.35,
                    marginBottom: '10px', 
                    textAlign: 'center',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}>
                    ⚡ คลิกเพื่อทดสอบ (รหัส: 123456)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {[
                      { label: '👑 Admin', email: 'admin@company.com' },
                      { label: '👔 Manager', email: 'manager@company.com' },
                      { label: '💼 Employee', email: 'employee1@company.com' },
                      { label: '⚡ Super Admin', email: 'superadmin@company.com' },
                    ].map((acc) => (
                      <motion.button
                        key={acc.email}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={() => fillQuickAccount(acc.email)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'rgba(255,255,255,0.3)',
                          color: PRIMARY_DARK,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {acc.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.form>
            )}

            {/* Mode: Forgot Password */}
            {mode === 'forgot' && (
              <motion.form 
                onSubmit={handleRequestOtp}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(0,102,51,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}>
                    <Mail size={24} color={PRIMARY_DARK} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 900, 
                    color: PRIMARY_DARK, 
                    marginBottom: '4px',
                    fontFamily: "'Montserrat', sans-serif",
                    letterSpacing: '-0.3px',
                  }}>
                    LOST PASSWORD?
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: PRIMARY_DARK, opacity: 0.5, fontWeight: 600 }}>
                    กรอกอีเมลเพื่อรับรหัส OTP ยืนยันตัวตน
                  </p>
                </div>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  onFocus={() => setFocused('forgotEmail')}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputPlainStyle('forgotEmail'),
                    textAlign: 'center',
                    marginBottom: '8px',
                  }}
                  required
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: PRIMARY_DARK,
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,80,40,0.15)',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                >
                  {loading ? 'กำลังส่ง...' : 'REQUEST OTP'}
                </motion.button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  style={{
                    display: 'block',
                    margin: '16px auto 0',
                    background: 'none',
                    border: 'none',
                    color: PRIMARY_DARK,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    opacity: 0.4,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                  }}
                >
                  Cancel
                </button>
              </motion.form>
            )}

            {/* Mode: Verify OTP */}
            {mode === 'verify' && (
              <motion.form 
                onSubmit={handleVerifyOtp}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(0,102,51,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}>
                    <ShieldCheck size={24} color={PRIMARY_DARK} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 900, 
                    color: PRIMARY_DARK, 
                    marginBottom: '4px',
                    fontFamily: "'Montserrat', sans-serif",
                  }}>
                    VERIFY OTP
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: PRIMARY_DARK, opacity: 0.5, fontWeight: 600 }}>
                    กรอกรหัส 6 หลักที่ส่งไปยัง <b style={{ color: PRIMARY }}>{forgotEmail}</b>
                  </p>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  onFocus={() => setFocused('otp')}
                  onBlur={() => setFocused(null)}
                  style={{
                    ...inputPlainStyle('otp'),
                    textAlign: 'center',
                    fontSize: '1.3rem',
                    letterSpacing: '0.3em',
                  }}
                  required
                />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: PRIMARY_DARK,
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,80,40,0.15)',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                >
                  {loading ? 'กำลังยืนยัน...' : 'CONFIRM OTP'}
                </motion.button>
              </motion.form>
            )}

            {/* Mode: Reset Password */}
            {mode === 'reset' && (
              <motion.form 
                onSubmit={handleResetPassword}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'rgba(0,102,51,0.08)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                  }}>
                    <KeyRound size={24} color={PRIMARY_DARK} />
                  </div>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 900, 
                    color: PRIMARY_DARK, 
                    fontFamily: "'Montserrat', sans-serif",
                  }}>
                    RESET PASSWORD
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="password"
                    placeholder="รหัสผ่านใหม่"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setFocused('newPw')}
                    onBlur={() => setFocused(null)}
                    style={inputPlainStyle('newPw')}
                    required
                  />
                  <input
                    type="password"
                    placeholder="ยืนยันรหัสผ่าน"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocused('confirmPw')}
                    onBlur={() => setFocused(null)}
                    style={inputPlainStyle('confirmPw')}
                    required
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: PRIMARY_DARK,
                    color: 'white',
                    fontWeight: 900,
                    fontSize: '0.82rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(0,80,40,0.15)',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                >
                  {loading ? 'กำลังบันทึก...' : 'CONFIRM RESET'}
                </motion.button>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
    </PageBackground>
  );
}
