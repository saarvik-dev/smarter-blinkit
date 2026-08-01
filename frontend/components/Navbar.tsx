'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/lib/context';

import { useEffect, useState, useRef } from 'react';

export default function Navbar() {
    const { user, logout, cartCount, setCartOpen, api, updateUser, toast } = useApp();
    const pathname = usePathname();
    const router = useRouter();

    const [scrolled, setScrolled] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [cartBounce, setCartBounce] = useState(false);
    const prevCartCount = useRef(cartCount);

    useEffect(() => {
        const savedTheme = localStorage.getItem('sb_theme');
        if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

        const handleScroll = () => {
            setScrollY(window.scrollY);
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (cartCount > prevCartCount.current) {
            setCartBounce(true);
            setTimeout(() => setCartBounce(false), 600);
        }
        prevCartCount.current = cartCount;
    }, [cartCount]);

    const handleLogout = () => {
        if (logout()) {
            router.push('/');
        }
    };

    const navbarOpacity = Math.min(0.72 + (scrollY / 300) * 0.24, 0.96);
    const navbarBlur = Math.min(16 + (scrollY / 300) * 8, 24);

    return (
        <motion.nav 
            className={`navbar${scrolled ? ' scrolled' : ''}`}
            style={{
                background: `rgba(247, 243, 234, ${navbarOpacity})`,
                backdropFilter: `blur(${navbarBlur}px)`,
                WebkitBackdropFilter: `blur(${navbarBlur}px)`,
                borderBottom: '1px solid rgba(31, 61, 43, 0.08)',
                boxShadow: `0 4px 30px rgba(31, 61, 43, ${Math.min((scrollY / 300) * 0.03, 0.03)})`,
            }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className="navbar-inner">
                <Link href="/" className="navbar-logo" style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '36px', marginLeft: '12px' }}>
                    <img
                        src="/logo-leaf.jpg"
                        alt="leaf"
                        className="navbar-logo-leaf"
                        style={{
                            position: 'absolute',
                            left: '-14px',
                            top: '-8px',
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
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            paddingLeft: '14px',
                        }}
                    >
                        SmarterBlinkit
                    </span>
                </Link>
 
                <div className="navbar-links">
                    {user ? (
                        <>
                            <Link href="/dashboard" className={`navbar-link ${pathname.startsWith('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
                            {user.role === 'buyer' && (
                                <>
                                    <Link href="/shop" className={`navbar-link ${pathname.startsWith('/shop') ? 'active' : ''}`}>Shop</Link>
                                    <Link href="/ai-agent" className={`navbar-link ${pathname.startsWith('/ai-agent') ? 'active' : ''}`}>Agent</Link>
                                    <Link href="/storeboard" className={`navbar-link ${pathname.startsWith('/storeboard') ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', flexShrink: 0 }} />
                                        Live
                                    </Link>
                                    <Link href="/money-map" className={`navbar-link ${pathname.startsWith('/money-map') ? 'active' : ''}`}>Map</Link>
                                </>
                            )}
                            {user.role === 'buyer' && (
                                <motion.button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setCartOpen(true)}
                                    style={{
                                        gap: '6px',
                                        position: 'relative',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.72rem',
                                        background: 'rgba(250, 247, 241, 0.6)',
                                        border: '1px solid rgba(31, 61, 43, 0.08)',
                                        borderRadius: '6px',
                                        color: 'var(--text-secondary)',
                                        boxShadow: 'none',
                                        padding: '5px 12px',
                                    }}
                                    animate={cartBounce ? { scale: [1, 1.15, 0.95, 1.05, 1] } : { scale: 1 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                >
                                    <AnimatePresence mode="popLayout">
                                        <motion.span
                                            key={cartCount}
                                            initial={{ scale: 0.5, opacity: 0, y: -8 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0.5, opacity: 0, y: 8 }}
                                            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                                            style={{ display: 'inline-block', minWidth: '1ch' }}
                                        >
                                            Cart ({cartCount})
                                        </motion.span>
                                    </AnimatePresence>
                                </motion.button>
                            )}
                            {/* Address Switcher */}
                            {user.role === 'buyer' && user.savedAddresses && user.savedAddresses.length > 0 && (
                                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(31, 61, 43, 0.08)', background: 'rgba(250, 247, 241, 0.4)', cursor: 'pointer', maxWidth: '180px' }}
                                    onMouseEnter={() => { const el = document.getElementById('navbar-addr-dropdown'); if (el) el.style.display = 'block'; }}
                                    onMouseLeave={() => { const el = document.getElementById('navbar-addr-dropdown'); if (el) el.style.display = 'none'; }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)' }}>Delivering to</div>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                {user.location?.address?.split(',')[0] || user.location?.city || 'Select Address'}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>▼</span>
                                    </div>

                                    {/* Dropdown Menu */}
                                    <div id="navbar-addr-dropdown" style={{ display: 'none', position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '8px', minWidth: '220px', boxShadow: 'var(--shadow-lg)', zIndex: 100 }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 8px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>Saved Addresses</div>
                                        {user.savedAddresses.map((addr: any) => {
                                            const isActive = user.location?.coordinates && addr.coordinates && user.location.coordinates[0] === addr.coordinates[0] && user.location.coordinates[1] === addr.coordinates[1];
                                            return (
                                                <div key={addr._id}
                                                    onClick={async () => {
                                                        if (isActive) return;
                                                        try {
                                                            const { data } = await api.put('/auth/addresses/active', { addressId: addr._id });
                                                            updateUser(data.user);
                                                            toast('Delivery address updated', 'success');
                                                        } catch (e) { }
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', borderRadius: '6px', cursor: isActive ? 'default' : 'pointer', background: isActive ? 'var(--accent-subtle)' : 'transparent', transition: 'var(--transition)' }}
                                                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text-primary)' }}>{addr.tag}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{addr.address}</div>
                                                    </div>
                                                    {isActive && <span style={{ color: 'var(--accent)', fontSize: '0.72rem', fontWeight: 600 }}>✓</span>}
                                                </div>
                                            );
                                        })}
                                        <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                                        <Link href="/dashboard" style={{ display: 'block', padding: '8px', fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, textAlign: 'center', borderRadius: '6px' }}>
                                            Manage Addresses
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {user.name.split(' ')[0]}
                            </span>

                            {/* Theme Toggle */}
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                const current = document.documentElement.getAttribute('data-theme');
                                const newTheme = current === 'dark' ? '' : 'dark';
                                if (newTheme) {
                                    document.documentElement.setAttribute('data-theme', newTheme);
                                } else {
                                    document.documentElement.removeAttribute('data-theme');
                                }
                                localStorage.setItem('sb_theme', newTheme || 'light');
                            }} style={{ fontSize: '0.78rem', padding: '4px 8px', fontFamily: 'var(--font-mono)' }} title="Toggle Theme">
                                ◐
                            </button>

                            <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ fontSize: '0.78rem' }}>Sign out</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="navbar-link">Sign in</Link>
                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                const current = document.documentElement.getAttribute('data-theme');
                                const newTheme = current === 'dark' ? '' : 'dark';
                                if (newTheme) {
                                    document.documentElement.setAttribute('data-theme', newTheme);
                                } else {
                                    document.documentElement.removeAttribute('data-theme');
                                }
                                localStorage.setItem('sb_theme', newTheme || 'light');
                            }} style={{ fontSize: '0.78rem', padding: '6px 8px', fontFamily: 'var(--font-mono)' }} title="Toggle Theme">◐</button>
                            <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
