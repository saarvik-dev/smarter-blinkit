'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import InfiniteVerticalScroller from '@/components/InfiniteVerticalScroller';
import { staggerContainer, fadeUp, heroTextVariant, scaleIn } from '@/lib/animations';

const features = [
  { title: 'Meal Planner', desc: 'Say what you want to cook — your cart fills itself with the right ingredients from nearby shops.', note: 'Powered by Gemini' },
  { title: 'Natural Search', desc: 'Search by intent, not keywords. "I have a cold" returns ginger, honey, and vitamin C.', note: 'Semantic matching' },
  { title: 'Scan to Stock', desc: 'Sellers scan barcodes to update inventory instantly. No manual data entry.', note: 'Barcode recognition' },
  { title: 'Local Routing', desc: 'Every order routes to the nearest open shop for the fastest, cheapest delivery.', note: 'Geo-optimised' },
  { title: 'Related Picks', desc: 'Graph-powered recommendations surface items frequently bought together — like a shopkeeper who knows you.', note: 'Neo4j graph engine' },
  { title: 'Face Login', desc: 'Secure biometric login using your device camera. No passwords needed.', note: 'face-api.js' },
];

const stages = [
  { num: '01', label: 'Foundation', items: ['Dual login (Buyer & Seller)', 'Natural search', 'Barcode scanner', 'Payments'] },
  { num: '02', label: 'Automator', items: ['Meal planner (Gemini)', 'Related picks (Neo4j)', 'Smart suggestions'] },
  { num: '03', label: 'Orchestrator', items: ['Cart splitting', 'Live storeboard', 'Real-time updates'] },
  { num: '04', label: 'Intelligence', items: ['Spending heatmap', 'Product pairing'] },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>

        {/* ── HERO ─────────────────────────────────────────────── */}
        <section style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '100px 24px 80px', position: 'relative', overflow: 'hidden' }}>
          {/* Background Image & Gradient overlay */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.35, mixBlendMode: 'multiply', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(31,61,43,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div className="landing-hero-grid" style={{ position: 'relative', zIndex: 1 }}>
            <div className="landing-hero-left">
              {/* Eyebrow — simple text, not a pill */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hero-eyebrow"
              >
                Local grocery, intelligently delivered
              </motion.p>

              {/* Headline — typography is the hero */}
              <div style={{ overflow: 'hidden', marginBottom: '8px' }}>
                <motion.h1 custom={0} variants={heroTextVariant} initial="hidden" animate="visible"
                  style={{ lineHeight: 1.08, fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>
                  Shop smarter with
                </motion.h1>
              </div>
              <div style={{ overflow: 'hidden', marginBottom: '36px' }}>
                <motion.h1 custom={1} variants={heroTextVariant} initial="hidden" animate="visible"
                  style={{ lineHeight: 1.08, fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem, 3.4vw, 2.7rem)', fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--accent)' }}>
                  AI that understands you
                </motion.h1>
              </div>

              {/* Subtitle */}
              <motion.p custom={2} variants={heroTextVariant} initial="hidden" animate="visible"
                className="hero-subtitle"
              >
                Tell us what you want to cook, your health needs, or your occasion — we fill your cart from nearby shops automatically.
              </motion.p>

              {/* CTA — clean, two buttons */}
              <motion.div custom={3} variants={heroTextVariant} initial="hidden" animate="visible"
                className="hero-cta"
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/register" className="btn btn-primary btn-lg">Start Shopping</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link href="/register?role=seller" className="btn btn-secondary btn-lg">Sell on Platform</Link>
                </motion.div>
              </motion.div>

              {/* Minimal stats — monospace, no boxes */}
              <motion.div custom={4} variants={heroTextVariant} initial="hidden" animate="visible"
                className="hero-stats"
              >
                {[['4', 'models'], ['126+', 'products'], ['3', 'cities']].map(([val, lab]) => (
                  <div key={lab}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px', marginTop: '4px' }}>{lab}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            <InfiniteVerticalScroller />
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section style={{ padding: '96px 24px', borderTop: '1px solid var(--border)', position: 'relative' }}>
          <div className="container">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.01em' }}>
                Everything you need,<br />quietly intelligent
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '420px', margin: '16px auto 0', fontSize: '0.95rem', lineHeight: 1.7 }}>
                Every feature is designed to feel natural — intelligence works behind the scenes.
              </p>
            </motion.div>

            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {features.map(f => (
                <motion.div key={f.title} variants={fadeUp}
                  style={{ background: 'var(--bg-primary)', padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontWeight: 500 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, flex: 1 }}>{f.desc}</p>
                  <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{f.note}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── STAGES ───────────────────────────────────────────── */}
        <section style={{ padding: '96px 24px', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{ textAlign: 'center', marginBottom: '64px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', letterSpacing: '-0.01em' }}>Built in four stages</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.95rem' }}>Each layer adds more intelligence to the platform.</p>
            </motion.div>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {stages.map(s => (
                <motion.div key={s.num} variants={fadeUp}
                  style={{ padding: '32px 28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', position: 'relative' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Stage {s.num}</div>
                  <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)', fontWeight: 500, marginBottom: '16px' }}>{s.label}</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {s.items.map(item => (
                      <li key={item} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section style={{ padding: '120px 24px', borderTop: '1px solid var(--border)' }}>
          <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', letterSpacing: '-0.01em', marginBottom: '16px' }}>Ready to shop smarter?</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0 auto 40px', maxWidth: '380px', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Join buyers and local sellers already on the platform.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Link href="/register" className="btn btn-primary btn-lg">Create Free Account</Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer style={{ padding: '32px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px' }}>
          <div className="container">
            <p>SmarterBlinkit · Next.js · Express · Gemini · Neo4j</p>
          </div>
        </footer>
      </main>
    </>
  );
}
