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
  const [showPassword, setShowPassword] = useState(false);
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
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-with-icon"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="btn-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
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