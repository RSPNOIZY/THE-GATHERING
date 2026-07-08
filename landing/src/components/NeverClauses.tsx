const CLAUSES = [
  { code: 'NC_POLITICAL', text: 'No political campaigns, propaganda, or electoral manipulation' },
  { code: 'NC_SEXUAL', text: 'No sexual or adult content without explicit written consent' },
  { code: 'NC_WEAPONS', text: 'No weapons promotion, violence incitement, or military deception' },
  { code: 'NC_DECEPTION', text: 'No deepfakes, impersonation, or identity fraud' },
  { code: 'NC_HATE', text: 'No hate speech, discrimination, or targeted harassment' },
  { code: 'NC_TRANSFER', text: 'No sublicensing, unauthorized transfer, or rights stripping' },
  { code: 'NC_SURVEILLANCE', text: 'No biometric surveillance, tracking, or profiling' },
  { code: 'NC_SYSTEM_INTEGRITY', text: 'No synthesis without valid consent token' },
  { code: 'NC_SYSTEM_TRANSFER', text: 'No voice DNA export outside sovereign infrastructure' },
];

export function NeverClauses() {
  return (
    <section className="py-24 px-6 bg-noizy-surface/50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-noizy-burgundy/30 text-noizy-cream text-xs font-mono mb-4">
            CONSTITUTIONAL LAW
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-noizy-cream mb-4">
            The 9 Never Clauses
          </h2>
          <p className="text-noizy-text-dim max-w-xl mx-auto">
            These are not guidelines. They are immutable rules enforced in code.
            No API key, no amount of money, no business deal can override them.
          </p>
        </div>

        <div className="space-y-3">
          {CLAUSES.map((clause, i) => (
            <div
              key={clause.code}
              className="flex items-start gap-4 p-4 rounded-lg bg-noizy-bg border border-noizy-brown/20 hover:border-noizy-burgundy/40 transition-colors"
            >
              {/* Clause number badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-noizy-burgundy flex items-center justify-center">
                <span className="text-xs font-bold text-noizy-cream font-mono">
                  {i + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-noizy-cream text-sm font-medium">{clause.text}</div>
                <div className="text-noizy-text-muted text-xs font-mono mt-1">{clause.code}</div>
              </div>

              {/* Lock icon */}
              <svg className="w-4 h-4 text-noizy-burgundy flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
          ))}
        </div>

        <p className="text-center text-noizy-text-muted text-xs mt-8 font-mono">
          Enforced by HEAVEN v18 Consent Kernel &mdash; 52 tests, zero exceptions
        </p>
      </div>
    </section>
  );
}
