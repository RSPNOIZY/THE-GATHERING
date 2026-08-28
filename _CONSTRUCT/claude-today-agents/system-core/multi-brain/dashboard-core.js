import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const app = express();
const PORT = 9900;

app.get('/', (req, res) => {
  const threads = os.cpus().length;
  const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(1);
  const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);

  const viewHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>NOIZY.AI // SATELLITE COMMAND PANEL</title>
    <script src="https://tailwindcss.com"></script>
    <style>body { background-color: #000; color: #fff; font-family: ui-monospace, monospace; }</style>
  </head>
  <body class="p-12 max-w-6xl mx-auto selection:bg-white selection:text-black">
    <header class="border-b border-neutral-900 pb-6 mb-12 flex justify-between items-end">
      <div>
        <h1 class="text-5xl font-black tracking-tightest uppercase mb-1">NOIZY CENTRAL</h1>
        <p class="text-[10px] text-neutral-500 tracking-widest uppercase">// 10 REVENUE AGENTS INTERFACE SUITE</p>
      </div>
      <div class="text-right text-xs text-neutral-400 uppercase">
        <p>HARDWARE CORE: M2 ULTRA NEURAL NETWORK</p>
        <p class="text-green-500 font-bold animate-pulse">● GUARDIAN PROCESS DAEMON: SECURE LOCK</p>
      </div>
    </header>

    <main class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- SLACK SUB-AGENTS ADMIN FLEET CONTAINER -->
      <section class="border border-neutral-900 bg-neutral-950 p-6 rounded">
        <h2 class="text-xs font-black text-neutral-400 tracking-wider uppercase mb-4">// SLACK ADMINISTRATIVE MONETIZATION FLEET</h2>
        <div class="space-y-2 text-xs">
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 1: AD_INSERTION_TRACKER</span><span class="text-green-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 2: VIDEO_RENDER_MONITOR</span><span class="text-green-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 3: SUBSCRIPTION_DATABASE_SYNC</span><span class="text-green-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 4: AUDIT_METRICS_ENGINE</span><span class="text-green-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 5: EMERGENCY_KILL_SWITCH</span><span class="text-red-500 font-bold">READY</span></div>
        </div>
      </section>

      <!-- DISCORD SUB-AGENTS USER FLEET CONTAINER -->
      <section class="border border-neutral-900 bg-neutral-950 p-6 rounded">
        <h2 class="text-xs font-black text-neutral-400 tracking-wider uppercase mb-4">// DISCORD USER ACTION STREAM FLEET</h2>
        <div class="space-y-2 text-xs">
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 1: PREMIUM_AUDIO_STREAM_CONTROLLER</span><span class="text-blue-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 2: PAYWALL_ACCESS_SYNC</span><span class="text-blue-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 3: CONTENT_VAULT_CLEANER</span><span class="text-blue-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 4: INTERACTIVE_RAFFLE_BOT</span><span class="text-blue-400">ACTIVE</span></div>
          <div class="p-2 border border-neutral-900 bg-black flex justify-between"><span>BOT 5: SECURITY_MODERATOR</span><span class="text-blue-400">ACTIVE</span></div>
        </div>
      </section>
    </main>

    <section class="mt-8 border border-neutral-900 bg-neutral-950 p-6 rounded text-xs text-neutral-400 flex justify-between">
      <span>CPU STATUS: ${threads} ACTIVE THREAD CORES DETECTED</span>
      <span>MEMORY CAP: ${freeRam} GB FREE OUT OF ${totalRam} GB TOTAL POOL</span>
    </section>
  </body>
  </html>
  `;
  exec(`say -r 175 "Dashboard configuration array updated."`);
  res.send(viewHtml);
});

app.listen(PORT, () => console.log(`🚀 Master Dashboard online on http://localhost:${PORT}`));
