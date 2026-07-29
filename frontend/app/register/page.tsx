'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/context';
import FaceRegister from '@/components/FaceRegister';
import MapPicker from '@/components/MapPicker';
import type { MapLocationData } from '@/components/MapPickerBase';
import { fadeUp, staggerContainer } from '@/lib/animations';

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

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                style={{ width: '100%', maxWidth: step === 2 ? '800px' : '440px', transition: 'max-width 0.35s ease' }}>

                <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <Link href="/" style={{ display: 'inline-block', marginBottom: '24px', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>Smarter<span className="text-accent">Blinkit</span></span>
                    </Link>
                    <AnimatePresence mode="wait">
                        <motion.div key={step}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}>
                            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 500, marginBottom: '8px' }}>
                                {step === 1 ? 'Create Account' : step === 2 ? 'Set Location' : 'Face ID'}
                            </h1>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                {step === 1 ? 'Join the marketplace' : step === 2 ? 'Pin your delivery location' : 'Enable fast login'}
                            </p>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Step Indicator — minimal line dots */}
                <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                    {[1, 2, 3].map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.68rem', fontWeight: 600, fontFamily: 'var(--font-mono)',
                                background: step >= s ? 'var(--accent)' : 'transparent',
                                color: step >= s ? '#F5F0E8' : 'var(--text-muted)',
                                border: step < s ? '1px solid var(--border)' : 'none',
                                transition: 'all 0.3s ease'
                            }}>
                                {step > s ? '✓' : s}
                            </div>
                            {i < 2 && <div style={{ width: 40, height: 1, background: step > s ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s ease' }} />}
                        </div>
                    ))}
                </motion.div>

                {/* Role Picker (Step 1 only) */}
                <AnimatePresence>
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            {[{ v: 'buyer', label: 'Buyer', sub: 'Shop & explore' }, { v: 'seller', label: 'Seller', sub: 'Sell products' }].map(r => (
                                <button key={r.v} onClick={() => setForm((f: any) => ({ ...f, role: r.v }))} type="button"
                                    style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', border: `1.5px solid ${form.role === r.v ? 'var(--accent)' : 'var(--border)'}`, background: form.role === r.v ? 'var(--accent-subtle)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'center' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: form.role === r.v ? 'var(--accent)' : 'var(--text-primary)' }}>{r.label}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{r.sub}</div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.div key={step}
                        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{ padding: step === 2 ? '2px' : '32px', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>

                        {step === 1 && (
                            <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <input className="form-input" placeholder="John Doe" value={form.name} onChange={set('name')} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input className="form-input" placeholder="+91 98765..." value={form.phone} onChange={set('phone')} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
                                </div>
                                {form.role === 'seller' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="form-group">
                                        <label className="form-label">Shop Name</label>
                                        <input className="form-input" placeholder="My Store" value={form.shopName} onChange={set('shopName')} required />
                                    </motion.div>
                                )}
                                <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '8px' }}>
                                    Continue to Location
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <div style={{ width: '100%', height: '600px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                                    <span style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Move the pin to your delivery location</span>
                                </div>
                                <MapPicker onConfirm={handleLocationConfirm} buttonText={loading ? "Creating Account..." : "Confirm & Create Account"} />
                            </div>
                        )}

                        {step === 3 && (
                            <FaceRegister userRole={form.role} onSkip={handleSkipFace} />
                        )}
                    </motion.div>
                </AnimatePresence>

                {step === 1 && (
                    <motion.p variants={fadeUp} style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
}
