'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/context';
import FaceLogin from '@/components/FaceLogin';

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12 }
        }
    };
    
    const childVariants = {
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
    };

    return (
        <div className="auth-split-container">
            {/* Left Panel: Premium Editorial Grocery Campaign Banner */}
            <div className="auth-left-panel">
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
                    <motion.img
                        src="/auth-bg.jpg"
                        alt="Premium groceries delivery"
                        className="auth-left-image"
                        style={{ objectPosition: '58% 50%' }} // Crops face to the right, heading lands on clean space
                        animate={{ scale: [1, 1.01, 1] }}
                        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <motion.div 
                        className="auth-left-overlay" 
                        animate={{ opacity: [0.95, 0.98, 0.95] }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    />
                </div>

                <motion.div 
                    className="auth-left-content"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={childVariants} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.55, fontFamily: 'var(--font-mono)' }}>
                            Est. 2026 · Designed in Jaipur
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.85, fontFamily: 'var(--font-mono)' }}>
                            SmarterBlinkit Marketplace
                        </div>
                    </motion.div>

                    <div className="auth-left-hero">
                        <motion.h1 
                            variants={childVariants} 
                            className="auth-left-title"
                            style={{ fontSize: '2.7rem', lineHeight: '1.2', fontWeight: 600 }}
                        >
                            Everything you need, thoughtfully gathered.
                        </motion.h1>
                        
                        <motion.p 
                            variants={childVariants} 
                            className="auth-left-subtitle"
                        >
                            Shop from trusted neighborhood stores with real inventory, thoughtfully organized around what you need.
                        </motion.p>
                        
                        <motion.div 
                            variants={childVariants} 
                            style={{ width: '40px', height: '1px', background: 'rgba(255, 255, 255, 0.25)', margin: '28px 0' }}
                        />
                        
                        <motion.p 
                            variants={childVariants}
                            style={{
                                fontFamily: 'var(--font-body)',
                                fontSize: '0.94rem',
                                lineHeight: '1.65',
                                fontStyle: 'italic',
                                opacity: 0.72,
                                marginTop: '44px',
                                maxWidth: '440px',
                                color: '#F5F0E8'
                            }}
                        >
                            Planning dinner should feel effortless. SmarterBlinkit connects recipes, nearby inventory, and local stores into one seamless experience.
                        </motion.p>
                    </div>

                    <motion.div variants={childVariants} style={{ fontSize: '0.65rem', opacity: 0.4, fontFamily: 'var(--font-mono)', marginTop: '36px' }}>
                        © 2026 SmarterBlinkit. All rights reserved.
                    </motion.div>
                </motion.div>
            </div>

            {/* Right Panel: Clean Authentication card */}
            <div className="auth-right-panel">
                <motion.div
                    className="auth-card-container"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                >
                    {/* Brand Logo */}
                    <div style={{ marginBottom: '28px', textAlign: 'left' }}>
                        <Link href="/" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', height: '36px', textDecoration: 'none' }}>
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
                                    color: 'var(--accent)',
                                }}
                            >
                                SmarterBlinkit
                            </span>
                        </Link>
                    </div>

                    <div style={{ padding: '40px', background: '#FCFBF8', border: '1px solid rgba(31, 61, 43, 0.03)', borderRadius: '24px', boxShadow: '0 15px 45px rgba(31, 61, 43, 0.02)' }}>
                        <div style={{ marginBottom: '28px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>Welcome back</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sign in to continue to your dashboard</p>
                        </div>

                        {!showFace ? (
                            <>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                                        <input className="auth-form-input" type="email" placeholder="you@example.com"
                                            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <label className="form-label" style={{ fontWeight: 500, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Password</label>
                                            <Link href="/forgot-password" style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 500 }}>Forgot?</Link>
                                        </div>
                                        <input className="auth-form-input" type="password" placeholder="••••••••"
                                            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                                    </div>
                                    <motion.button 
                                        type="submit" 
                                        className="btn btn-primary w-full" 
                                        disabled={loading} 
                                        style={{ marginTop: '8px', borderRadius: '10px', padding: '12px' }}
                                        whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(31, 61, 43, 0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {loading ? 'Signing in…' : 'Sign In'}
                                    </motion.button>
                                </form>

                                <div style={{ margin: '24px 0', textAlign: 'center', position: 'relative', height: '1px', background: 'var(--border)' }}>
                                    <span style={{ position: 'absolute', top: '-9px', left: '50%', transform: 'translateX(-50%)', background: '#FCFBF8', padding: '0 12px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>or</span>
                                </div>

                                <motion.button 
                                    onClick={() => setShowFace(true)} 
                                    className="btn w-full" 
                                    style={{ fontSize: '0.85rem', borderRadius: '10px', padding: '12px', background: 'transparent', border: '1px solid rgba(31, 61, 43, 0.12)', color: 'var(--text-secondary)' }}
                                    whileHover={{ y: -1, background: 'rgba(250, 247, 241, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    Sign in with Face ID
                                </motion.button>
                            </>
                        ) : (
                            <FaceLogin onBack={() => setShowFace(false)} />
                        )}
                    </div>

                    <p style={{ textAlign: 'left', paddingLeft: '8px', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        New here?{' '}
                        <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create an account</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
