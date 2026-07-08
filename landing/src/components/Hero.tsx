'use client';

import { useState, useRef, useEffect } from 'react';
import { SignupModal } from './SignupModal';

const WAVEFORM_BARS = 40;

function WaveformVisualizer() {
  const bars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    const delay = (i * 0.04).toFixed(2);
    const height = 20 + Math.sin(i * 0.3) * 15 + Math.random() * 10;
    return (
      <div
        key={i}
        className="w-[2px] bg-noizy-amber/60 rounded-full animate-waveform"
        style={{
          height: `${height}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${1.2 + Math.random() * 0.8}s`,
        }}
      />
    );
  });

  return (
    <div className="flex items-center justify-center gap-[3px] h-16 opacity-40">
      {bars}
    </div>
  );
}

export function Hero() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const heroRef = useRef<HTMLDivElement>(null);

  // Track CTA visibility for analytics
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Analytics: hero_visible event
        }
      },
      { threshold: 0.5 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCTA = () => {
    if (email) {
      setShowModal(true);
    } else {
      // Focus the email input
      document.getElementById('hero-email')?.focus();
    }
  };

  return (
    <>
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
      >
        {/* Background gradient — burgundy to black */}
        <div className="absolute inset-0 bg-gradient-to-b from-noizy-burgundy/20 via-noizy-bg to-noizy-bg" />

        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Waveform above headline */}
          <div className="mb-8 animate-fade-in">
            <WaveformVisualizer />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up">
            <span className="text-noizy-cream">Your Voice.</span>
            <br />
            <span className="text-noizy-amber">Your Rules.</span>
            <br />
            <span className="text-noizy-cream">Your Royalties.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-noizy-text-dim max-w-2xl mx-auto mb-10 animate-slide-up"
            style={{ animationDelay: '0.2s' }}>
            NOIZY.AI is consent-native voice infrastructure.
            Every voice is sovereign. Every use is consensual.
            Every artist gets <span className="text-noizy-amber font-bold">75%</span>.
          </p>

          {/* Email + CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto animate-slide-up"
            style={{ animationDelay: '0.4s' }}>
            <input
              id="hero-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCTA()}
              placeholder="your@email.com"
              className="w-full sm:flex-1 px-4 py-3 rounded-lg bg-noizy-surface border border-noizy-brown/50
                         text-noizy-cream placeholder:text-noizy-text-muted
                         focus:border-noizy-amber focus:ring-1 focus:ring-noizy-amber
                         transition-colors"
              aria-label="Email address"
            />
            <button
              onClick={handleCTA}
              className="w-full sm:w-auto px-8 py-3 rounded-lg font-semibold
                         bg-noizy-amber text-noizy-bg
                         hover:bg-noizy-cream hover:text-noizy-burgundy
                         transition-all duration-200
                         focus:ring-2 focus:ring-noizy-amber focus:ring-offset-2 focus:ring-offset-noizy-bg"
            >
              Protect My Voice
            </button>
          </div>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-noizy-text-muted animate-fade-in"
            style={{ animationDelay: '0.6s' }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-noizy-success" />
              9 Never Clauses
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-noizy-amber" />
              75% Artist Royalties
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-noizy-burgundy" />
              Canadian Sovereignty
            </span>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-5 h-5 text-noizy-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {showModal && (
        <SignupModal
          email={email}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
