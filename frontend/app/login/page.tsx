'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/context';
import FaceLogin from '@/components/FaceLogin';
import { fadeUp, staggerContainer } from '@/lib/animations';

export default function LoginPage() {
    const { login, toast } = useApp();
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showFace, setShowFace] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loggedInUser = await login(form.email, form.password);
            toast('Welcome back!', 'success');
            if (loggedInUser?.role === 'seller') {
                router.replace('/dashboard');
            } else {
                router.replace('/shop');
            }
        } catch (err: any) {
            toast(err?.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                style={{ width: '100%', maxWidth: '380px' }}>

                <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <Link href="/" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: '36px', marginBottom: '24px', textDecoration: 'none' }}>
                        <img
                            src="/logo-leaf.jpg"
                            alt="leaf"
                            className="navbar-logo-leaf"
                            style={{
                                position: 'absolute',
                                left: '-14px',
                                top: '-6px',
                                width: '32px',
                                height: '32px',
                                transform: 'rotate(-5deg)',
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                        />
                        <span
                            className="navbar-logo-text"
                            style={{
                                position: 'relative',
                                zIndex: 1,
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.45rem',
                                fontWeight: 700,
                                letterSpacing: '-0.02em',
                                paddingLeft: '14px',
                            }}
                        >
                            SmarterBlinkit
                        </span>
                    </Link>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: '8px' }}>Welcome back</h1>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Sign in to continue</p>
                </motion.div>

                <motion.div variants={fadeUp} style={{ padding: '32px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
                    {!showFace ? (
                        <>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" placeholder="you@example.com"
                                        value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label className="form-label">Password</label>
                                        <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Forgot?</Link>
                                    </div>
                                    <input className="form-input" type="password" placeholder="••••••••"
                                        value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: '4px' }}>
                                    {loading ? 'Signing in…' : 'Sign In'}
                                </button>
                            </form>

                            <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative', height: '1px', background: 'var(--border)' }}>
                                <span style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-primary)', padding: '0 10px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>or</span>
                            </div>

                            <button onClick={() => setShowFace(true)} className="btn btn-secondary w-full" style={{ fontSize: '0.85rem' }}>
                                Sign in with Face ID
                            </button>
                        </>
                    ) : (
                        <FaceLogin onBack={() => setShowFace(false)} />
                    )}
                </motion.div>

                <motion.p variants={fadeUp} style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    New here?{' '}
                    <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create an account</Link>
                </motion.p>
            </motion.div>
        </div>
    );
}
