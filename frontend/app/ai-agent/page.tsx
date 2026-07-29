'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';
import { useApp } from '@/lib/context';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { fadeUp, staggerContainer, fade } from '@/lib/animations';

interface CartSuggestion {
    ingredient: { item: string; packsToBuy: number; amountText: string; searchQuery: string };
    bestMatch: any;
    alternatives: any[];
    addToCart: boolean;
}

export default function AIAgentPage() {
    const { api, addMultipleToCart, user, toast } = useApp();
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<{ cartItems: CartSuggestion[]; notFound: any[]; ingredients: any[]; fallback?: boolean; modelUsed?: string | null } | null>(null);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [nearbyOnly, setNearbyOnly] = useState(true);
    const [availableShops, setAvailableShops] = useState<any[]>([]);
    const [selectedShops, setSelectedShops] = useState<string[]>([]);

    const examples = ['Make pizza for 4 people', 'Biryani for 6 people', 'Healthy breakfast for the week', 'I have a cold, suggest remedies', 'Movie night snacks'];

    // Fetch shops for the filter once
    useEffect(() => {
        api.get('/shops/all').then((r) => setAvailableShops(r.data.shops || [])).catch(() => { });
    }, [api]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        setLoading(true); setResults(null);
        try {
            const lat = user?.location?.coordinates?.[1];
            const lng = user?.location?.coordinates?.[0];
            const shopParam = selectedShops.join(',');
            const effectiveNearby = selectedShops.length > 0 ? false : nearbyOnly;

            const payload = {
                prompt,
                lat,
                lng,
                nearbyOnly: effectiveNearby,
                shopId: shopParam || undefined
            };

            const { data } = await api.post('/ai/recipe-agent', payload);
            setResults(data);
            const allIndices = new Set<number>(data.cartItems.map((_: any, i: number) => i));
            setSelected(allIndices);
        } catch (err: any) {
            toast(err?.response?.data?.message || 'AI agent failed. Try again.', 'error');
        } finally { setLoading(false); }
    };

    const addSelectedToCart = () => {
        if (!user) { toast('Please login first', 'error'); return; }
        const itemsToAdd: any[] = [];
        results?.cartItems.forEach((item, index) => {
            if (selected.has(index)) {
                itemsToAdd.push({
                    productId: item.bestMatch._id,
                    name: item.bestMatch.name,
                    price: item.bestMatch.price,
                    quantity: item.ingredient.packsToBuy,
                    image: item.bestMatch.image,
                    shopId: item.bestMatch.shopId?._id,
                    shopName: item.bestMatch.shopId?.name
                });
            }
        });
        if (itemsToAdd.length > 0) {
            addMultipleToCart(itemsToAdd);
        }
    };

    const toggleItem = (index: number) => setSelected(s => { const n = new Set(s); if (n.has(index)) n.delete(index); else n.add(index); return n; });

    return (
        <>
            <Navbar />
            <CartSidebar />
            <main style={{ paddingTop: '64px', minHeight: '100vh', position: 'relative' }}>
                <div className="container" style={{ padding: '40px 24px', maxWidth: '820px', position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.4rem', marginBottom: '8px' }}>Meal Planner</h1>
                        <p className="text-muted" style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem' }}>Tell me what you want to cook or need — I&apos;ll find the ingredients from nearby shops and fill your cart automatically.</p>
                    </motion.div>

                    {/* Input */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
                        style={{ marginBottom: '28px', padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label className="form-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 500 }}>Recipe or request</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder='e.g. "Make pizza margherita for 4 people" or "Healthy breakfast meal prep for the week"'
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    style={{ resize: 'none' }}
                                />
                            </div>

                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginTop: '4px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 500, marginRight: '8px', fontFamily: 'var(--font-mono)' }}>FILTERS</span>

                                <MultiSelectDropdown
                                    options={availableShops.map(shop => ({ value: shop._id, label: shop.name }))}
                                    selected={selectedShops}
                                    onChange={setSelectedShops}
                                    placeholder="All Shops"
                                    allLabel="All Shops"
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                                    <input type="checkbox" id="nearbyOnly" checked={nearbyOnly} onChange={e => setNearbyOnly(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--text)' }} />
                                    <label htmlFor="nearbyOnly" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', cursor: 'pointer' }}>Nearby Only (50km)</label>
                                </div>

                                {selectedShops.length > 0 && (
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedShops([])}>Clear</button>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                                <motion.div whileTap={{ scale: 0.97 }}>
                                    <button type="submit" className="btn btn-primary" disabled={loading || !prompt.trim()}>
                                        {loading ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span className="ai-thinking-dot" style={{ background: '#fff' }} />
                                                <span className="ai-thinking-dot" style={{ background: '#fff', animationDelay: '0.2s' }} />
                                                <span className="ai-thinking-dot" style={{ background: '#fff', animationDelay: '0.4s' }} />
                                                Thinking...
                                            </span>
                                        ) : 'Find Ingredients'}
                                    </button>
                                </motion.div>
                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPrompt(''); setResults(null); }}>Clear</button>
                            </div>
                        </form>

                        {/* Example Prompts */}
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ marginTop: '16px' }}>
                            <p style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suggestions</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {examples.map((ex, i) => (
                                    <motion.button key={ex}
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + i * 0.06 }}
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        onClick={() => setPrompt(ex)} className="btn btn-ghost btn-sm"
                                        style={{ fontSize: '0.75rem', padding: '4px 12px', border: '1px solid var(--border)' }}>
                                        {ex}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Loading */}
                    <AnimatePresence>
                        {loading && (
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                                style={{ textAlign: 'center', padding: '64px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="ai-thinking-dot" style={{ width: 16, height: 16, animationDelay: `${i * 0.18}s` }} />
                                    ))}
                                </div>
                                <p style={{ fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-display)', marginBottom: '12px' }}>Analyzing your request...</p>
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Identifying ingredients · Matching nearby shops · Optimising cart</p>
                                <div style={{ maxWidth: 320, margin: '0 auto', overflow: 'hidden', background: 'var(--bg-elevated)', borderRadius: 999, height: 3 }}>
                                    <div className="inference-progress" style={{ height: '100%', borderRadius: 999 }} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results */}
                    <AnimatePresence>
                        {results && !loading && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                {results.fallback && (
                                    <div style={{ background: 'color-mix(in srgb, var(--ai) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--ai) 25%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: 'var(--ai)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                        AI is currently busy — showing keyword-based matches instead. Results may be broader.
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.2rem', marginBottom: '2px', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
                                            Found {results.cartItems.length} ingredient{results.cartItems.length !== 1 ? 's' : ''}
                                            {results.notFound.length > 0 && <span className="badge" style={{ marginLeft: 10, fontSize: '0.75rem', background: 'var(--bg-elevated)' }}>{results.notFound.length} missing</span>}
                                        </h2>
                                        {results.modelUsed && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.8, marginTop: '4px' }}>
                                                Generated using {results.modelUsed}
                                            </div>
                                        )}
                                    </div>
                                    {results.cartItems.length > 0 && (
                                        <motion.div whileTap={{ scale: 0.97 }}>
                                            <button className="btn btn-primary" onClick={addSelectedToCart}>
                                                Add {selected.size} to Cart
                                            </button>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Cart Items */}
                                <motion.div variants={staggerContainer} initial="hidden" animate="visible"
                                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                    {results.cartItems.map((item, index) => (
                                        <motion.div key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                                            className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', cursor: 'pointer', borderColor: selected.has(index) ? 'var(--text)' : 'var(--border)', background: selected.has(index) ? 'var(--bg-elevated)' : 'var(--bg-card)' }} onClick={() => toggleItem(index)}>
                                            <input type="checkbox" readOnly checked={selected.has(index)} style={{ width: 18, height: 18, accentColor: 'var(--text)' }} />
                                            <div style={{ fontSize: '1.2rem', width: 50, height: 50, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', color: 'var(--text-muted)' }}>
                                                {item.bestMatch.image ? <img src={item.bestMatch.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.bestMatch.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{item.bestMatch.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    For: {item.ingredient.item} · {item.ingredient.amountText} ·
                                                    from {item.bestMatch.shopId?.name || 'Local Shop'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>₹{(item.bestMatch.price * item.ingredient.packsToBuy).toFixed(2)}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>₹{item.bestMatch.price}/{item.bestMatch.unit}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Not Found */}
                                {results.notFound.length > 0 && (
                                    <div className="card" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)' }}>
                                        <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 500 }}>Not available nearby</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {results.notFound.map((item: any) => (
                                                <span key={item.item} className="badge" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>{item.item} ({item.amountText})</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}
