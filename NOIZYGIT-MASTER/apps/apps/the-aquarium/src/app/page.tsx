import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020408] text-[#c8cad8]">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6">
        <h1 className="font-serif text-[clamp(3rem,12vw,8rem)] font-black tracking-[0.12em] leading-none bg-gradient-to-b from-[#e8dcc8] via-[#d4a017] to-[#8b7355] bg-clip-text text-transparent">
          NOIZY<span className="text-[#d4a017]">.</span>ai
        </h1>
        <p className="mt-4 text-lg tracking-[0.3em] uppercase text-[rgba(200,196,188,0.3)] font-light">
          Human Voice Sovereignty
        </p>
        <div className="mt-8 text-sm text-[rgba(200,202,216,0.25)] leading-relaxed font-mono">
          consent as executable code<br />
          provenance as default<br />
          revocation as sacred<br />
          compensation as automatic
        </div>
        <div className="mt-12 flex gap-4 flex-wrap justify-center">
          <Link href="/mirror" className="px-8 py-3 rounded-lg bg-[rgba(106,64,255,0.1)] border border-[rgba(106,64,255,0.2)] text-[rgba(106,64,255,0.8)] font-semibold tracking-wider hover:bg-[rgba(106,64,255,0.2)] transition-all">
            Enter the Mirror
          </Link>
          <Link href="/gospel" className="px-8 py-3 rounded-lg bg-[rgba(212,160,23,0.06)] border border-[rgba(212,160,23,0.12)] text-[rgba(212,160,23,0.5)] font-semibold tracking-wider hover:bg-[rgba(212,160,23,0.15)] transition-all">
            Read the Gospel
          </Link>
        </div>
      </section>

      {/* What NOIZY Is */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
        <h2 className="font-serif text-3xl font-bold text-[rgba(240,236,230,0.9)] tracking-wide mb-6">
          You won&apos;t believe the sounds that are coming.
        </h2>
        <p className="text-lg text-[rgba(200,202,216,0.45)] leading-relaxed">
          NOIZY.AI helps artists turn feeling into direction — with clarity, authorship, and control.
          This is not a machine that replaces creators.
          It is a creative rig built to help them see further, move faster, and stay in command of the work.
        </p>
      </section>

      {/* Three Principles */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Expand", desc: "Build tools that increase what an artist can do in a day.", color: "#00ff88" },
            { title: "Empower", desc: "The artist stays the author. The AI is the rig, not the replacement.", color: "#6e40ff" },
            { title: "Protect", desc: "Creator commerce must be legible, consent-based, and fair by default.", color: "#d4a017" },
          ].map((p) => (
            <div key={p.title} className="bg-[rgba(8,10,16,0.7)] border border-[rgba(40,42,56,0.5)] rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="font-serif text-xl font-bold mb-3" style={{ color: p.color }}>{p.title}</h3>
              <p className="text-sm text-[rgba(200,202,216,0.4)] leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mirror */}
      <section className="py-24 px-6 max-w-3xl mx-auto text-center">
        <h2 className="font-serif text-3xl font-bold text-[rgba(240,236,230,0.9)] tracking-wide mb-6">
          Mirror comes first.
        </h2>
        <p className="text-[rgba(200,202,216,0.45)] leading-relaxed mb-8">
          Because artists deserve tools that explain, not override.
          Mirror helps you understand the path forward without taking the work away from you.
        </p>
        <Link href="/mirror" className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-[rgba(106,64,255,0.15)] to-[rgba(191,64,255,0.15)] border border-[rgba(106,64,255,0.3)] text-[rgba(200,196,240,0.8)] font-bold tracking-wider text-lg hover:scale-105 transition-transform">
          Enter the DreamChamber
        </Link>
      </section>

      {/* The Standard */}
      <section className="py-24 px-6 max-w-3xl mx-auto">
        <div className="bg-[rgba(212,160,23,0.03)] border border-[rgba(212,160,23,0.1)] rounded-2xl p-8 text-center">
          <p className="font-serif text-2xl font-bold text-[#d4a017] tracking-wide">
            The Plowman Standard
          </p>
          <p className="mt-4 text-5xl font-black text-[rgba(240,236,230,0.9)]">75 / 25</p>
          <p className="mt-2 text-sm text-[rgba(200,196,188,0.3)]">Creator / Platform — Always. By architecture.</p>
        </div>
      </section>

      {/* Brands */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <h2 className="font-serif text-2xl font-bold text-center text-[rgba(240,236,230,0.7)] tracking-wide mb-8">The Empire</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { name: "NOIZY.AI", desc: "Consent infrastructure", color: "#6e40ff" },
            { name: "NOIZYVOX", desc: "Voice DNA registry", color: "#00d4ff" },
            { name: "NOIZYFISH", desc: "Music publishing legacy", color: "#00ff88" },
            { name: "NOIZYKIDZ", desc: "Creator education", color: "#ff9500" },
            { name: "DreamChamber", desc: "AI creative rig", color: "#bf40ff" },
            { name: "NOIZYSTREAM", desc: "Audio fabric", color: "#ff4d6d" },
          ].map((b) => (
            <div key={b.name} className="bg-[rgba(8,10,16,0.5)] border border-[rgba(40,42,56,0.3)] rounded-xl p-4 text-center">
              <p className="font-serif font-bold text-sm tracking-wider" style={{ color: b.color }}>{b.name}</p>
              <p className="text-xs text-[rgba(200,196,188,0.2)] mt-1">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center">
        <p className="font-mono text-xs text-[rgba(212,160,23,0.2)] tracking-widest mb-2">GORUNFREE</p>
        <p className="text-xs text-[rgba(200,196,188,0.15)]">
          NOIZY.AI — artist first. always. | RSP_001 | Ottawa, Ontario, Canada
        </p>
      </footer>
    </main>
  );
}
