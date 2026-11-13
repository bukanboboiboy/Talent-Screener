"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, confirmSignUp, signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import '../login/Login.css';

const RegisterPage = () => {
  const router = useRouter();

  useEffect(() => {
    configureAmplify();
  }, []);

  // STATE DATA FORM
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // FIELD VALIDATION ERRORS
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    otpCode?: string;
  }>({});

  // STATE UNTUK OTP
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'REGISTER' | 'VERIFY'>('REGISTER');

  // UI STATES
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  // 1. FUNGSI REGISTER (Langkah Pertama)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors: typeof fieldErrors = {};

    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }

    const emailErr = validateEmail(email);
    if (emailErr) {
      errors.email = emailErr;
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Clear any existing session first to prevent "already signed in" error
      try {
        await signOut();
      } catch (signOutError) {
        // Ignore error if no user is signed in
        console.log('No existing session to clear');
      }

      const { nextStep } = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: name,
          },
        },
      });

      setLoading(false);

      // Jika butuh konfirmasi (OTP), pindah ke Step VERIFY
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setSuccess(`Kode OTP dikirim ke ${email}`);
        setStep('VERIFY');
      } else {
        router.push('/login');
      }

    } catch (err: any) {
      console.error("Error sign up:", err);
      setLoading(false);
      setError(err.message || "Gagal mendaftar.");
    }
  };

  // 2. FUNGSI VERIFIKASI OTP (Langkah Kedua)
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode.trim()) {
      setFieldErrors({ otpCode: 'Verification code is required.' });
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Kirim kode OTP ke AWS
      await confirmSignUp({
        username: email,
        confirmationCode: otpCode
      });

      setLoading(false);
      setSuccess("Verifikasi Berhasil! Mengalihkan ke Login...");

      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setLoading(false);
      setError("Kode OTP salah atau kadaluarsa.");
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* HEADER BERUBAH SESUAI STEP */}
        <div className="login-header">
          {step === 'REGISTER' ? (
            <>
              <h2>Create Account</h2>
              <p>Join us to start screening talents.</p>
            </>
          ) : (
            <>
              <h2>Verification</h2>
              <p>Enter the code sent to {email}</p>
            </>
          )}
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        {/* --- TAMPILAN 1: FORM REGISTER --- */}
        {step === 'REGISTER' && (
          <form className="login-form" onSubmit={handleRegister} noValidate>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                placeholder="Ex: Muhammad Isra"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: undefined }));
                }}
              />
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: undefined }));
                }}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  id="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className="input-with-icon"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="btn-eye"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                  {fieldErrors.password}
                </p>
              )}

              {/* Password Requirements Checklist */}
              <div className="bg-slate-50 dark:bg-zinc-900/90 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs space-y-2 my-4">
                <p className="font-semibold text-slate-700 dark:text-zinc-200">Password requirements:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <PasswordCheckItem valid={password.length >= 8} label="Min. 8 characters" />
                  <PasswordCheckItem valid={/[A-Z]/.test(password)} label="1 Uppercase (A-Z)" />
                  <PasswordCheckItem valid={/[a-z]/.test(password)} label="1 Lowercase (a-z)" />
                  <PasswordCheckItem valid={/[0-9]/.test(password)} label="1 Number (0-9)" />
                  <PasswordCheckItem valid={/[!@#$%^&*(),.?":{}|<>]/.test(password)} label="1 Special char (!@#$)" />
                </div>
              </div>

              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                  }}
                  className="input-with-icon"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="btn-eye"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* --- TAMPILAN 2: FORM OTP --- */}
        {step === 'VERIFY' && (
          <form className="login-form" onSubmit={handleVerify} noValidate>
            <div className="input-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                placeholder="Ex: 123456"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  if (fieldErrors.otpCode) setFieldErrors(prev => ({ ...prev, otpCode: undefined }));
                }}
                className="text-center text-xl tracking-widest font-bold"
                maxLength={6}
              />
              {fieldErrors.otpCode && (
                <p className="mt-1.5 text-xs font-medium text-rose-500 dark:text-rose-400 text-center">
                  {fieldErrors.otpCode}
                </p>
              )}
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Verifying...' : 'Confirm Account'}
            </button>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setStep('REGISTER')}
                className="text-sm text-gray-500 hover:text-gray-800 underline"
              >
                Salah Email? Kembali
              </button>
            </div>
          </form>
        )}

        {/* FOOTER Cuma Muncul pas Register */}
        {step === 'REGISTER' && (
          <div className="login-footer">
            <p>Already have an account? <a href="/login">Sign In</a></p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Component for Password Requirement
const PasswordCheckItem = ({ valid, label }: { valid: boolean; label: string }) => (
  <div className={`flex items-center gap-2 ${valid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-zinc-500'}`}>
    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ${valid ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-500' : 'border-slate-300 dark:border-zinc-700'}`}>
      {valid ? '✓' : ''}
    </span>
    <span>{label}</span>
  </div>
);

export default RegisterPage;
