export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 px-6 bg-noizy-bg border-t border-noizy-brown/10">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo / Name */}
          <div>
            <div className="text-xl font-bold text-noizy-cream tracking-wider">NOIZY.AI</div>
            <div className="text-xs text-noizy-text-muted mt-1">
              Consent is law. Build forward.
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-noizy-text-dim">
            <a href="#how-it-works" className="hover:text-noizy-amber transition-colors">
              How It Works
            </a>
            <a href="#never-clauses" className="hover:text-noizy-amber transition-colors">
              Never Clauses
            </a>
            <a href="https://github.com/RSPNOIZY/THE-GATHERING" target="_blank" rel="noopener noreferrer" className="hover:text-noizy-amber transition-colors">
              GitHub
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-noizy-brown/10 text-center text-xs text-noizy-text-muted">
          <p>&copy; {year} Robert Stephen Plowman / NOIZY.AI. All rights reserved.</p>
          <p className="mt-1">MC96ECO Universe &mdash; Human Voice Sovereignty Framework</p>
        </div>
      </div>
    </footer>
  );
}
