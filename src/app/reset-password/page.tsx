// src/app/reset-password/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { confirmResetPassword } from 'aws-amplify/auth';
import { configureAmplify } from '@/utils/amplify-config';
import Link from 'next/link';
import '../login/Login.css';

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const email = searchParams.get('email') || '';

    const [verificationCode, setVerificationCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{ code?: string; password?: string; confirmPassword?: string }>({});

    useEffect(() => {
        configureAmplify();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const errors: { code?: string; password?: string; confirmPassword?: string } = {};

        if (!verificationCode.trim()) {
            errors.code = "Verification code is required";
        }

        if (!password) {
            errors.password = "New password is required";
        } else if (password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        }

        if (!confirmPassword) {
            errors.confirmPassword = "Confirm password is required";
        } else if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            return;
        }

        if (!email) {
            setError("Email is missing. Please start from forgot password page.");
            return;
        }

        setLoading(true);

        try {
            // Call AWS Amplify to actually reset the password
            await confirmResetPassword({
                username: email,
                confirmationCode: verificationCode,
                newPassword: password
            });

            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);

        } catch (err: any) {
            console.error('Confirm reset password error:', err);

            if (err.name === 'CodeMismatchException') {
                setError('Invalid verification code. Please check your email.');
            } else if (err.name === 'ExpiredCodeException') {
                setError('Verification code has expired. Please request a new one.');
            } else if (err.name === 'InvalidPasswordException') {
                setError('Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, and numbers.');
            } else if (err.name === 'LimitExceededException') {
                setError('Too many attempts. Please try again later.');
            } else {
                setError(err.message || 'Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Eye icon component
    const EyeIcon = ({ visible }: { visible: boolean }) => (
        visible ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
        )
    );

    if (success) {
        return (
            <div className="login-container">
                <div className="login-card">
                    <div className="text-center">
                        <div className="mb-4 text-green-600 flex justify-center">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-2">Password Reset Successful!</h2>
                        <p className="text-slate-600 dark:text-zinc-400 mb-6 text-sm">
                            Your password has been changed successfully.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-zinc-500 mb-4">
                            Redirecting to login page...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Reset Password</h2>
                    <p>Enter the code sent to {email}</p>
                </div>

                {error && <div className="alert-box alert-error">{error}</div>}

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <div className="input-group">
                        <label htmlFor="code">Verification Code</label>
                        <input
                            type="text"
                            id="code"
                            placeholder="Enter 6-digit code"
                            value={verificationCode}
                            onChange={(e) => {
                                setVerificationCode(e.target.value);
                                if (fieldErrors.code) setFieldErrors(prev => ({ ...prev, code: undefined }));
                            }}
                            maxLength={6}
                            disabled={loading}
                        />
                        {fieldErrors.code ? (
                            <p className="text-rose-500 dark:text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 inline-block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {fieldErrors.code}
                            </p>
                        ) : (
                            <p className="text-xs text-gray-500 mt-1">Check your email for the code</p>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">New Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                className="input-with-icon"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: undefined }));
                                }}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="btn-eye"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <EyeIcon visible={showPassword} />
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="text-rose-500 dark:text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 inline-block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {fieldErrors.password}
                            </p>
                        )}
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="password-wrapper">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                className="input-with-icon"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: undefined }));
                                }}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="btn-eye"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <EyeIcon visible={showConfirmPassword} />
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                            <p className="text-rose-500 dark:text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 inline-block shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                {fieldErrors.confirmPassword}
                            </p>
                        )}
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Remember your password? <Link href="/login">Back to Login</Link></p>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}