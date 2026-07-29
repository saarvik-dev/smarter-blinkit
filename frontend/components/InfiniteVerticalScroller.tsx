'use client';

import { useState, useEffect } from 'react';

const phrases = [
    'Planning Dinner',
    'Finding Ingredients',
    'Comparing Nearby Stores',
    'Checking Availability',
    'Building Shopping Cart',
    'Finding Best Prices',
    'Healthy Alternatives',
    'AI Meal Planning',
    'Fast Checkout',
    '15 Minute Delivery'
];

// We triple the items to allow seamless infinite wrapping
const duplicatedPhrases = [...phrases, ...phrases, ...phrases];
const baseLength = phrases.length;

export default function InfiniteVerticalScroller() {
    const [{ index, hasTransition }, setScrollState] = useState({
        index: baseLength, // Start at the second set (index 10)
        hasTransition: true
    });

    useEffect(() => {
        // Scroll forward by one item every 2.5 seconds
        const interval = setInterval(() => {
            setScrollState(prev => ({
                index: prev.index + 1,
                hasTransition: true
            }));
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // When we reach the start of the third set, snap back to the second set
        if (index === baseLength * 2) {
            const snapTimer = setTimeout(() => {
                setScrollState({
                    index: baseLength,
                    hasTransition: false
                });
            }, 1200); // Matches the 1.2s CSS transition duration

            return () => clearTimeout(snapTimer);
        }
    }, [index]);

    const itemHeight = 56; // px
    // Center the active item in a 7-item viewport (slot 3)
    const translateY = -(index - 3) * itemHeight;

    return (
        <div className="hero-scroller-wrapper">
            <div className="scroll-rail-outer">
                {/* Arrow indicator - fixed in the vertical center of the rail container */}
                <div className="scroll-rail-arrow">
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ color: 'var(--accent)' }}
                    >
                        <path d="M3.5 2.5L9.5 6L3.5 9.5V2.5Z" />
                    </svg>
                </div>

                <div className="scroll-rail-container">
                    <div
                        className="scroll-rail-track"
                        style={{
                            transform: `translateY(${translateY}px)`,
                            transition: hasTransition ? 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                        }}
                    >
                        {duplicatedPhrases.map((phrase, idx) => {
                            const distance = Math.abs(idx - index);
                            let status = 'far';
                            if (distance === 0) status = 'active';
                            else if (distance === 1) status = 'adjacent';
                            else if (distance === 2) status = 'adjacent-two';

                            return (
                                <div
                                    key={idx}
                                    className={`scroll-rail-item ${status}`}
                                    style={{
                                        transition: hasTransition ? 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)' : 'none'
                                    }}
                                >
                                    {phrase}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                .hero-scroller-wrapper {
                    display: none;
                }
                
                @media (min-width: 992px) {
                    .hero-scroller-wrapper {
                        display: flex;
                        justify-content: flex-end;
                        align-items: center;
                        opacity: 0.98;
                        width: 100%;
                        align-self: start;
                        margin-top: 20px; /* Aligns top of scroller with top of hero headline */
                    }
                }

                .scroll-rail-outer {
                    position: relative;
                    padding-left: 44px;
                    display: flex;
                    align-items: center;
                }

                .scroll-rail-container {
                    position: relative;
                    height: 392px; /* 7 items * 56px height */
                    overflow: hidden;
                    width: 340px;
                    mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
                    -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
                }

                .scroll-rail-track {
                    display: flex;
                    flex-direction: column;
                    will-change: transform;
                }

                  .scroll-rail-item {
                    height: 56px;
                    display: flex;
                    align-items: center;
                    font-family: var(--font-body);
                    font-size: 1.15rem;
                    color: var(--text-secondary);
                    opacity: 0.24;
                    transform: scale(0.9);
                    transform-origin: left center;
                    will-change: transform, opacity, font-weight;
                }

                .scroll-rail-item.active {
                    color: var(--text-primary);
                    opacity: 1;
                    transform: scale(1.1);
                    font-weight: 700;
                }

                .scroll-rail-item.adjacent {
                    color: var(--text-secondary);
                    opacity: 0.65;
                    transform: scale(0.98);
                    font-weight: 600;
                }

                .scroll-rail-item.adjacent-two {
                    color: var(--text-secondary);
                    opacity: 0.44;
                    transform: scale(0.94);
                    font-weight: 500;
                }

                .scroll-rail-arrow {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    display: flex;
                    align-items: center;
                    color: var(--accent);
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
