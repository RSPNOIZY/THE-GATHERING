/**
 * DREAMCHAMBER.NOIZY.AI — Holding Page
 * Nine agents. One chamber. Sacred gold. 396 Hz universe.
 *
 * Author: Robert Stephen Plowman (RSP_001)
 */

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>DreamChamber — A Sacred Space for Human–AI Collaboration</title>
<meta name="description" content="DreamChamber. Nine agents. One chamber. Infinite possibility. Opening in the NOIZY Empire, 2026.">
<meta name="theme-color" content="#020408">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌙</text></svg>">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#020408;color:#c8cad8;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif}
canvas#u{display:block;position:fixed;inset:0;z-index:0}
.wrap{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem}
.wordmark{
  font-family:'Cinzel',serif;
  font-size:clamp(2.4rem,10vw,8rem);
  font-weight:900;letter-spacing:.08em;line-height:1;
  background:linear-gradient(180deg,#f8f8f8 0%,#e8e4df 15%,#d4cfc8 30%,#f0ece6 45%,#c8c2b8 55%,#e0dbd4 70%,#b8b2a8 85%,#d0cbc4 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 60px rgba(212,160,23,.12)) drop-shadow(0 4px 20px rgba(0,0,0,.5));
  opacity:0;animation:fade 4s cubic-bezier(.16,1,.3,1) .3s forwards;user-select:none;
}
.wordmark .chamber{background:linear-gradient(180deg,#d4a017,#f1c75a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tag{
  font-family:'Cinzel',serif;font-size:clamp(.65rem,1.8vw,.9rem);
  letter-spacing:.4em;text-transform:uppercase;color:rgba(212,160,23,.38);
  margin-top:1.2rem;opacity:0;animation:fade 3s ease 2s forwards;
}
.ritual{
  font-family:"SF Mono","Fira Code",monospace;font-size:clamp(.55rem,1vw,.72rem);
  color:rgba(212,160,23,.42);letter-spacing:.15em;margin-top:2.8rem;line-height:2.2;
  opacity:0;animation:fade 3s ease 3s forwards;text-transform:uppercase;
}
.ritual span{color:rgba(200,196,188,.6)}
.agents{
  font-family:"SF Mono","Fira Code",monospace;font-size:clamp(.6rem,1.1vw,.7rem);
  color:rgba(0,212,255,.28);letter-spacing:.2em;margin-top:2rem;
  opacity:0;animation:fade 3s ease 4s forwards;
  max-width:520px;line-height:2;
}
.agents b{color:rgba(212,160,23,.6);font-weight:400}
.coming{
  font-family:"SF Mono","Fira Code",monospace;font-size:clamp(.6rem,1.1vw,.75rem);
  color:rgba(0,212,255,.32);letter-spacing:.2em;margin-top:2rem;
  opacity:0;animation:fade 3s ease 5s forwards;
}
.coming em{font-style:normal;color:rgba(212,160,23,.6)}
.foot{position:absolute;bottom:2rem;left:0;right:0;text-align:center;
  font-family:"SF Mono","Fira Code",monospace;font-size:.6rem;letter-spacing:.2em;
  color:rgba(200,196,188,.18);opacity:0;animation:fade 2s ease 6s forwards;}
.foot a{color:rgba(212,160,23,.45);text-decoration:none}
.foot a:hover{color:rgba(212,160,23,.8)}
@keyframes fade{0%{opacity:0;transform:translateY(15px);filter:blur(8px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
</style>
</head>
<body>
<canvas id="u"></canvas>
<div class="wrap">
  <div class="wordmark">DREAM<span class="chamber">CHAMBER</span></div>
  <div class="tag">A Sacred Space for Human–AI Collaboration</div>
  <div class="ritual">
    anticipation · recognition · <span>possibility</span><br>
    flow · <span>elevation</span>
  </div>
  <div class="agents">
    <b>NINE AGENTS</b> · CLAUDE · GABRIEL · LUCY · SHIRL<br>
    DREAM · POPS · ENGR_KEITH · CB01 · HEAVEN
  </div>
  <div class="coming">OPENING <em>2026</em> · A <em>NOIZY EMPIRE</em> PORTAL</div>
</div>
<div class="foot">
  <p>396 Hz — Liberation · <a href="https://noizy.ai">noizy.ai</a> · rsp@noizy.ai</p>
</div>
<script>
const C=document.getElementById('u'),X=C.getContext('2d');
let W,H,T=0;
const PAL=[[212,160,23],[241,199,90],[0,212,255],[155,89,182],[255,200,120]];
class Star{constructor(){this.x=Math.random()*W;this.y=Math.random()*H;this.z=Math.random();this.br=Math.random()*1.8+.2;this.c=PAL[~~(Math.random()*PAL.length)];this.vx=(Math.random()-.5)*.08;this.vy=Math.random()*.04+.008;this.ph=Math.random()*6.28;this.fr=Math.random()*.002+.0008}
update(){this.x+=this.vx+Math.sin(T*this.fr+this.ph)*.2;this.y+=this.vy*(.4+this.z*.6);if(this.y>H+30||this.x<-30||this.x>W+30){this.x=Math.random()*W;this.y=-10}return this.br*(.3+this.z*.7)}}
class Cloud{constructor(){this.x=Math.random()*W;this.y=Math.random()*H;this.r=Math.random()*340+110;this.c=PAL[~~(Math.random()*PAL.length)];this.a=Math.random()*.012+.005;this.vx=(Math.random()-.5)*.025;this.vy=(Math.random()-.5)*.018;this.ph=Math.random()*6.28}
draw(){this.x+=this.vx+Math.sin(T*.0003+this.ph)*.1;this.y+=this.vy+Math.cos(T*.0004+this.ph)*.08;if(this.x<-this.r)this.x=W+this.r;if(this.x>W+this.r)this.x=-this.r;if(this.y<-this.r)this.y=H+this.r;if(this.y>H+this.r)this.y=-this.r;const g=X.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r);g.addColorStop(0,'rgba('+this.c+','+this.a+')');g.addColorStop(1,'rgba('+this.c+',0)');X.fillStyle=g;X.fillRect(this.x-this.r,this.y-this.r,this.r*2,this.r*2)}}
let stars=[],clouds=[];
function init(){W=C.width=innerWidth;H=C.height=innerHeight;stars=[];clouds=[];const n=Math.min(170,~~(W*H/12500));for(let i=0;i<n;i++)stars.push(new Star());for(let i=0;i<7;i++)clouds.push(new Cloud())}
function frame(){T+=16;X.fillStyle='rgba(2,4,8,.1)';X.fillRect(0,0,W,H);for(const c of clouds)c.draw();for(const s of stars){const r=s.update(),a=(.25+s.z*.75)*(.5+Math.sin(T*.001+s.ph)*.5);X.beginPath();X.arc(s.x,s.y,r,0,6.28);X.fillStyle='rgba('+s.c+','+a+')';X.fill()}requestAnimationFrame(frame)}
addEventListener('resize',init);init();X.fillStyle='#020408';X.fillRect(0,0,W,H);frame();
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
          service: "dreamchamber-landing",
          domain: "dreamchamber.noizy.ai",
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
