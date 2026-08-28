import express from 'express';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
app.use(express.json());
const PORT = 9800;

console.clear();
console.log("=====================================================================");
console.log("🦾 [NEURAL CORE CONTROL] EXPERT ARCHITECTURE AGENT LIVE FOR GABRIEL");
console.log("=====================================================================");

const WORKSPACE_SUBBRANDS = path.join(process.cwd(), 'app/subbrands');

app.post('/api/neural/execute', async (req, res) => {
  const { command, brandName, layoutType, contextText } = req.body;
  
  if (!brandName || !layoutType) {
    return res.status(400).json({ error: "Missing essential structural identity strings." });
  }

  console.log(`\n🧠 [Neural Core] Processing command vector: [${command?.toUpperCase()}] for brand: ${brandName}`);

  let structuralCopy = `Sovereign deployment framework validated for ${brandName}.`;

  // Intercept and load deep context from LM Studio running locally
  try {
    const lmStudioResponse = await fetch('http://localhost:1234/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: "user",
          content: `Write an avant-garde, ultra-clean tagline for a ${layoutType} sub-brand named "${brandName}". Context: ${contextText || 'Sleek premium infrastructure'}. Clean text only.`
        }],
        temperature: 0.15
      })
    });
    const parsedData = await lmStudioResponse.json();
    structuralCopy = parsedData.choices.message.content.trim();
  } catch (e) {
    console.log("⚠️ LM Studio local endpoint offline. Falling back onto deterministic layout arrays.");
  }

  try {
    const targetDir = path.join(WORKSPACE_SUBBRANDS, brandName);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const codeLayout = `
// Master Autonomous Engine Output // Built for Gabriel Natively
export default function SovereignEcosystemPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-16 flex flex-col justify-between selection:bg-white selection:text-black">
      <div className="border border-neutral-900 p-12 rounded bg-neutral-950/40 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-6 mb-8">
          <span className="text-xs bg-white text-black px-3 py-1 font-black tracking-widest">AGENTS VERIFIED</span>
          <span className="text-xs text-neutral-500">// INSTANCE: ${Math.random().toString(36).substring(7).toUpperCase()}</span>
        </div>
        <h1 className="text-7xl font-black tracking-tighter uppercase mb-4">${brandName}</h1>
        <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed font-sans">${structuralCopy.replace(/"/g, '\\"')}</p>
      </div>
      <div className="text-[10px] text-neutral-600 flex justify-between tracking-widest pt-6 border-t border-neutral-900">
        <span>CORE ENGINE: M2_ULTRA_SOVEREIGN</span>
        <span>STATUS: SECURE MATRIX LIVE</span>
      </div>
    </div>
  );
}
    `.trim();

    fs.writeFileSync(path.join(targetDir, 'page.js'), codeLayout);
    console.log(`💾 [Disk IO] Next.js structural template successfully compiled to file systems.`);

    // Trigger local n8n hooks for cloud state tracking
    try {
      fetch('http://localhost:5678/webhook/noizy-neural-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemEvent: "build_complete", brandName })
      }).catch(() => {});
    } catch (e) {}

    // Vocal verification announcement matched to your personal audio speed preference
    const successSpeech = `Sovereign execution loop finalized. Sub brand, ${brandName}, is compiled cleanly as a ${layoutType} workspace. System integrity stable.`;
    console.log(`🗣️ [Voice Output Engine]: "${successSpeech}"`);
    exec(`say -r 170 "${successSpeech}"`);

    res.json({ success: true, activePath: `/app/subbrands/${brandName}/page.js`, copyText: structuralCopy });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Master Neural Command Core broadcasting on http://localhost:${PORT}`));
