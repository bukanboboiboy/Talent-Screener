// file: src/app/forgot/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword, signOut } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import '../login/Login.css';

const ForgotPasswordPage = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});

    useEffect(() => {
        configureAmplify();
    }, []);

    const validateEmail = (val: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setFieldErrors({ email: 'Email is required' });
            return;
        }
        if (!validateEmail(email.trim())) {
            setFieldErrors({ email: 'Please enter a valid email address' });
            return;
        }

        setFieldErrors({});
        setLoading(true);

        try {
            // Clear any existing session first
            try {
                await signOut();
            } catch (signOutError) {
                console.log('No existing session to clear');
            }

            // Use AWS Amplify's resetPassword to trigger Cognito OTP
            const output = await resetPassword({ username: email });

            console.log('Reset password output:', output);

            // Check the next step
            if (output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE') {
                setSuccess(true);
                // Redirect to reset-password page after 2 seconds
                setTimeout(() => {
                    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
                }, 2000);
            }

        } catch (err: any) {
            console.error('Reset password error:', err);

            if (err.name === 'UserNotFoundException') {
                setError('No account found with this email address.');
            } else if (err.name === 'LimitExceededException') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.message || 'Failed to send reset code. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {!success ? (
                    <>
                        <div className="login-header">
                            <h2>Forgot Password?</h2>
                            <p>No worries, we'll send you a reset code.</p>
                        </div>

                        {error && <div className="alert-box alert-error">{error}</div>}

                        <form className="login-form" onSubmit={handleReset} noValidate>
                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Enter your registered email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (fieldErrors.email) setFieldErrors({});
                                    }}
                                    disabled={loading}
                                />
                                {fieldErrors.email && (
                                    <p className="text-rose-500 dark:text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5 inline-block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        {fieldErrors.email}
                                    </p>
                                )}
                            </div>

                            <button type="submit" className="btn-login" disabled={loading}>
                                {loading ? 'Sending Code...' : 'Send Reset Code'}
                            </button>
                        </form>

                        <div className="login-footer">
                            <p>Remember your password? <Link href="/login">Back to Login</Link></p>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="mb-4 text-green-600 flex justify-center">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Check your email</h2>
                        <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm">
                            We have sent a <b>verification code</b> to <br />
                            <span className="font-semibold text-slate-900 dark:text-zinc-200">{email}</span>
                        </p>

                        <p className="text-sm text-slate-500 dark:text-zinc-500 mb-4">
                            Redirecting to reset password page...
                        </p>

                        <div className="mt-4">
                            <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;