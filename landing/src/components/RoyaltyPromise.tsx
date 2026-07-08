export function RoyaltyPromise() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-noizy-cream mb-4">
            The 75% Promise
          </h2>
          <p className="text-noizy-text-dim max-w-xl mx-auto">
            Most platforms take 50&ndash;80% of your earnings.
            We believe the person who owns the voice should own the economics.
          </p>
        </div>

        {/* Visual split */}
        <div className="max-w-lg mx-auto mb-12">
          {/* Artist bar */}
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-noizy-cream font-bold">Artist</span>
              <span className="text-noizy-amber font-mono font-bold text-2xl">75%</span>
            </div>
            <div className="h-8 rounded-lg bg-noizy-surface overflow-hidden">
              <div
                className="h-full rounded-lg bg-gradient-to-r from-noizy-amber to-noizy-cream/80"
                style={{ width: '75%' }}
              />
            </div>
          </div>

          {/* NOIZY bar */}
          <div className="mb-4">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-noizy-text-dim">NOIZY.AI</span>
              <span className="text-noizy-text-dim font-mono">15%</span>
            </div>
            <div className="h-4 rounded-lg bg-noizy-surface overflow-hidden">
              <div
                className="h-full rounded-lg bg-noizy-brown"
                style={{ width: '15%' }}
              />
            </div>
          </div>

          {/* Union bar */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-noizy-text-dim">Union Fund</span>
              <span className="text-noizy-text-dim font-mono">10%</span>
            </div>
            <div className="h-4 rounded-lg bg-noizy-surface overflow-hidden">
              <div
                className="h-full rounded-lg bg-noizy-burgundy"
                style={{ width: '10%' }}
              />
            </div>
          </div>
        </div>

        {/* Key points */}
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="p-4">
            <div className="text-3xl font-bold text-noizy-amber font-mono mb-2">30s</div>
            <div className="text-noizy-text-dim text-sm">Payout settlement time</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-noizy-amber font-mono mb-2">100%</div>
            <div className="text-noizy-text-dim text-sm">Transparent, auditable ledger</div>
          </div>
          <div className="p-4">
            <div className="text-3xl font-bold text-noizy-amber font-mono mb-2">&infin;</div>
            <div className="text-noizy-text-dim text-sm">Your estate earns forever</div>
          </div>
        </div>
      </div>
    </section>
  );
}
