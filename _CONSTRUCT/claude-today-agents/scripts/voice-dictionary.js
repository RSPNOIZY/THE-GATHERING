import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const KEYWORD_INPUT = process.argv[2];
const BRAND_TARGET = process.argv[3] || 'matrix-capsule';

console.log(`🤖 [Dictionary Agent] Processing short voice keyword: [${KEYWORD_INPUT}]`);

const DICTIONARY_MAP = {
  'cyberpunk': 'A limited capsule drop forged from heavy tech-wear materials. Structured panels, deep-pocket layouts, and liquid-resistant textile matrices engineered for extreme physical durability.',
  'ambient': 'A decentralized sonic environment broadcast. Generative synthesized drift audio loops designed to minimize neural fatigue and enhance workspace execution throughput cycles.',
  'streetwear': 'Heavyweight Japanese cotton jersey structures featuring hand-distressed edge cuts, drop-shoulder geometry layouts, and minimal high-contrast branding identifiers.',
  'minimal': 'Stripped back architecture layouts. Pure monochrome canvas layouts, clean grid spacing components, and hidden invisible pocket seams tailored for functional utility.'
};

const expandedText = DICTIONARY_MAP[KEYWORD_INPUT?.toLowerCase()];

if (!expandedText) {
  const errText = `Voice keyword macro ${KEYWORD_INPUT || 'empty'} not found inside your local dictionary.`;
  console.log(`❌ ERROR: ${errText}`);
  execSync(`say -v "Oliver" -r 170 "${errText}"`);
  process.exit(1);
}

const targetDir = path.join(process.cwd(), `app/subbrands/${BRAND_TARGET}`);
const targetFilePath = path.join(targetDir, 'page.js');

// AUTONOMOUS PROTOCOL: If the sub-brand target folder or page doesn't exist, create it instantly
if (!fs.existsSync(targetDir)) {
  console.log(`🛠️ [Self-Healing] Generating missing directory structure: app/subbrands/${BRAND_TARGET}`);
  fs.mkdirSync(targetDir, { recursive: true });
}

if (!fs.existsSync(targetFilePath)) {
  console.log(`📝 [Self-Healing] Creating baseline component template file: ${targetFilePath}`);
  const baselineTemplate = `
export default function DynamicAutonomousPage() {
  return (
    <div className="min-h-screen bg-black text-white font-mono p-12 flex flex-col justify-between">
      <div className="border border-neutral-800 p-8 rounded bg-neutral-950">
        <h1 className="text-5xl font-black uppercase mb-4">${BRAND_TARGET}</h1>
        <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">Placeholder description text container.</p>
      </div>
    </div>
  );
}
  `.trim();
  fs.writeFileSync(targetFilePath, baselineTemplate);
}

// Read and execute text injection cleanly
let content = fs.readFileSync(targetFilePath, 'utf8');

if (content.includes('text-neutral-400')) {
  content = content.replace(/<p className="text-sm text-neutral-400 max-w-xl leading-relaxed">([\s\S]*?)<\/p>/, 
    `<p className="text-sm text-neutral-400 max-w-xl leading-relaxed">${expandedText}</p>`);
  
  fs.writeFileSync(targetFilePath, content);
  console.log(`🟢 [Success] Injected macro text cleanly into: ./${path.relative(process.cwd(), targetFilePath)}`);
  execSync(`say -r 172 "Dictionary macro successfully embedded into ${BRAND_TARGET} content views."`);
} else {
  console.log("⚠️ Target text container class selector not matched inside component file.");
}
