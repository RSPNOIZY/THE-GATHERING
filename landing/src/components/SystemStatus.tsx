'use client';

import { useState, useEffect } from 'react';
import { getHealthStatus } from '@/lib/heaven';

export function SystemStatus() {
  const [alive, setAlive] = useState<boolean | null>(null);
  const [version, setVersion] = useState('');

  useEffect(() => {
    getHealthStatus().then(({ alive, version }) => {
      setAlive(alive);
      setVersion(version);
    });
  }, []);

  return (
    <section className="py-12 px-6 border-t border-noizy-brown/20">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-8 text-xs text-noizy-text-muted font-mono">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            alive === null ? 'bg-noizy-text-muted animate-pulse' :
            alive ? 'bg-noizy-success' : 'bg-noizy-danger'
          }`} />
          <span>
            HEAVEN {alive === null ? 'checking...' : alive ? `${version} operational` : 'offline'}
          </span>
        </div>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">9 Never Clauses enforced</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">Canadian sovereignty</span>
      </div>
    </section>
  );
}
