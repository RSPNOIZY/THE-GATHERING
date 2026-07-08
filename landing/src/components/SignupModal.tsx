'use client';

import { useState } from 'react';
import { submitSignup } from '@/lib/heaven';

interface SignupModalProps {
  email: string;
  onClose: () => void;
}

type Role = 'artist' | 'licensee' | 'curious';

const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'artist', label: 'Voice Artist', desc: 'I want to protect and monetize my voice' },
  { value: 'licensee', label: 'Licensee / Developer', desc: 'I want to license voices ethically' },
  { value: 'curious', label: 'Just Curious', desc: "I'm interested in voice sovereignty" },
];

export function SignupModal({ email, onClose }: SignupModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !role) return;

    setStatus('submitting');
    const result = await submitSignup({
      email,
      name: name.trim(),
      role,
      source: 'landing_hero_v1',
    });

    if (result.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(result.error || 'Something went wrong.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-noizy-surface border border-noizy-brown/30 rounded-2xl p-8 shadow-2xl animate-slide-up">

        {status === 'success' ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-noizy-success/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-noizy-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-noizy-cream mb-2">You&apos;re In.</h3>
            <p className="text-noizy-text-dim mb-6">
              Welcome to the sovereign voice revolution. We&apos;ll be in touch soon.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-noizy-amber text-noizy-bg font-semibold hover:bg-noizy-cream transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-noizy-cream">Almost there</h3>
              <p className="text-noizy-text-dim mt-1">Tell us a bit about yourself.</p>
            </div>

            {/* Email (pre-filled, read-only) */}
            <div className="mb-4">
              <label className="block text-xs text-noizy-text-muted mb-1 font-mono">EMAIL</label>
              <div className="px-4 py-2.5 rounded-lg bg-noizy-bg border border-noizy-brown/30 text-noizy-cream text-sm">
                {email}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label htmlFor="signup-name" className="block text-xs text-noizy-text-muted mb-1 font-mono">
                YOUR NAME
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-2.5 rounded-lg bg-noizy-bg border border-noizy-brown/30
                           text-noizy-cream placeholder:text-noizy-text-muted
                           focus:border-noizy-amber focus:ring-1 focus:ring-noizy-amber transition-colors"
              />
            </div>

            {/* Role selection */}
            <div className="mb-6">
              <label className="block text-xs text-noizy-text-muted mb-2 font-mono">I AM A...</label>
              <div className="space-y-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                      role === r.value
                        ? 'border-noizy-amber bg-noizy-amber/10 text-noizy-cream'
                        : 'border-noizy-brown/30 bg-noizy-bg text-noizy-text-dim hover:border-noizy-brown'
                    }`}
                  >
                    <div className="font-semibold text-sm">{r.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="mb-4 px-4 py-2 rounded-lg bg-noizy-danger/10 border border-noizy-danger/30 text-noizy-danger text-sm">
                {errorMessage}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !role || status === 'submitting'}
              className="w-full py-3 rounded-lg font-semibold transition-all
                         bg-noizy-amber text-noizy-bg
                         hover:bg-noizy-cream hover:text-noizy-burgundy
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === 'submitting' ? 'Securing your spot...' : 'Join the Revolution'}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-noizy-text-muted hover:text-noizy-cream transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
