/**
 * NOIZYFISH.COM — Holding Page & RSP001 Rebirth Profile
 * Platinum wordmark. 396 Hz universe.
 *
 * Author: Robert Stephen Plowman (RSP_001)
 */

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>NOIZYFISH — RSP001 Rebirth</title>
<meta name="description" content="NOIZYFISH. The sound is coming. RSP001 Rebirth. 2026.">
<meta name="theme-color" content="#020408">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐟</text></svg>">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#020408;color:#c8cad8;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif}
canvas#u{display:block;position:fixed;inset:0;z-index:0}
.wrap{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;overflow-y:auto}
.wordmark{
  font-family:'Cinzel',serif;
  font-size:clamp(2.5rem,8vw,5rem);
  font-weight:900;letter-spacing:.15em;line-height:1;
  background:linear-gradient(180deg,#f8f8f8 0%,#e8e4df 15%,#d4cfc8 30%,#f0ece6 45%,#c8c2b8 55%,#e0dbd4 70%,#b8b2a8 85%,#d0cbc4 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 60px rgba(0,212,255,.08)) drop-shadow(0 4px 20px rgba(0,0,0,.5));
  opacity:0;animation:fade 4s cubic-bezier(.16,1,.3,1) .3s forwards;user-select:none;
}
.wordmark .fin{background:linear-gradient(180deg,#00d4ff,#0088cc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tag{
  font-family:'Cinzel',serif;font-size:clamp(.6rem,1.5vw,.8rem);
  letter-spacing:.4em;text-transform:uppercase;color:rgba(200,196,188,.35);
  margin-top:0.8rem;opacity:0;animation:fade 3s ease 1s forwards;
}
.profile-card {
  max-width: 580px;
  background: rgba(2, 4, 8, 0.75);
  border: 1px solid rgba(0, 212, 255, 0.15);
  border-radius: 8px;
  padding: 1.5rem 2rem;
  margin-top: 2rem;
  text-align: left;
  backdrop-filter: blur(16px);
  box-shadow: 0 0 50px rgba(0, 212, 255, 0.05);
  opacity: 0;
  animation: fade 3s cubic-bezier(.16,1,.3,1) 1.5s forwards;
}
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  letter-spacing: 0.2em;
  color: rgba(200, 196, 188, 0.4);
  border-bottom: 1px solid rgba(200, 196, 188, 0.1);
  padding-bottom: 0.6rem;
  margin-bottom: 0.8rem;
}
.profile-id {
  color: #00d4ff;
  font-weight: 800;
}
.profile-role {
  text-transform: uppercase;
}
.profile-body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  font-size: 0.85rem;
  line-height: 1.6;
  color: rgba(200, 202, 216, 0.8);
  font-weight: 300;
}
.profile-body .highlight {
  color: #f8f8f8;
  font-weight: 600;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.15);
}
.profile-meta {
  display: flex;
  gap: 1.5rem;
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 0.65rem;
  color: rgba(212, 160, 23, 0.6);
  margin-top: 0.8rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(200, 196, 188, 0.1);
}
.silhouette-container {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 280px;
  height: 420px;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  animation: fade 4s cubic-bezier(.16,1,.3,1) 0.5s forwards;
}
.silhouette {
  width: 100%;
  height: 100%;
}
.coming{
  font-family:"SF Mono","Fira Code",monospace;font-size:clamp(.55rem,1vw,.7rem);
  color:rgba(0,212,255,.35);letter-spacing:.2em;margin-top:2.5rem;line-height:2;
  opacity:0;animation:fade 3s ease 2.5s forwards;
}
.coming span{color:rgba(212,160,23,.6)}
.foot{position:absolute;bottom:2rem;left:0;right:0;text-align:center;
  font-family:"SF Mono","Fira Code",monospace;font-size:.6rem;letter-spacing:.2em;
  color:rgba(200,196,188,.15);opacity:0;animation:fade 2s ease 3.5s forwards;
}
.foot a{color:rgba(0,212,255,.3);text-decoration:none}
.foot a:hover{color:rgba(0,212,255,.6)}
@keyframes fade{0%{opacity:0;transform:translateY(15px);filter:blur(8px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
</style>
</head>
<body>
<canvas id="u"></canvas>
<div class="wrap">
  <div class="silhouette-container">
    <svg class="silhouette" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 40 c6 0, 9 -4, 9 -9 s-3 -9, -9 -9 s-9 4, -9 9 s3 9, 9 9 Z 
               M38 58 c0 -12, 24 -12, 24 0 c0 18, -4 35, -4 75 l-4 55 l-8 0 l-4 -55 c0 -40, -4 -57, -4 -75 Z" 
            fill="url(#silhouette-grad)" opacity="0.12" />
      <defs>
        <linearGradient id="silhouette-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00d4ff" />
          <stop offset="100%" stop-color="#020408" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  </div>

  <div class="wordmark">NOIZY<span class="fin">FISH</span></div>
  <div class="tag">The Sound Is Coming</div>

  <div class="profile-card">
    <div class="profile-header">
      <span class="profile-id">RSP001</span>
      <span class="profile-role">Founder · Architect</span>
    </div>
    <div class="profile-body">
      <span class="highlight">R.S. Plowman</span> is <span class="highlight">RSP_001</span>: the founding artist, architect, and first living profile of NOIZYFISH. His catalog begins the wheel: sound as memory, consent as code, provenance as protection, and LIFELUV as the promise that the work outlives the moment. RSP001 is not just the first profile. It is the covenant template for every artist who enters after him.
    </div>
    <div class="profile-meta">
      <span>396 Hz (Liberation)</span>
      <span>96 BPM</span>
    </div>
  </div>

  <div class="coming">LAUNCHING <span>2026</span> · A <span>NOIZY EMPIRE</span> PORTAL</div>
</div>
<div class="foot">
  <p>396 Hz — Liberation · <a href="https://noizy.ai">noizy.ai</a> · rsp@noizy.ai</p>
</div>
<script>
const C=document.getElementById('u'),X=C.getContext('2d');
let W,H,T=0;
const PAL=[[0,212,255],[212,160,23],[155,89,182],[80,140,220]];

function init(){
  W=C.width=innerWidth;
  H=C.height=innerHeight;
}

function drawGrid() {
  X.strokeStyle = 'rgba(0, 212, 255, 0.015)';
  X.lineWidth = 1;
  const step = 60;
  for(let x=0; x<W; x+=step) {
    X.beginPath();
    X.moveTo(x, 0);
    X.lineTo(x, H);
    X.stroke();
  }
  for(let y=0; y<H; y+=step) {
    X.beginPath();
    X.moveTo(0, y);
    X.lineTo(W, y);
    X.stroke();
  }
}

function drawFerrisWheel(cx, cy, radius) {
  const angle = T * 0.00008;
  
  // Canadian night-glow backplate
  const glow = X.createRadialGradient(cx, cy, 0, cx, cy, radius * 2.2);
  glow.addColorStop(0, 'rgba(10, 18, 42, 0.35)');
  glow.addColorStop(0.5, 'rgba(5, 10, 24, 0.15)');
  glow.addColorStop(1, 'rgba(2, 4, 8, 0)');
  X.fillStyle = glow;
  X.beginPath();
  X.arc(cx, cy, radius * 2.2, 0, 6.28);
  X.fill();

  // 396 Hz pulsing liberation ring
  const pulse = radius * 0.5 + Math.sin(T * 0.0008) * 6;
  const pulseGlow = X.createRadialGradient(cx, cy, pulse - 8, cx, cy, pulse + 8);
  pulseGlow.addColorStop(0, 'rgba(212, 160, 23, 0)');
  pulseGlow.addColorStop(0.5, 'rgba(212, 160, 23, 0.2)');
  pulseGlow.addColorStop(1, 'rgba(212, 160, 23, 0)');
  X.strokeStyle = pulseGlow;
  X.lineWidth = 10;
  X.beginPath();
  X.arc(cx, cy, pulse, 0, 6.28);
  X.stroke();

  // Draw wheel rings
  X.strokeStyle = 'rgba(0, 212, 255, 0.04)';
  X.lineWidth = 1.5;
  X.beginPath();
  X.arc(cx, cy, radius * 0.9, 0, 6.28);
  X.stroke();
  
  X.strokeStyle = 'rgba(200, 196, 188, 0.02)';
  X.beginPath();
  X.arc(cx, cy, radius * 1.15, 0, 6.28);
  X.stroke();

  // Draw waveform spokes
  const numSpokes = 24;
  for(let i=0; i<numSpokes; i++) {
    const a = angle + (i * Math.PI * 2) / numSpokes;
    const xEnd = cx + Math.cos(a) * radius * 1.25;
    const yEnd = cy + Math.sin(a) * radius * 1.25;
    
    X.beginPath();
    
    const points = 30;
    for(let j=0; j<=points; j++) {
      const t = j / points;
      const r = radius * 1.25 * t;
      const wave = Math.sin(t * 15 - T * 0.003) * 5 * (1 - t) * t;
      const wx = cx + Math.cos(a) * r - Math.sin(a) * wave;
      const wy = cy + Math.sin(a) * r + Math.cos(a) * wave;
      
      if(j === 0) X.moveTo(wx, wy);
      else X.lineTo(wx, wy);
    }
    
    X.strokeStyle = i % 2 === 0 ? 'rgba(0, 212, 255, 0.06)' : 'rgba(200, 196, 188, 0.03)';
    X.lineWidth = 1;
    X.stroke();
  }

  // Draw outer rim buckets (symbolic platinum-blue fish scales)
  const scaleCount = 36;
  for(let i=0; i<scaleCount; i++) {
    const a = angle * -0.6 + (i * Math.PI * 2) / scaleCount;
    const sx = cx + Math.cos(a) * radius * 1.28;
    const sy = cy + Math.sin(a) * radius * 1.28;
    
    X.fillStyle = 'rgba(0, 212, 255, ' + (0.04 + Math.sin(T * 0.0004 + i) * 0.02) + ')';
    X.beginPath();
    X.arc(sx, sy, 5, 0, 6.28);
    X.fill();
    X.strokeStyle = 'rgba(248, 248, 248, 0.06)';
    X.lineWidth = 0.5;
    X.stroke();
  }
}

class Particle {
  constructor() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.sz = Math.random() * 1.2 + 0.4;
    this.speed = Math.random() * 0.06 + 0.015;
    this.ph = Math.random() * 6.28;
    this.c = Math.random() > 0.5 ? 'rgba(0, 212, 255, ' : 'rgba(212, 160, 23, ';
  }
  draw() {
    this.y -= this.speed;
    if(this.y < -10) {
      this.y = H + 10;
      this.x = Math.random() * W;
    }
    const alpha = 0.08 + Math.sin(T * 0.0008 + this.ph) * 0.05;
    X.fillStyle = this.c + alpha + ')';
    X.beginPath();
    X.arc(this.x, this.y, this.sz, 0, 6.28);
    X.fill();
  }
}

let particles = [];
function setup() {
  init();
  particles = [];
  for(let i=0; i<60; i++) particles.push(new Particle());
}

function frame() {
  T += 16;
  X.fillStyle = '#020408';
  X.fillRect(0, 0, W, H);
  
  drawGrid();
  
  const wheelRadius = Math.min(W, H) * 0.35;
  // Draw the Ferris wheel centered dynamically
  drawFerrisWheel(W / 2, H / 2, wheelRadius);
  
  for(const p of particles) p.draw();
  
  requestAnimationFrame(frame);
}

addEventListener('resize', setup);
setup();
frame();
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "operational",
          service: "noizyfish-landing",
          domain: "noizyfish.com",
          version: "0.1.0",
          phase: "holding",
          actor: "RSP_001",
        }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
      );
    }
    return new Response(HTML, {
      headers: {
        "Content-Type": "text/html;charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Powered-By": "NOIZY/RSP_001",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
