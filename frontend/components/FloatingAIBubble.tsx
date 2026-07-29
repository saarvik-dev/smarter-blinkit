'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Persistent floating AI helper in the bottom-right corner.
 * Appears 3s after page load. Click → navigate to /ai-agent.
 * Hidden on the AI agent page itself. Fully dismissible.
 * Pure visual — zero business logic.
 */
export default function FloatingAIBubble() {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(t);
    }, []);

    // Hide on AI page (redundant there)
    if (pathname === '/ai-agent' || dismissed) return null;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200 }}
                >
                    <div style={{ position: 'relative' }}>
                        <Link href="/ai-agent" style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 16px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            boxShadow: 'var(--shadow-lg)',
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            transition: 'var(--transition)',
                        }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ai)', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.3 }}>Ask the Agent</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>Powered by Gemini</div>
                            </div>
                        </Link>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDismissed(true);
                            }}
                            title="Dismiss"
                            style={{
                                position: 'absolute', top: -6, right: -6,
                                width: 18, height: 18,
                                borderRadius: '50%',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.55rem', color: 'var(--text-muted)',
                                cursor: 'pointer',
                                lineHeight: 1,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
