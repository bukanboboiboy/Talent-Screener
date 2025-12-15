"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // <--- 1. Import buat pindah halaman
import './Login.css';

const LoginPage = () => {
  const router = useRouter(); // <--- 2. Inisialisasi Router
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // --- SIMULASI LOGIN (Nanti diganti API AWS/Backend) ---
    console.log("Login dengan:", email, password);

    // Ceritanya loading 1.5 detik biar kerasa 'mikir'
    setTimeout(() => {
      // 1. Simpan Token 'Palsu' biar AuthWrapper seneng
      localStorage.setItem('token', 'dummy-token-rahasia-123');
      
      // 2. Stop Loading
      setLoading(false);

      // 3. Pindah ke Dashboard (atau Home)
      router.push('/dashboard'); 
    }, 1500);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please enter your details to sign in.</p>
        </div>

        {/* Tambahkan onSubmit di sini */}
        <form className="login-form" onSubmit={handleLogin}>
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

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <a href="/forgot" className="forgot-link">Forgot Password?</a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <a href="/register">Sign up</a></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;