'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import CartSidebar from '@/components/CartSidebar';
import ProductCarousel from '@/components/ProductCarousel';
import { useApp } from '@/lib/context';
import MultiSelectDropdown from '@/components/MultiSelectDropdown';
import { fadeUp, staggerContainer } from '@/lib/animations';

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
        if (stock <= 5) return <span className="stock-chip" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>{stock} left</span>;
        if (stock <= 15) return <span className="stock-chip medium" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>{stock} left</span>;
        return null;
    };

    useEffect(() => {
        // Fetch all shops for the filter dropdown
        api.get('/shops/all').then((r) => setAvailableShops(r.data.shops || [])).catch(() => { });
        // Fetch dynamic categories
        api.get('/products/categories').then((r) => setCategoriesList(r.data.categories || [])).catch(() => { });
    }, [api]);

    const doSearch = async (q: string, cats: string[], shops: string[], nearby: boolean) => {
        setLoading(true); setExpandedKeywords([]);
        try {
            const lat = user?.location?.coordinates?.[1];
            const lng = user?.location?.coordinates?.[0];
            const catParam = cats.join(',');
            const shopParam = shops.join(',');
            // When specific shops are selected, bypass the nearby filter
            const effectiveNearby = shops.length > 0 ? false : nearby;

            if (searchMode === 'intent' && q) {
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
    };

    // Live sync search: Trigger doSearch whenever dependencies change, with a 300ms debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            doSearch(query, categories, selectedShops, nearbyOnly);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, categories, selectedShops, searchMode, nearbyOnly, user]);

    const handleSearch = (e: React.FormEvent) => { e.preventDefault(); doSearch(query, categories, selectedShops, nearbyOnly); };

    return (
        <>
            <Navbar />
            <CartSidebar />
            <main style={{ paddingTop: '64px', minHeight: '100vh' }}>
                {/* Search Header */}
                <motion.div variants={fadeUp} initial="hidden" animate="visible"
                    style={{ padding: '36px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div className="container">
                        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 500, marginBottom: '4px' }}>Shop</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.85rem' }}>
                            {searchMode === 'intent' ? 'Describe what you need in natural language' : 'Search products by name'}
                        </p>

                        {/* Search Mode Toggle */}
                        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', width: 'fit-content' }}>
                            <button onClick={() => setSearchMode('text')}
                                style={{ padding: '6px 16px', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.3px', background: searchMode === 'text' ? 'var(--accent)' : 'transparent', color: searchMode === 'text' ? '#F5F0E8' : 'var(--text-muted)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                Text
                            </button>
                            <button onClick={() => setSearchMode('intent')}
                                style={{ padding: '6px 16px', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '0.3px', background: searchMode === 'intent' ? 'var(--ai)' : 'transparent', color: searchMode === 'intent' ? '#1C1B19' : 'var(--text-muted)', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                                Natural
                            </button>
                        </div>

                        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="search-bar" style={{ width: '100%' }}>
                                <input
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder={searchMode === 'intent' ? 'e.g. "I have a cold" or "movie night snacks"' : 'Search products… (auto updates)'}
                                />
                                <button type="submit" className="search-btn">Search</button>
                            </div>

                            {/* Filter Row */}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginRight: '4px' }}>Filters</span>

                                <MultiSelectDropdown
                                    options={categoriesList.map(cat => ({ value: cat, label: cat }))}
                                    selected={categories}
                                    onChange={setCategories}
                                    placeholder="All Categories"
                                    allLabel="All Categories"
                                />

                                <MultiSelectDropdown
                                    options={availableShops.map(shop => ({ value: shop._id, label: shop.name }))}
                                    selected={selectedShops}
                                    onChange={setSelectedShops}
                                    placeholder="All Shops"
                                    allLabel="All Shops"
                                />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                                    <input type="checkbox" id="nearbyOnly" checked={nearbyOnly} onChange={e => setNearbyOnly(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                    <label htmlFor="nearbyOnly" style={{ fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer' }}>Nearby Only</label>
                                </div>

                                {(categories.length > 0 || selectedShops.length > 0) && (
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setCategories([]); setSelectedShops([]); }}>Clear</button>
                                )}
                            </div>
                        </form>

                        {/* AI expanded keywords — uses gold accent for genuine AI output */}
                        {expandedKeywords.length > 0 && (
                            <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>Matched:</span>
                                {expandedKeywords.map(k => <span key={k} style={{ fontSize: '0.78rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(212,160,23,0.1)', color: 'var(--ai)', fontWeight: 500 }}>{k}</span>)}
                                {intentModelUsed && (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', opacity: 0.6, marginLeft: '4px' }}>
                                        via {intentModelUsed}
                                    </span>
                                )}
                            </div>
                        )}
                        {/* Live result count */}
                        {products.length > 0 && !loading && (
                            <div style={{ marginTop: '12px' }}>
                                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                                    {products.length} products
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
                <div className="container" style={{ padding: '28px 24px' }}>
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ textAlign: 'center', padding: '80px' }}>
                                <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 16px' }} />
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Finding products…</p>
                            </motion.div>
                        ) : products.length === 0 ? (
                            <motion.div key="empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <div className="empty-state">
                                    <div className="empty-state-title">No products found</div>
                                    <div className="empty-state-hint">Try a different search term, adjust your filters, or disable &quot;Nearby Only&quot; to see more results.</div>
                                </div>
                            </motion.div>
                        ) : selectedShops.length === 1 ? (
                            /* Single Shop View - Professional Grid */
                            <motion.div key="single" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                            <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-display)', fontWeight: 500, margin: 0 }}>{products[0]?.shopId?.name || 'Local Shop'}</h2>
                                            {products[0]?.distance !== undefined && (
                                                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: products[0].distance > 50 ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                    {products[0].distance < 1 ? '< 1 km' : `${Math.round(products[0].distance)} km`}
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{products.length} products</p>
                                    </div>
                                    <button onClick={() => setSelectedShops([])} className="btn btn-ghost btn-sm">← All shops</button>
                                </div>
                                <div className="product-grid">
                                    {products.map(p => (
                                        <div key={p._id} className={`product-card${p.stock === 0 ? ' out-of-stock' : ''}`}>
                                            <Link href={`/shop/${p._id}`}>
                                                <div className="product-card-image">
                                                    {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{p.category?.charAt(0)}</span>}
                                                </div>
                                                <div className="product-card-body">
                                                    <div className="product-card-name" style={{ height: '3rem', overflow: 'hidden' }}>{p.name}</div>
                                                    {stockChip(p.stock) && <div style={{ marginBottom: '4px' }}>{stockChip(p.stock)}</div>}
                                                    <div className="product-card-footer">
                                                        <div>
                                                            <div className="product-card-price" style={{ fontFamily: 'var(--font-mono)' }}>₹{p.price}</div>
                                                            <div className="product-card-unit">per {p.unit}</div>
                                                        </div>
                                                        <button
                                                            disabled={p.stock === 0}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (!user) { toast('Please login to add to cart', 'error'); return; }
                                                                addToCart({ productId: p._id, name: p.name, price: p.price, quantity: 1, image: p.image, shopId: p.shopId?._id, shopName: p.shopId?.name });
                                                            }}
                                                            className="btn btn-primary btn-sm"
                                                        >
                                                            {p.stock === 0 ? 'N/A' : 'Add'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
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

                                // Derive trending from products already loaded (frontend-only ranking)
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

                                // Light post-sort shuffle
                                const lightlyShuffledTrending = [...scoredTrending];
                                for (let i = 0; i < lightlyShuffledTrending.length - 1; i += 1) {
                                    if (Math.random() < 0.28) {
                                        const temp = lightlyShuffledTrending[i];
                                        lightlyShuffledTrending[i] = lightlyShuffledTrending[i + 1];
                                        lightlyShuffledTrending[i + 1] = temp;
                                    }
                                }

                                const trendingProducts = lightlyShuffledTrending.slice(0, 8);

                                const renderProductCard = (p: any, compact = false) => (
                                    <div key={p._id} className={`product-card${p.stock === 0 ? ' out-of-stock' : ''}`} style={{ width: compact ? '190px' : '230px' }}>
                                        <Link href={`/shop/${p._id}`}>
                                            <div className="product-card-image">
                                                {p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{p.category?.charAt(0)}</span>}
                                            </div>
                                            <div className="product-card-body" style={{ padding: '12px 14px' }}>
                                                <div className="product-card-name" style={{ fontSize: '0.88rem', height: '2.4rem', overflow: 'hidden' }}>{p.name}</div>
                                                {stockChip(p.stock) && <div style={{ marginBottom: '4px' }}>{stockChip(p.stock)}</div>}
                                                <div className="product-card-footer" style={{ marginTop: '8px' }}>
                                                    <div>
                                                        <div className="product-card-price" style={{ fontFamily: 'var(--font-mono)' }}>₹{p.price}</div>
                                                        <div className="product-card-unit">per {p.unit}</div>
                                                    </div>
                                                    <button
                                                        disabled={p.stock === 0}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (!user) { toast('Please login to add to cart', 'error'); return; }
                                                            addToCart({ productId: p._id, name: p.name, price: p.price, quantity: 1, image: p.image, shopId: p.shopId?._id, shopName: p.shopId?.name });
                                                        }}
                                                        className="btn btn-primary btn-sm"
                                                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                                    >
                                                        {p.stock === 0 ? 'N/A' : 'Add'}
                                                    </button>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );

                                return (
                                    <>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.82rem' }}>
                                            Results from {sortedShops.length} shop{sortedShops.length !== 1 ? 's' : ''}
                                        </p>

                                        {/* ── Popular picks: only shown on landing (no active search) ── */}
                                        {!query.trim() && trendingProducts.length > 0 && (
                                            <div style={{ marginBottom: '48px' }}>
                                                <div style={{ marginBottom: '14px' }}>
                                                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.1rem', margin: 0 }}>Popular Near You</h3>
                                                </div>
                                                <ProductCarousel>
                                                    {trendingProducts.map(p => renderProductCard(p, true))}
                                                </ProductCarousel>
                                            </div>
                                        )}

                                        {/* ── Per-shop rows ── */}
                                        {sortedShops.map(({ shop, products: shopProducts }) => {
                                            const dist = shop.distance;
                                            const deliveryMins = dist !== undefined ? Math.round(10 + dist * 3) : 15;

                                            return (
                                                <div key={shop._id || 'local'} style={{ marginBottom: '48px' }}>
                                                    {/* Shop header — clean, editorial */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                                                        <div>
                                                            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.05rem', margin: 0, marginBottom: '4px' }}>{shop.name}</h3>
                                                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.3px' }}>
                                                                {dist !== undefined && (
                                                                    <span>{dist < 1 ? '< 1 km' : `${Math.round(dist)} km`}</span>
                                                                )}
                                                                <span>~{deliveryMins} min</span>
                                                                <span>{shopProducts.length} products</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSelectedShops([shop._id])}
                                                            className="btn btn-ghost btn-sm"
                                                            style={{ fontWeight: 500, fontSize: '0.78rem' }}
                                                        >
                                                            View all →
                                                        </button>
                                                    </div>

                                                    {/* Product carousel */}
                                                    <ProductCarousel>
                                                        {shopProducts.map(p => renderProductCard(p))}
                                                    </ProductCarousel>
                                                </div>
                                            );
                                        })}
                                    </>
                                );
                            })()
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </>
    );
}
