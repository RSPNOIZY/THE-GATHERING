export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Register Your Voice',
      desc: 'Upload your voice DNA. We create a cryptographic fingerprint that proves ownership forever.',
      detail: 'Stored in R2 with C2PA watermarking. Your voice, your sovereign property.',
    },
    {
      number: '02',
      title: 'Set Your Terms',
      desc: 'Choose exactly how your voice can be used. Set never clauses. Define jurisdictions.',
      detail: 'Consent tokens are cryptographic proof. No one can use your voice without one.',
    },
    {
      number: '03',
      title: 'Get Paid — 75%',
      desc: 'Every time your voice is synthesized, you earn 75% of the gross. Automatically.',
      detail: 'Settled in seconds, not months. Transparent ledger you can audit anytime.',
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-noizy-cream mb-4 text-center">
          How It Works
        </h2>
        <p className="text-noizy-text-dim text-center mb-16 max-w-xl mx-auto">
          Three steps from unprotected voice to sovereign, earning asset.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative p-6 rounded-xl bg-noizy-surface border border-noizy-brown/20 hover:border-noizy-amber/30 transition-colors group"
            >
              {/* Step number */}
              <div className="text-5xl font-extrabold text-noizy-amber/20 group-hover:text-noizy-amber/40 transition-colors mb-4 font-mono">
                {step.number}
              </div>

              <h3 className="text-xl font-bold text-noizy-cream mb-2">{step.title}</h3>
              <p className="text-noizy-text-dim text-sm mb-3">{step.desc}</p>
              <p className="text-noizy-text-muted text-xs">{step.detail}</p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-noizy-amber/0 group-hover:bg-noizy-amber/30 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
