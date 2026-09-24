/**
 * NOIZYLAB.COM — Holding Page
 * The labs. Where experiments happen. Platinum wordmark. 396 Hz universe.
 *
 * Author: Robert Stephen Plowman (RSP_001)
 */

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>NOIZYLAB — The Laboratory of the NOIZY Empire</title>
<meta name="description" content="NOIZYLAB. Experiments in sound. The research and development arm of the NOIZY Empire. 2026.">
<meta name="theme-color" content="#020408">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚗️</text></svg>">
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;800;900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#020408;color:#c8cad8;
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",sans-serif}
canvas#u{display:block;position:fixed;inset:0;z-index:0}
.wrap{position:fixed;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem}
.wordmark{
  font-family:'Cinzel',serif;
  font-size:clamp(3rem,13vw,10rem);
  font-weight:900;letter-spacing:.1em;line-height:1;
  background:linear-gradient(180deg,#f8f8f8 0%,#e8e4df 15%,#d4cfc8 30%,#f0ece6 45%,#c8c2b8 55%,#e0dbd4 70%,#b8b2a8 85%,#d0cbc4 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 60px rgba(155,89,182,.08)) drop-shadow(0 4px 20px rgba(0,0,0,.5));
  opacity:0;animation:fade 4s cubic-bezier(.16,1,.3,1) .3s forwards;user-select:none;
}
.wordmark .lab{background:linear-gradient(180deg,#9b59b6,#c98bd8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.tag{
  font-family:'Cinzel',serif;font-size:clamp(.65rem,1.8vw,.9rem);
  letter-spacing:.4em;text-transform:uppercase;color:rgba(200,196,188,.3);
  margin-top:1.2rem;opacity:0;animation:fade 3s ease 2s forwards;
}
.doctrine{
  font-family:"SF Mono","Fira Code",monospace;font-size:clamp(.55rem,1vw,.72rem);
  color:rgba(155,89,182,.42);letter-spacing:.15em;margin-top:2.5rem;line-height:2.2;
  opacity:0;animation:fade 3s ease 3s forwards;text-transform:uppercase;
}
.doctrine span{color:rgba(212,160,23,.55)}
.coming{
  font-family:"SF Mono","Fira Code",monospace;font-size:clamp(.6rem,1.1vw,.75rem);
  color:rgba(0,212,255,.35);letter-spacing:.2em;margin-top:2rem;
  opacity:0;animation:fade 3s ease 4s forwards;
}
.coming em{font-style:normal;color:rgba(212,160,23,.6)}
.foot{position:absolute;bottom:2rem;left:0;right:0;text-align:center;
  font-family:"SF Mono","Fira Code",monospace;font-size:.6rem;letter-spacing:.2em;
  color:rgba(200,196,188,.18);opacity:0;animation:fade 2s ease 5s forwards;}
.foot a{color:rgba(155,89,182,.45);text-decoration:none}
.foot a:hover{color:rgba(155,89,182,.75)}
@keyframes fade{0%{opacity:0;transform:translateY(15px);filter:blur(8px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
</style>
</head>
<body>
<canvas id="u"></canvas>
<div class="wrap">
  <div class="wordmark">NOIZY<span class="lab">LAB</span></div>
  <div class="tag">The Laboratory of the NOIZY Empire</div>
  <div class="doctrine">
    experiments in <span>sound</span><br>
    prototypes of <span>sovereignty</span><br>
    research with <span>reverence</span>
  </div>
  <div class="coming">OPENING <em>2026</em> · A <em>NOIZY EMPIRE</em> LABORATORY</div>
</div>
<div class="foot">
  <p>396 Hz — Liberation · <a href="https://noizy.ai">noizy.ai</a> · rsp@noizy.ai</p>
</div>
<script>
const C=document.getElementById('u'),X=C.getContext('2d');
let W,H,T=0;
const PAL=[[155,89,182],[212,160,23],[0,212,255],[80,140,220]];
class Star{constructor(){this.x=Math.random()*W;this.y=Math.random()*H;this.z=Math.random();this.br=Math.random()*1.8+.2;this.c=PAL[~~(Math.random()*PAL.length)];this.vx=(Math.random()-.5)*.1;this.vy=Math.random()*.05+.01;this.ph=Math.random()*6.28;this.fr=Math.random()*.002+.0008}
update(){this.x+=this.vx+Math.sin(T*this.fr+this.ph)*.2;this.y+=this.vy*(.4+this.z*.6);if(this.y>H+30||this.x<-30||this.x>W+30){this.x=Math.random()*W;this.y=-10}return this.br*(.3+this.z*.7)}}
class Cloud{constructor(){this.x=Math.random()*W;this.y=Math.random()*H;this.r=Math.random()*320+100;this.c=PAL[~~(Math.random()*PAL.length)];this.a=Math.random()*.01+.004;this.vx=(Math.random()-.5)*.03;this.vy=(Math.random()-.5)*.02;this.ph=Math.random()*6.28}
draw(){this.x+=this.vx+Math.sin(T*.0003+this.ph)*.12;this.y+=this.vy+Math.cos(T*.0004+this.ph)*.1;if(this.x<-this.r)this.x=W+this.r;if(this.x>W+this.r)this.x=-this.r;if(this.y<-this.r)this.y=H+this.r;if(this.y>H+this.r)this.y=-this.r;const g=X.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r);g.addColorStop(0,'rgba('+this.c+','+this.a+')');g.addColorStop(1,'rgba('+this.c+',0)');X.fillStyle=g;X.fillRect(this.x-this.r,this.y-this.r,this.r*2,this.r*2)}}
let stars=[],clouds=[];
function init(){W=C.width=innerWidth;H=C.height=innerHeight;stars=[];clouds=[];const n=Math.min(180,~~(W*H/12000));for(let i=0;i<n;i++)stars.push(new Star());for(let i=0;i<7;i++)clouds.push(new Cloud())}
function frame(){T+=16;X.fillStyle='rgba(2,4,8,.12)';X.fillRect(0,0,W,H);for(const c of clouds)c.draw();for(const s of stars){const r=s.update(),a=(.25+s.z*.75)*(.5+Math.sin(T*.001+s.ph)*.5);X.beginPath();X.arc(s.x,s.y,r,0,6.28);X.fillStyle='rgba('+s.c+','+a+')';X.fill()}requestAnimationFrame(frame)}
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
          service: "noizylab-landing",
          domain: "noizylab.com",
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
