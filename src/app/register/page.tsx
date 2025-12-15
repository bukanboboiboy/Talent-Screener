"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../login/Login.css';

const RegisterPage = () => {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // STATE MATA (Ada 2)
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError("Password tidak sama! Coba cek lagi.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter ya.");
      return;
    }

    setLoading(true);
    console.log("Mendaftar dengan:", name, email, password);

    setTimeout(() => {
      setLoading(false);
      setSuccess("Akun berhasil dibuat! Mengalihkan ke Login...");
      setTimeout(() => {
        router.push('/login');
      }, 2000); 
    }, 1500);
  };

  // Helper Component biar kodingan gak kepanjangan (Reusable Icon)
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
        <div className="login-header">
          <h2>Create Account</h2>
          <p>Join us to start screening talents.</p>
        </div>

        {error && <div className="alert-box alert-error">{error}</div>}
        {success && <div className="alert-box alert-success">{success}</div>}

        <form className="login-form" onSubmit={handleRegister}>
          <div className="input-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
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
              id="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          {/* PASSWORD UTAMA */}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input 
                type={showPass ? "text" : "password"}
                id="password" 
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

          {/* CONFIRM PASSWORD */}
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-wrapper">
              <input 
                type={showConfirm ? "text" : "password"}
                id="confirmPassword" 
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

          <button type="submit" className="btn-login" disabled={loading || !!success}>
            {loading ? 'Creating Account...' : (success ? 'Success!' : 'Sign Up')}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <a href="/login">Sign In</a></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;