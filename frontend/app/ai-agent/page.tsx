'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';
import { useApp } from '@/lib/context';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';

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
    const [hasSearched, setHasSearched] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    // Choreographed transition stages: 'idle' | 'acknowledging' | 'moving' | 'loading' | 'done'
    const [transitionStage, setTransitionStage] = useState<'idle' | 'acknowledging' | 'moving' | 'loading' | 'done'>('idle');

    // Rotating Placeholders
    const placeholders = [
        'Cook butter paneer for tonight',
        'I have mushrooms and spinach',
        'Healthy breakfast for two',
        'Dinner under ₹500',
        'Movie night snacks'
    ];
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
        }, 4500);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    // Rotating Suggestions
    const [suggestionGroupIndex, setSuggestionGroupIndex] = useState(0);
    const suggestionGroups = [
        {
            name: 'Popular Tonight',
            items: ['Make pizza for 4 people', 'Dinner under ₹500']
        },
        {
            name: 'Quick Weeknight',
            items: ['15 min garlic noodles', 'Quick tomato soup']
        },
        {
            name: 'Healthy',
            items: ['Healthy breakfast prep', 'High protein meal prep']
        },
        {
            name: 'Comfort Food',
            items: ['Warm chicken soup', 'Mac and cheese bowl']
        },
        {
            name: 'Seasonal',
            items: ['Winter vegetable stew', 'Summer fruit salad']
        },
        {
            name: 'Weekend Cooking',
            items: ['Biryani for 6 people', 'Pasta from scratch']
        }
    ];

    useEffect(() => {
        if (hasSearched) return;
        const interval = setInterval(() => {
            setSuggestionGroupIndex(prev => (prev + 1) % suggestionGroups.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [hasSearched, suggestionGroups.length]);

    // Fetch shops for the filter once
    useEffect(() => {
        api.get('/shops/all').then((r) => setAvailableShops(r.data.shops || [])).catch(() => { });
    }, [api]);

    // Loading descriptive progress cycle
    const [loadingStep, setLoadingStep] = useState(0);
    useEffect(() => {
        if (!loading) {
            setLoadingStep(0);
            return;
        }
        const timer1 = setTimeout(() => setLoadingStep(1), 1500);
        const timer2 = setTimeout(() => setLoadingStep(2), 3000);
        const timer3 = setTimeout(() => setLoadingStep(3), 4500);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [loading]);

    const getLoadingMessage = () => {
        switch (loadingStep) {
            case 0: return 'Understanding your request...';
            case 1: return 'Finding nearby stores and ingredients...';
            case 2: return 'Matching product selections...';
            default: return 'Preparing your shopping list...';
        }
    };

    const triggerApiCall = useCallback(async (q: string) => {
        try {
            const lat = user?.location?.coordinates?.[1];
            const lng = user?.location?.coordinates?.[0];
            const shopParam = selectedShops.join(',');
            const effectiveNearby = selectedShops.length > 0 ? false : nearbyOnly;

            const payload = {
                prompt: q,
                lat,
                lng,
                nearbyOnly: effectiveNearby,
                shopId: shopParam || undefined
            };

            const { data } = await api.post('/ai/recipe-agent', payload);
            setResults(data);
            const allIndices = new Set<number>(data.cartItems.map((_: any, i: number) => i));
            setSelected(allIndices);
            setTransitionStage('done');
        } catch (err: any) {
            toast(err?.response?.data?.message || 'AI agent failed. Try again.', 'error');
            setHasSearched(false);
            setTransitionStage('idle');
        } finally {
            setLoading(false);
        }
    }, [api, user, selectedShops, nearbyOnly, toast]);

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!prompt.trim() || loading) return;

        // Stage 1: Button compressed & Acknowledging transition triggers
        setTransitionStage('acknowledging');

        // Stage 2: Heading and Suggestions fade out (takes 250ms)
        setTimeout(() => {
            setTransitionStage('moving');
            setHasSearched(true);

            // Stage 3: Search container moves upward into pinned workspace position (takes 450ms)
            setTimeout(() => {
                setTransitionStage('loading');
                setLoading(true);
                // Stage 4: Trigger actual API call
                triggerApiCall(prompt);
            }, 450);
        }, 250);
    };

    const handleSuggestionClick = (sq: string) => {
        setPrompt(sq);
        // Custom sequence for inspiration chip click
        setTransitionStage('acknowledging');
        setTimeout(() => {
            setTransitionStage('moving');
            setHasSearched(true);
            setTimeout(() => {
                setTransitionStage('loading');
                setLoading(true);
                triggerApiCall(sq);
            }, 450);
        }, 250);
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

    const toggleItem = (index: number) => setSelected(s => {
        const n = new Set(s);
        if (n.has(index)) n.delete(index);
        else n.add(index);
        return n;
    });

    const layoutTransition = shouldReduceMotion ? { duration: 0.1 } : {
        type: 'spring',
        stiffness: 220,
        damping: 26,
        mass: 1
    };

    const searchTransition = shouldReduceMotion ? { duration: 0.1 } : {
        type: 'spring',
        stiffness: 160,
        damping: 24,
        mass: 1
    };

    const resultsContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
        visible: {
            opacity: 1,
            y: 0,
            transition: shouldReduceMotion ? { duration: 0.1 } : {
                type: 'spring',
                stiffness: 240,
                damping: 28
            }
        }
    };

    const getImageStyle = () => {
        if (hasSearched) {
            return {
                scale: 0.98,
                y: 0,
                opacity: 0.12,
                filter: 'blur(1.5px) saturate(80%) contrast(90%) brightness(96%)',
            };
        }
        if (isFocused) {
            return {
                scale: 1.01,
                y: -3,
                opacity: 0.95,
                filter: 'blur(1.4px) saturate(83%) contrast(88%) brightness(95%)',
            };
        }
        return {
            scale: 1.00,
            y: 0,
            opacity: 0.85,
            filter: 'blur(1.2px) saturate(85%) contrast(90%) brightness(96%)',
        };
    };

    const isPendingTransition = transitionStage === 'acknowledging' || transitionStage === 'moving';

    return (
        <>
            <Navbar />
            <CartSidebar />
            <main style={{ paddingTop: '64px', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
                {/* Visual Foundation: Editorial Kitchen Photograph */}
                <motion.div
                    layout
                    transition={layoutTransition}
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: hasSearched ? '180px' : '100%',
                        zIndex: 0,
                        pointerEvents: 'none',
                        overflow: 'hidden',
                        ...getImageStyle(),
                        transition: 'opacity 0.4s ease, height 0.4s ease, filter 0.4s ease',
                    }}
                >
                    <img
                        src="/kitchen.png"
                        alt="Kitchen countertop visual centerpiece"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            objectPosition: '35% 65%',
                        }}
                    />
                    {/* Natural morning light simulation overlay entering from the left */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(105deg, rgba(255, 248, 235, 0.08) 0%, transparent 60%)',
                        pointerEvents: 'none',
                    }} />
                    {/* Editorial Gradient Overlay to quietly transition edges */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: hasSearched 
                            ? 'linear-gradient(to bottom, transparent 60%, var(--bg-primary) 100%)'
                            : 'radial-gradient(circle at 50% 50%, rgba(245, 240, 232, 0.1) 0%, var(--bg-primary) 100%)',
                    }} />
                </motion.div>

                <div className="shop-container" style={{ padding: '24px', maxWidth: '820px', position: 'relative', zIndex: 1 }}>
                    <motion.div
                        layout
                        transition={layoutTransition}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: hasSearched ? 'flex-start' : 'center',
                            minHeight: hasSearched ? 'auto' : 'calc(80vh - 64px)',
                            paddingTop: hasSearched ? '20px' : '0px',
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {/* Header Section */}
                        <AnimatePresence>
                            {!hasSearched && !isPendingTransition && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                    style={{
                                        textAlign: 'center',
                                        marginBottom: isFocused ? '28px' : '36px',
                                        width: '100%',
                                        y: isFocused ? -4 : 0,
                                        transition: 'y 0.35s ease',
                                    }}
                                >
                                    <motion.h1
                                        layout="position"
                                        style={{
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 500,
                                            fontSize: '2.0rem',
                                            color: 'var(--accent)',
                                            marginBottom: '4px',
                                            letterSpacing: '-0.015em',
                                        }}
                                    >
                                        Meal Planner
                                    </motion.h1>
                                    <motion.p
                                        layout="position"
                                        className="text-muted"
                                        style={{
                                            fontFamily: 'var(--font-body)',
                                            fontSize: '1.0rem',
                                            maxWidth: '540px',
                                            margin: '12px auto 0',
                                            lineHeight: '1.5',
                                            transition: 'opacity 0.35s ease',
                                            opacity: isFocused ? 0.7 : 1,
                                        }}
                                    >
                                        Tell me what you want to cook or need — I&apos;ll find the ingredients from nearby shops and fill your cart automatically.
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Sticky Search Surface (Choreographed protaganist) */}
                        <motion.div
                            layout
                            transition={searchTransition}
                            className="meal-search-container"
                            style={{
                                width: '100%',
                                maxWidth: '680px',
                                margin: hasSearched ? '0 0 16px 0' : '80px auto 28px', // Seated precisely on the countertop
                                borderRadius: '24px',
                                border: `1px solid ${isFocused ? 'rgba(31, 61, 43, 0.2)' : 'rgba(31, 61, 43, 0.05)'}`,
                                background: 'rgba(247, 243, 234, 0.92)', // Tactile frosted parchment
                                backdropFilter: 'blur(12px)',
                                boxShadow: isFocused
                                    ? '0 20px 50px rgba(31, 61, 43, 0.06), 0 4px 12px rgba(31, 61, 43, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
                                    : '0 12px 40px rgba(31, 61, 43, 0.03), 0 2px 6px rgba(31, 61, 43, 0.01), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
                                padding: hasSearched ? '12px 18px' : '20px 24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                cursor: 'text',
                                y: isFocused && !hasSearched ? -2 : 0, // Lift subtly on focus
                                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}
                        >
                            <div style={{ position: 'relative', width: '100%' }}>
                                <textarea
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                    rows={hasSearched ? 2 : (isFocused || prompt.trim() ? 3 : 1)}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    style={{
                                        width: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        resize: 'none',
                                        fontSize: '1.05rem',
                                        lineHeight: '1.5',
                                        fontFamily: 'var(--font-body)',
                                        color: 'var(--text-primary)',
                                        position: 'relative',
                                        zIndex: 2,
                                        caretColor: 'var(--accent)',
                                        transition: 'height 0.35s ease',
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSubmit();
                                        }
                                    }}
                                />
                                <AnimatePresence mode="wait">
                                    {!prompt && (
                                        <motion.div
                                            key={placeholderIndex}
                                            initial={{ opacity: 0, y: 2 }}
                                            animate={{ opacity: isFocused ? 0 : 0.45, y: 0 }}
                                            exit={{ opacity: 0, y: -2 }}
                                            transition={{ duration: 0.35 }}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                fontSize: '1.05rem',
                                                lineHeight: '1.5',
                                                fontFamily: 'var(--font-body)',
                                                color: 'var(--text-primary)',
                                                pointerEvents: 'none',
                                                zIndex: 1,
                                            }}
                                        >
                                            {placeholders[placeholderIndex]}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', borderTop: '1px solid rgba(28, 27, 25, 0.04)', paddingTop: '10px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {loading && transitionStage === 'loading' && (
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {getLoadingMessage()}
                                        </span>
                                    )}
                                </div>
                                <motion.button
                                    type="button"
                                    disabled={loading || !prompt.trim()}
                                    onClick={() => handleSubmit()}
                                    whileTap={{ scale: 0.96 }}
                                    style={{
                                        background: 'transparent',
                                        color: prompt.trim() ? 'var(--accent)' : 'var(--text-muted)',
                                        border: 'none',
                                        padding: '4px 12px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: prompt.trim() ? 'pointer' : 'default',
                                        transition: 'color 0.2s ease',
                                    }}
                                    onMouseEnter={e => { if (prompt.trim()) e.currentTarget.style.color = 'var(--cta)'; }}
                                    onMouseLeave={e => { if (prompt.trim()) e.currentTarget.style.color = 'var(--accent)'; }}
                                >
                                    Search
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Curated Suggestions (Fades out during transition) */}
                        <AnimatePresence>
                            {!hasSearched && !isPendingTransition && (
                                <motion.div
                                    initial={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ width: '100%', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
                                        {suggestionGroups.map((group, idx) => (
                                            <button
                                                key={group.name}
                                                type="button"
                                                onClick={() => setSuggestionGroupIndex(idx)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    fontSize: '0.72rem',
                                                    fontFamily: 'var(--font-mono)',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.05em',
                                                    textTransform: 'uppercase',
                                                    color: suggestionGroupIndex === idx ? 'var(--accent)' : 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    padding: '4px 0',
                                                    borderBottom: suggestionGroupIndex === idx ? '1px solid var(--accent)' : '1px solid transparent',
                                                    transition: 'color 0.2s, border-color 0.2s',
                                                }}
                                            >
                                                {group.name}
                                            </button>
                                        ))}
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={suggestionGroupIndex}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.25 }}
                                            style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}
                                        >
                                            {suggestionGroups[suggestionGroupIndex].items.map(item => (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    onClick={() => handleSuggestionClick(item)}
                                                    className="shop-suggestion-chip"
                                                >
                                                    {item}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Filters Toolbar - Revealed post-search with breathing space */}
                        <AnimatePresence>
                            {hasSearched && results && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ width: '100%', maxWidth: '680px', overflow: 'hidden' }}
                                >
                                    <div className="shop-filter-panel" style={{ marginTop: '12px', marginBottom: '24px', justifyContent: 'flex-start', borderTop: 'none' }}>
                                        <MultiSelectDropdown
                                            options={availableShops.map(shop => ({ value: shop._id, label: shop.name }))}
                                            selected={selectedShops}
                                            onChange={setSelectedShops}
                                            placeholder="All Shops"
                                            allLabel="All Shops"
                                            variant="minimal"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setNearbyOnly(!nearbyOnly)}
                                            className={`shop-toggle-pill ${nearbyOnly ? 'active' : ''}`}
                                            aria-label="Filter by nearby shops only"
                                            style={{ marginLeft: '12px' }}
                                        >
                                            <span className="shop-toggle-dot" />
                                            <span>Nearby Only</span>
                                        </button>

                                        {selectedShops.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedShops([])}
                                                className="shop-filter-clear-btn"
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Staged Loading State - Shows only after container positions */}
                        <AnimatePresence>
                            {loading && transitionStage === 'loading' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ textAlign: 'center', padding: '48px 0', width: '100%' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                                        {[0, 1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="ai-thinking-dot"
                                                style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    animationDelay: `${i * 0.15}s`,
                                                    background: 'var(--accent)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: 'var(--font-display)', marginBottom: '8px', color: 'var(--accent)' }}>
                                        {getLoadingMessage()}
                                    </p>
                                    <div style={{ maxWidth: '240px', margin: '0 auto', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '999px', height: '3px' }}>
                                        <div className="inference-progress" style={{ height: '100%', width: '60%', background: 'var(--accent)', borderRadius: '999px' }} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Progressive Reveal Results Section */}
                        <AnimatePresence>
                            {results && transitionStage === 'done' && !loading && (
                                <motion.div
                                    key="results"
                                    variants={resultsContainerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    style={{ width: '100%', marginTop: '40px' }} // Added generous breathing vertical rhythm space
                                >
                                    {/* Fallback Banner */}
                                    {results.fallback && (
                                        <motion.div variants={itemVariants} style={{ background: 'color-mix(in srgb, var(--ai) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--ai) 25%, transparent)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: 'var(--ai)', display: 'flex', gap: 8, alignItems: 'center' }}>
                                            AI is currently busy — showing keyword-based matches instead. Results may be broader.
                                        </motion.div>
                                    )}

                                    {/* Success Cue & Summary */}
                                    <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                                                ✓ Everything you need is ready
                                            </div>
                                            <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)', margin: 0 }}>
                                                Found {results.cartItems.length} ingredient{results.cartItems.length !== 1 ? 's' : ''}
                                            </h2>
                                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                                                {results.notFound.length > 0 ? `${results.notFound.length} missing from nearby shops` : 'All items matched successfully'}
                                                {results.modelUsed && ` · via ${results.modelUsed}`}
                                            </p>
                                        </div>
                                        {results.cartItems.length > 0 && (
                                            <button
                                                className="shop-product-add-btn"
                                                onClick={addSelectedToCart}
                                                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                            >
                                                Add {selected.size} to Cart
                                            </button>
                                        )}
                                    </motion.div>

                                    {/* List of matched items */}
                                    <motion.div variants={itemVariants} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                        {results.cartItems.map((item, index) => {
                                            const isChecked = selected.has(index);
                                            return (
                                                <div
                                                    key={index}
                                                    className="shop-product-card"
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        gap: '16px',
                                                        padding: '12px 16px',
                                                        height: 'auto',
                                                        cursor: 'pointer',
                                                        borderColor: isChecked ? 'var(--accent)' : 'var(--border)',
                                                        background: isChecked ? 'var(--bg-secondary)' : 'var(--bg-secondary)',
                                                        opacity: isChecked ? 1 : 0.7,
                                                        transition: 'border-color 0.15s, opacity 0.15s',
                                                    }}
                                                    onClick={() => toggleItem(index)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        readOnly
                                                        checked={isChecked}
                                                        style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }}
                                                    />
                                                    <div style={{ width: 44, height: 44, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                                                        {item.bestMatch.image ? (
                                                            <img src={item.bestMatch.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                        ) : (
                                                            <span style={{ fontSize: '1rem', opacity: 0.4, fontWeight: 700 }}>
                                                                {item.bestMatch.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                            {item.bestMatch.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                            Recipe: {item.ingredient.item} ({item.ingredient.amountText}) · from {item.bestMatch.shopId?.name || 'Local Shop'}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                        <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                            ₹{(item.bestMatch.price * item.ingredient.packsToBuy).toFixed(2)}
                                                        </div>
                                                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                                            {item.ingredient.packsToBuy} pack{item.ingredient.packsToBuy > 1 ? 's' : ''} (₹{item.bestMatch.price}/{item.bestMatch.unit})
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </motion.div>

                                    {/* Not Found Section */}
                                    {results.notFound.length > 0 && (
                                        <motion.div variants={itemVariants} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
                                            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                Not Available Nearby
                                            </h3>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {results.notFound.map((item: any) => (
                                                    <span key={item.item} className="shop-matched-chip" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                                                        {item.item} ({item.amountText})
                                                    </span>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>
        </>
    );
}
