'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';

export default function ForgotPasswordPage() {
    const { api, toast } = useApp();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Request, 2: Reset
    const [loading, setLoading] = useState(false);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password-request', { email });
            toast(data.message, 'success');
            setStep(2);
        } catch (err: any) {
            toast(err?.response?.data?.message || 'Email not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await api.post('/auth/reset-password', { email, newPassword });
            toast(data.message, 'success');
            router.push('/login');
        } catch (err: any) {
            toast(err?.response?.data?.message || 'Reset failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ width: '100%', maxWidth: '380px' }}>
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <Link href="/" style={{ display: 'inline-block', marginBottom: '24px', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600 }}>Smarter<span className="text-accent">Blinkit</span></span>
                    </Link>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: '8px' }}>Reset Password</h1>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{step === 1 ? 'Enter your email to continue' : 'Set your new password'}</p>
                </div>

                <div style={{ padding: '32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    {step === 1 ? (
                        <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="form-group">
                                <label className="form-label">Account Email</label>
                                <input className="form-input" type="email" placeholder="you@example.com"
                                    value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                {loading ? 'Checking…' : 'Continue'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input className="form-input" type="password" placeholder="Min 6 characters"
                                    value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                            </div>
                            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                                {loading ? 'Resetting…' : 'Change Password'}
                            </button>
                        </form>
                    )}
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Remembered?{' '}
                    <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Back to login</Link>
                </p>
            </div>
        </div>
    );
}
