"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Tambahkan 'confirmSignUp' untuk verifikasi OTP dan 'signOut' untuk clear session
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

  // STATE UNTUK OTP
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'REGISTER' | 'VERIFY'>('REGISTER'); // Default: Form Register

  // UI STATES
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. FUNGSI REGISTER (Langkah Pertama)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Password tidak sama!");
      return;
    }

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
        setStep('VERIFY'); // <--- INI KUNCINYA (Ganti Tampilan)
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
    setLoading(true);
    setError('');

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

  // Helper Icon
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    visible ? (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ) : (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )
  );

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
          <form className="login-form" onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                placeholder="Ex: Muhammad Isra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPass ? "text" : "password"}
                  className="input-with-icon"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="btn-eye" onClick={() => setShowPass(!showPass)}>
                  <EyeIcon visible={showPass} />
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="input-with-icon"
                  placeholder="Retype your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" className="btn-eye" onClick={() => setShowConfirm(!showConfirm)}>
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Sending OTP...' : 'Sign Up'}
            </button>
          </form>
        )}

        {/* --- TAMPILAN 2: FORM OTP --- */}
        {step === 'VERIFY' && (
          <form className="login-form" onSubmit={handleVerify}>
            <div className="input-group">
              <label htmlFor="otp">Verification Code</label>
              <input
                type="text"
                id="otp"
                placeholder="Ex: 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="text-center text-xl tracking-widest font-bold"
                maxLength={6}
                required
              />
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

export default RegisterPage;