'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/context';
import FaceRegister from '@/components/FaceRegister';
import MapPicker from '@/components/MapPicker';
import type { MapLocationData } from '@/components/MapPickerBase';
import { fadeUp } from '@/lib/animations';

export default function RegisterPage() {
    const { register, toast } = useApp();
    const router = useRouter();
    const [form, setForm] = useState<any>({
        name: '', email: '', password: '', role: 'buyer', phone: '', shopName: '',
        streetAddress: '', city: '', state: '', pincode: '', country: 'India',
        location: null
    });
    const [loading, setLoading] = useState(false);

    // 1 = General Details, 2 = Location Map, 3 = Face ID
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f: any) => ({ ...f, [field]: e.target.value }));

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleLocationConfirm = async (loc: MapLocationData) => {
        const finalForm = {
            ...form,
            streetAddress: loc.street || form.streetAddress,
            city: loc.city || form.city,
            state: loc.state || form.state,
            pincode: loc.pincode || form.pincode,
            address: loc.address,
            location: {
                type: 'Point',
                coordinates: loc.coordinates,
                address: loc.address
            }
        };

        setForm(finalForm);
        setLoading(true);

        try {
            await register(finalForm);
            toast('Account created!', 'success');
            setStep(3);
        } catch (err: any) {
            toast(err?.response?.data?.message || 'Registration failed', 'error');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleSkipFace = () => {
        router.replace(form.role === 'seller' ? '/dashboard' : '/shop');
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
            <div className="auth-right-panel" style={{ justifyContent: step === 2 ? 'flex-start' : 'center', paddingTop: step === 2 ? '80px' : '48px' }}>
                <motion.div
                    className="auth-card-container"
                    style={{ maxWidth: step === 2 ? '780px' : '450px', transition: 'max-width 0.35s ease' }}
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

                    <div style={{ padding: step === 2 ? '12px' : '40px', background: '#FCFBF8', border: '1px solid rgba(31, 61, 43, 0.03)', borderRadius: '24px', boxShadow: '0 15px 45px rgba(31, 61, 43, 0.02)', overflow: 'hidden' }}>
                        {step !== 2 && (
                            <div style={{ marginBottom: '28px' }}>
                                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
                                    {step === 1 ? 'Create Account' : 'Face ID'}
                                </h2>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {step === 1 ? 'Join the marketplace today' : 'Enable fast secure login'}
                                </p>
                            </div>
                        )}

                        {/* Step Indicator — minimal dots */}
                        {step !== 2 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                                {[1, 2, 3].map((s, i) => (
                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 600, fontFamily: 'var(--font-mono)',
                                            background: step >= s ? 'var(--accent)' : 'transparent',
                                            color: step >= s ? '#F5F0E8' : 'var(--text-muted)',
                                            border: step < s ? '1px solid var(--border)' : 'none',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {step > s ? '✓' : s}
                                        </div>
                                        {i < 2 && <div style={{ width: 30, height: 1, background: step > s ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s ease' }} />}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Role Picker (Step 1 only) */}
                        {step === 1 && (
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                {[{ v: 'buyer', label: 'Buyer', sub: 'Shop & explore' }, { v: 'seller', label: 'Seller', sub: 'Sell products' }].map(r => (
                                    <button key={r.v} onClick={() => setForm((f: any) => ({ ...f, role: r.v }))} type="button"
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: `1.5px solid ${form.role === r.v ? 'var(--accent)' : 'var(--border)'}`, background: form.role === r.v ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: form.role === r.v ? 'var(--accent)' : 'var(--text-primary)' }}>{r.label}</div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.sub}</div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            <motion.div key={step}
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {step === 1 && (
                                    <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</label>
                                                <input className="auth-form-input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label" style={{ fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</label>
                                                <input className="auth-form-input" placeholder="+91 98765..." value={form.phone} onChange={set('phone')} required />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" style={{ fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</label>
                                            <input className="auth-form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" style={{ fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Password</label>
                                            <input className="auth-form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
                                        </div>
                                        {form.role === 'seller' && (
                                            <motion.div variants={fadeUp} className="form-group">
                                                <label className="form-label" style={{ fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shop Name</label>
                                                <input className="auth-form-input" placeholder="My Store" value={form.shopName} onChange={set('shopName')} required />
                                            </motion.div>
                                        )}
                                        <motion.button 
                                            type="submit" 
                                            className="btn btn-primary w-full" 
                                            style={{ marginTop: '8px', borderRadius: '10px', padding: '12px' }}
                                            whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(31, 61, 43, 0.08)' }}
                                            whileTap={{ scale: 0.98 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            Continue to Location
                                        </motion.button>
                                    </form>
                                )}

                                {step === 2 && (
                                    <div style={{ width: '100%', height: '580px', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ padding: '14px 8px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                                            <span style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Confirm delivery location coordinates</span>
                                        </div>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                            <MapPicker onConfirm={handleLocationConfirm} buttonText={loading ? "Creating Account..." : "Confirm & Create Account"} />
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <FaceRegister userRole={form.role} onSkip={handleSkipFace} />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {step === 1 && (
                        <p style={{ textAlign: 'left', paddingLeft: '8px', marginTop: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Already have an account?{' '}
                            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
