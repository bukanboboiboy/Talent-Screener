// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import './Login.css';

export default function LoginPage() {
  const router = useRouter();

  // 1. Jalankan konfigurasi saat halaman dimuat
  useEffect(() => {
    configureAmplify();
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // State buat nampung error kalau password salah
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Coba Login
      console.log("Sedang mencoba login ke AWS...");
      const output = await signIn({
        username: email,
        password: password
      });

      // 3. CETAK HASIL LENGKAPNYA DI CONSOLE
      console.log(">>> HASIL DARI AWS:", output);

      const { isSignedIn, nextStep } = output;

      if (isSignedIn) {
        console.log("Status: SIGNED IN!");
        setSuccess(true);

        // Redirect after showing success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        // KEMUNGKINAN BESAR DIA MASUK SINI
        console.log("Status: BELUM SIGNED IN.", nextStep.signInStep);

        if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
          setErrorMessage("Perlu ganti password baru (New Password Required).");
        } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
          setErrorMessage("Akun belum diverifikasi kode OTP.");
        } else {
          setErrorMessage(`Login belum tuntas. Status: ${nextStep.signInStep}`);
        }
      }

    } catch (error: any) {
      console.error('Error login:', error);
      // Error handling standard kamu yg tadi...
      if (error.name === "NotAuthorizedException") {
        setErrorMessage("Email atau Password salah!");
      } else if (error.name === "UserNotConfirmedException") {
        setErrorMessage("Akun belum verifikasi OTP. Cek email!");
      } else {
        setErrorMessage(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* Success Message - Shows when login succeeds */}
        {success ? (
          <div className="text-center">
            <div className="mb-4 text-green-600 flex justify-center animate-bounce">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Login Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              Taking you to dashboard...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your account.</p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="alert-box alert-error">
                {errorMessage}
              </div>
            )}

            {/* Login Form */}
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Forgot Password Link */}
              <div className="text-right mb-4">
                <Link href="/forgot" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-login"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Footer - Register Link */}
            <div className="login-footer">
              <p>Don't have an account? <Link href="/register">Sign Up</Link></p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}