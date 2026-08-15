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
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedTheme = localStorage.getItem('sb_theme');
        if (savedTheme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

        const handleScroll = () => {
            setScrollY(window.scrollY);
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        if (logout()) {
            router.push('/');
        }
    };

    // Warm translucent beige background style with lower opacity & higher backdrop blur
    const navbarOpacity = Math.min(0.70 + (scrollY / 300) * 0.18, 0.88);
    const navbarBlur = Math.min(18 + (scrollY / 300) * 10, 28);

    return (
        <motion.nav 
            className={`navbar${scrolled ? ' scrolled' : ''}`}
            style={{
                background: `rgba(245, 241, 231, ${navbarOpacity})`, // Warm translucent beige
                backdropFilter: `blur(${navbarBlur}px)`,
                WebkitBackdropFilter: `blur(${navbarBlur}px)`,
                borderBottom: '1px solid rgba(31, 61, 43, 0.05)', // Subtle bottom border
                boxShadow: scrolled ? '0 4px 30px rgba(31, 61, 43, 0.015)' : 'none',
            }}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <div className="navbar-inner">
                {/* Decreased logo size slightly to align with the lightweight header layout */}
                <Link href="/" className="navbar-logo" style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '36px', marginLeft: '12px', textDecoration: 'none' }}>
                    <img
                        src="/logo-leaf.jpg"
                        alt="leaf"
                        className="navbar-logo-leaf"
                        style={{
                            position: 'absolute',
                            left: '-14px',
                            top: '-8px',
                            width: '33px',
                            height: '33px',
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
                            paddingLeft: '13px',
                            color: 'var(--accent)',
                        }}
                    >
                        SmarterBlinkit
                    </span>
                </Link>

                <div className="navbar-links">
                    {user ? (
                        <>
                            {/* Simplified Links: Keep only Shop, Agent, Live */}
                            {user.role === 'buyer' && (
                                <>
                                    <Link href="/shop" className={`navbar-link ${pathname === '/shop' ? 'active' : ''}`}>
                                        Shop
                                    </Link>
                                    <Link href="/ai-agent" className={`navbar-link ${pathname === '/ai-agent' ? 'active' : ''}`}>
                                        Agent
                                    </Link>
                                    <Link href="/storeboard" className={`navbar-link ${pathname === '/storeboard' ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', flexShrink: 0 }} />
                                        Live
                                    </Link>
                                </>
                            )}

                            {/* Understated Cart Presentation */}
                            {user.role === 'buyer' && (
                                <button
                                    onClick={() => setCartOpen(true)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        padding: '8px 0',
                                        fontFamily: 'var(--font-body)',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                    Cart ({cartCount})
                                </button>
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

                            {/* Clean Account Section Dropdown */}
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <button 
                                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '8px 0',
                                        fontFamily: 'var(--font-body)',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                >
                                    <span>{user.name.split(' ')[0]}</span>
                                    <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>▼</span>
                                </button>

                                <AnimatePresence>
                                    {dropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                            transition={{ duration: 0.15 }}
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                marginTop: '8px',
                                                background: '#FCFBF8',
                                                border: '1px solid rgba(31, 61, 43, 0.08)',
                                                borderRadius: '10px',
                                                padding: '6px',
                                                minWidth: '160px',
                                                boxShadow: '0 10px 30px rgba(31, 61, 43, 0.04)',
                                                zIndex: 1000,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px',
                                            }}
                                        >
                                            <Link 
                                                href="/dashboard" 
                                                onClick={() => setDropdownOpen(false)}
                                                style={{
                                                    padding: '8px 12px',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    borderRadius: '6px',
                                                    textDecoration: 'none',
                                                    transition: 'background 0.2s, color 0.2s',
                                                }}
                                                className="navbar-dropdown-item"
                                            >
                                                Dashboard
                                            </Link>
                                            
                                            {user.role === 'buyer' && (
                                                <Link 
                                                    href="/money-map" 
                                                    onClick={() => setDropdownOpen(false)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)',
                                                        borderRadius: '6px',
                                                        textDecoration: 'none',
                                                        transition: 'background 0.2s, color 0.2s',
                                                    }}
                                                    className="navbar-dropdown-item"
                                                >
                                                    Map
                                                </Link>
                                            )}

                                            <button
                                                onClick={() => {
                                                    const current = document.documentElement.getAttribute('data-theme');
                                                    const newTheme = current === 'dark' ? '' : 'dark';
                                                    if (newTheme) {
                                                        document.documentElement.setAttribute('data-theme', newTheme);
                                                    } else {
                                                        document.documentElement.removeAttribute('data-theme');
                                                    }
                                                    localStorage.setItem('sb_theme', newTheme || 'light');
                                                    setDropdownOpen(false);
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    padding: '8px 12px',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--text-secondary)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }}
                                                className="navbar-dropdown-item"
                                            >
                                                <span>Theme</span>
                                                <span style={{ fontSize: '0.78rem' }}>◐</span>
                                            </button>

                                            <div style={{ height: '1px', background: 'rgba(31, 61, 43, 0.06)', margin: '4px 0' }} />
                                            
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    textAlign: 'left',
                                                    padding: '8px 12px',
                                                    fontSize: '0.8rem',
                                                    color: 'var(--danger)',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    width: '100%',
                                                }}
                                                className="navbar-dropdown-item"
                                            >
                                                Sign out
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="navbar-link">Sign in</Link>
                            <Link href="/register" className="btn btn-primary btn-sm" style={{ padding: '8px 18px', fontSize: '0.825rem' }}>Get started</Link>
                        </>
                    )}
                </div>
            </div>
        </motion.nav>
    );
}
