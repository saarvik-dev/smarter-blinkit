'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';
import ProductCarousel from '@/components/ProductCarousel';
import { useApp } from '@/lib/context';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';

// Heuristically detect search intent
const detectSearchMode = (q: string): 'text' | 'intent' => {
    const trimmed = q.trim();
    if (!trimmed) return 'text';
    const words = trimmed.split(/\s+/);
    const hasIntentKeywords = /need|want|have|cook|make|recipe|party|movie|breakfast|lunch|dinner|snack|sick|cold|cough|flu|sore|headache|pain|allergy|healthy|diet|weight|fit|gym|workout|energy|organic|fresh|local|italian|mexican|chinese|indian|spice|soup|salad|gift|party|holiday|christmas|diwali|festival|celebration|clean|wash|care/i.test(trimmed);
    return (words.length >= 3 || hasIntentKeywords) ? 'intent' : 'text';
};

export default function ShopPage() {
    const { api, addToCart, user, toast } = useApp();
    const [products, setProducts] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchMode, setSearchMode] = useState<'text' | 'intent'>('text');
    const [expandedKeywords, setExpandedKeywords] = useState<string[]>([]);
    const [intentModelUsed, setIntentModelUsed] = useState<string | null>(null);
    const [availableShops, setAvailableShops] = useState<any[]>([]);
    const [selectedShops, setSelectedShops] = useState<string[]>([]);
    const [categoriesList, setCategoriesList] = useState<string[]>([]);
    const [nearbyOnly, setNearbyOnly] = useState(true);

    /** Render a stock indicator based on remaining stock count */
    const stockChip = (stock: number) => {
        if (stock === 0) return <span className="stock-chip">Out of stock</span>;
        if (stock <= 5) return <span className="stock-chip">{stock} left</span>;
        if (stock <= 15) return <span className="stock-chip medium">{stock} left</span>;
        return null;
    };

    useEffect(() => {
        // Fetch all shops for the filter dropdown
        api.get('/shops/all').then((r) => setAvailableShops(r.data.shops || [])).catch(() => { });
        // Fetch dynamic categories
        api.get('/products/categories').then((r) => setCategoriesList(r.data.categories || [])).catch(() => { });
    }, [api]);

    const handleQueryChange = (val: string) => {
        setQuery(val);
        setSearchMode(detectSearchMode(val));
    };

    const doSearch = useCallback(async (q: string, cats: string[], shops: string[], nearby: boolean, modeOverride?: 'text' | 'intent') => {
        setLoading(true);
        setExpandedKeywords([]);
        try {
            const lat = user?.location?.coordinates?.[1];
            const lng = user?.location?.coordinates?.[0];
            const catParam = cats.join(',');
            const shopParam = shops.join(',');
            // When specific shops are selected, bypass the nearby filter
            const effectiveNearby = shops.length > 0 ? false : nearby;
            const activeMode = modeOverride || detectSearchMode(q);

            if (activeMode === 'intent' && q) {
                const { data } = await api.post('/ai/intent-search', { query: q, lat, lng, nearbyOnly: effectiveNearby, shopId: shopParam || undefined });
                let intentResults = data.results || [];
                // Frontend-side category filtering for AI results
                if (catParam) intentResults = intentResults.filter((r: any) => cats.some(c => r.product?.category?.toLowerCase() === c.toLowerCase()));
                setProducts(intentResults.map((r: any) => ({ ...r.product, distance: r.product.distance })));
                setExpandedKeywords(data.expandedKeywords || []);
                setIntentModelUsed(data.modelUsed || null);
            } else {
                const { data } = await api.get('/products/search', { params: { q, category: catParam, shopId: shopParam, limit: 500, lat, lng, nearbyOnly: effectiveNearby } });
                setProducts(data.products || []);
            }
        } catch { } finally { setLoading(false); }
    }, [api, user]);

    // Live sync search: Trigger doSearch whenever dependencies change, with a 300ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            doSearch(query, categories, selectedShops, nearbyOnly);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, categories, selectedShops, searchMode, nearbyOnly, user, doSearch]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(query, categories, selectedShops, nearbyOnly);
    };

    const handleSuggestionClick = (sq: string) => {
        setQuery(sq);
        const mode = detectSearchMode(sq);
        setSearchMode(mode);
        doSearch(sq, categories, selectedShops, nearbyOnly, mode);
    };

    const renderProductCard = (p: any, options: { compact?: boolean; inCarousel?: boolean } = {}) => {
        const { compact = false, inCarousel = false } = options;
        return (
            <div
                key={p._id}
                className={`shop-product-card${p.stock === 0 ? ' out-of-stock' : ''}${compact ? ' compact' : ''}`}
                style={{
                    width: compact ? '145px' : (inCarousel ? '180px' : '100%'),
                    flexShrink: inCarousel ? 0 : undefined,
                }}
            >
                <Link href={`/shop/${p._id}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div className="shop-product-image-wrap">
                        {stockChip(p.stock) && (
                            <div style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 10 }}>
                                {stockChip(p.stock)}
                            </div>
                        )}
                        {p.image ? (
                            <img src={p.image} alt={p.name} />
                        ) : (
                            <div className="shop-product-placeholder" style={{ background: 'var(--bg-elevated)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="shop-product-placeholder-letter" style={{ fontSize: '1.4rem', opacity: 0.4 }}>
                                    {p.category?.charAt(0).toUpperCase() || 'P'}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="shop-product-body">
                        <div className="shop-product-name" title={p.name}>
                            {p.name}
                        </div>
                        <div className="shop-product-footer">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="shop-product-price">₹{p.price}</span>
                                <span className="shop-product-unit">per {p.unit}</span>
                            </div>
                            <button
                                type="button"
                                disabled={p.stock === 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!user) { toast('Please login to add to cart', 'error'); return; }
                                    addToCart({ productId: p._id, name: p.name, price: p.price, quantity: 1, image: p.image, shopId: p.shopId?._id, shopName: p.shopId?.name });
                                    toast(`Added ${p.name} to cart`, 'success');
                                }}
                                className="shop-product-add-btn"
                            >
                                {p.stock === 0 ? 'N/A' : 'Add'}
                            </button>
                        </div>
                    </div>
                </Link>
            </div>
        );
    };

    const SkeletonCard = ({ compact = false }) => (
        <div className={`shop-product-card${compact ? ' compact' : ''}`} style={{ width: compact ? '145px' : '180px', flexShrink: 0, cursor: 'default' }}>
            <div className="shop-product-image-wrap shop-skeleton" />
            <div className="shop-product-body" style={{ gap: '8px' }}>
                <div className="shop-skeleton" style={{ width: '85%', height: '14px', borderRadius: 'var(--radius-sm)' }} />
                <div className="shop-skeleton" style={{ width: '50%', height: '10px', borderRadius: 'var(--radius-sm)' }} />
                <div className="shop-product-footer" style={{ marginTop: 'auto', paddingTop: '4px' }}>
                    <div style={{ width: '40%' }}>
                        <div className="shop-skeleton" style={{ width: '100%', height: '16px', borderRadius: 'var(--radius-sm)' }} />
                    </div>
                    <div className="shop-skeleton" style={{ width: '45px', height: '24px', borderRadius: '4px' }} />
                </div>
            </div>
        </div>
    );

    const SkeletonLoader = () => {
        const isSingleView = selectedShops.length === 1;
        return (
            <div style={{ width: '100%', padding: '12px 0' }}>
                {isSingleView ? (
                    <div>
                        <div className="shop-profile-banner" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '220px' }}>
                                <div className="shop-skeleton" style={{ width: '80%', height: '24px', borderRadius: 'var(--radius-sm)' }} />
                                <div className="shop-skeleton" style={{ width: '50%', height: '12px', borderRadius: 'var(--radius-sm)' }} />
                            </div>
                            <div className="shop-skeleton" style={{ width: '100px', height: '34px', borderRadius: '4px' }} />
                        </div>
                        <div className="product-grid" style={{ marginTop: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="shop-skeleton" style={{ width: '150px', height: '14px', marginBottom: '24px', borderRadius: 'var(--radius-sm)' }} />
                        {Array.from({ length: 2 }).map((_, rowIndex) => (
                            <div key={rowIndex} style={{ marginBottom: '56px' }}>
                                <div className="shop-section-bar">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '180px' }}>
                                        <div className="shop-skeleton" style={{ width: '90%', height: '18px', borderRadius: 'var(--radius-sm)' }} />
                                        <div className="shop-skeleton" style={{ width: '60%', height: '12px', borderRadius: 'var(--radius-sm)' }} />
                                    </div>
                                    <div className="shop-skeleton" style={{ width: '75px', height: '24px', borderRadius: 'var(--radius-sm)' }} />
                                </div>
                                <div style={{ display: 'flex', gap: '16px', overflowX: 'hidden' }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <Navbar />
            <CartSidebar />
            <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
                {/* Refined Hero Banner */}
                <div className="shop-hero">
                    <div className="shop-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h1 className="shop-hero-title">
                            Search products, meals and recipes naturally
                        </h1>
                        <p className="shop-hero-subtitle">
                            Connect with your neighborhood stores. Describe what you need in natural language or search by name to fill your cart instantly.
                        </p>

                        <form onSubmit={handleSearch} className="shop-search-wrapper">
                            <div className="shop-search-box">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.7 }}>
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                                <input
                                    value={query}
                                    onChange={e => handleQueryChange(e.target.value)}
                                    placeholder="Search products or describe your need (e.g. cold remedies, recipe ingredients)..."
                                />
                                {loading && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginRight: '4px' }}>
                                        {searchMode === 'intent' ? 'Understanding...' : 'Searching...'}
                                    </span>
                                )}
                                <button type="submit" className="search-btn">Search</button>
                            </div>
                        </form>

                        {/* Quiet Suggestions */}
                        <div className="shop-suggestions">
                            <span className="shop-suggestions-label">Try searching:</span>
                            {[
                                { label: 'Weekly Groceries', q: 'weekly groceries' },
                                { label: 'Healthy Breakfast', q: 'healthy breakfast oats' },
                                { label: 'Dinner for Four', q: 'make spaghetti for dinner' },
                                { label: 'Ingredients for Pasta', q: 'pasta with tomato sauce and cheese' },
                                { label: 'High Protein', q: 'high protein snacks and dairy' },
                                { label: 'Party Snacks', q: 'movie night snacks and sodas' }
                            ].map(item => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => handleSuggestionClick(item.q)}
                                    className="shop-suggestion-chip"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="shop-container" style={{ padding: '0 24px 24px 24px' }}>
                    {/* Lightweight Navigation Toolbar */}
                    <div className="shop-filter-panel">
                        <MultiSelectDropdown
                            options={categoriesList.map(cat => ({ value: cat, label: cat }))}
                            selected={categories}
                            onChange={setCategories}
                            placeholder="All Categories"
                            allLabel="All Categories"
                            variant="minimal"
                        />

                        <MultiSelectDropdown
                            options={availableShops.map(shop => ({ value: shop._id, label: shop.name }))}
                            selected={selectedShops}
                            onChange={setSelectedShops}
                            placeholder="All Shops"
                            allLabel="All Shops"
                            variant="minimal"
                        />

                        {/* Understated Accessibility-preserving Toggle Control */}
                        <button
                            type="button"
                            onClick={() => setNearbyOnly(!nearbyOnly)}
                            className={`shop-toggle-pill ${nearbyOnly ? 'active' : ''}`}
                            aria-label="Filter by nearby shops only"
                        >
                            <span className="shop-toggle-dot" />
                            <span>Nearby Only</span>
                        </button>

                        {(categories.length > 0 || selectedShops.length > 0 || !nearbyOnly) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCategories([]);
                                    setSelectedShops([]);
                                    setNearbyOnly(true);
                                }}
                                className="shop-filter-clear-btn"
                            >
                                Clear all ✕
                            </button>
                        )}
                    </div>

                    {/* Matched keywords — silent verification */}
                    {expandedKeywords.length > 0 && (
                        <div className="shop-matched-intent">
                            <span className="shop-matched-title">Searching for:</span>
                            {expandedKeywords.map(k => (
                                <span key={k} className="shop-matched-chip">
                                    {k}
                                </span>
                            ))}
                            {intentModelUsed && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto', opacity: 0.7 }}>
                                    via {intentModelUsed}
                                </span>
                            )}
                        </div>
                    )}

                    {products.length > 0 && !loading && (
                        <div style={{ margin: '12px 0 20px' }}>
                            <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Showing {products.length} products
                            </span>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <SkeletonLoader />
                            </motion.div>
                        ) : products.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '64px 24px',
                                    textAlign: 'center',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-xl)',
                                    maxWidth: '480px',
                                    margin: '40px auto',
                                    boxShadow: 'var(--shadow-sm)',
                                }}
                                >
                                    <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛒</div>
                                    <h3 style={{
                                        fontFamily: 'var(--font-display)',
                                        fontSize: '1.3rem',
                                        fontWeight: 600,
                                        color: 'var(--accent)',
                                        marginBottom: '6px',
                                    }}>
                                        No products found
                                    </h3>
                                    <p style={{
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.85rem',
                                        lineHeight: 1.5,
                                        marginBottom: '20px',
                                        maxWidth: '340px',
                                    }}>
                                        Try using different search terms, adjusting your active filters, or expanding your radius.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery('');
                                            setCategories([]);
                                            setSelectedShops([]);
                                            setNearbyOnly(true);
                                        }}
                                        style={{
                                            background: 'var(--accent)',
                                            color: '#F5F0E8',
                                            border: 'none',
                                            borderRadius: 'var(--radius-full)',
                                            padding: '8px 20px',
                                            fontSize: '0.825rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'var(--transition)',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-dim)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            </motion.div>
                        ) : selectedShops.length === 1 ? (
                            /* Single Shop View - Professional Grid */
                            <motion.div key="single" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <div className="shop-profile-banner">
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                            <h2 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--accent)', margin: 0 }}>
                                                {products[0]?.shopId?.name || 'Local Shop'}
                                            </h2>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                            {products[0]?.distance !== undefined && (
                                                <span>📍 {products[0].distance < 1 ? '< 1 km' : `${products[0].distance.toFixed(1)} km`} away</span>
                                            )}
                                            <span>•</span>
                                            <span>⚡ ~{products[0]?.distance !== undefined ? Math.round(10 + products[0].distance * 3) : 15} min</span>
                                            <span>•</span>
                                            <span>📦 {products.length} products</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedShops([])} className="shop-profile-back-btn">
                                        ← Back to all shops
                                    </button>
                                </div>
                                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
                                    {products.map(p => renderProductCard(p, { compact: false, inCarousel: false }))}
                                </div>
                            </motion.div>
                        ) : (
                            /* Multi-Shop Bucketed View */
                            (() => {
                                const shopsMap: Record<string, { shop: any, products: any[] }> = {};
                                products.forEach(p => {
                                    const sid = p.shopId?._id || 'local';
                                    if (!shopsMap[sid]) {
                                        shopsMap[sid] = {
                                            shop: p.shopId ? { ...p.shopId, distance: p.distance } : { name: 'Local Shop', distance: 0 },
                                            products: []
                                        };
                                    }
                                    shopsMap[sid].products.push(p);
                                });
                                const sortedShops = Object.values(shopsMap).sort((a, b) => (a.shop.distance || 0) - (b.shop.distance || 0));

                                // Derive trending from products loaded
                                const scoredTrending = products
                                    .filter(p => p.stock > 0)
                                    .map((p, index) => {
                                        const safePrice = Math.max(Number(p.price) || 1, 1);
                                        const priceScore = 1 / safePrice;
                                        const recencyScore = (products.length - index) / Math.max(products.length, 1);
                                        const trendingScore = Math.random() * 0.5 + priceScore * 0.2 + recencyScore * 0.3;
                                        return { ...p, trendingScore };
                                    })
                                    .sort((a, b) => b.trendingScore - a.trendingScore);

                                const lightlyShuffledTrending = [...scoredTrending];
                                for (let i = 0; i < lightlyShuffledTrending.length - 1; i += 1) {
                                    if (Math.random() < 0.28) {
                                        const temp = lightlyShuffledTrending[i];
                                        lightlyShuffledTrending[i] = lightlyShuffledTrending[i + 1];
                                        lightlyShuffledTrending[i + 1] = temp;
                                    }
                                }

                                const trendingProducts = lightlyShuffledTrending.slice(0, 8);

                                return (
                                    <motion.div key="multi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {/* Trending Section */}
                                        {!query.trim() && trendingProducts.length > 0 && (
                                            <div style={{ marginBottom: '56px' }}>
                                                <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                                                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem', color: 'var(--accent)', margin: '0 0 4px 0' }}>
                                                        Popular Near You
                                                    </h3>
                                                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
                                                        Curated from nearby stores
                                                    </span>
                                                </div>
                                                <ProductCarousel>
                                                    {trendingProducts.map(p => renderProductCard(p, { compact: true, inCarousel: true }))}
                                                </ProductCarousel>
                                            </div>
                                        )}

                                        {/* Per-shop Rows */}
                                        {sortedShops.map(({ shop, products: shopProducts }) => {
                                            const dist = shop.distance;
                                            const deliveryMins = dist !== undefined ? Math.round(10 + dist * 3) : 15;

                                            return (
                                                <div key={shop._id || 'local'} style={{ marginBottom: '64px' }}>
                                                    <div className="shop-section-bar">
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <h3 className="shop-section-title">
                                                                {shop.name}
                                                            </h3>
                                                            <div className="shop-section-meta-row">
                                                                {dist !== undefined && (
                                                                    <span>📍 {dist < 1 ? '< 1 km' : `${dist.toFixed(1)} km`} away</span>
                                                                )}
                                                                <span>•</span>
                                                                <span>⚡ ~{deliveryMins} min delivery</span>
                                                                <span>•</span>
                                                                <span>📦 {shopProducts.length} items available</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedShops([shop._id])}
                                                            className="shop-section-browse-btn"
                                                        >
                                                            Browse Shop →
                                                        </button>
                                                    </div>

                                                    <ProductCarousel>
                                                        {shopProducts.map(p => renderProductCard(p, { compact: false, inCarousel: true }))}
                                                    </ProductCarousel>
                                                </div>
                                            );
                                        })}
                                    </motion.div>
                                );
                            })()
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}
