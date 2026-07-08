import { useState } from "react";

const C = {
  bg:      "#0C0A08",
  sidebar: "#100E0B",
  card:    "#161210",
  border:  "#2A2218",
  gold:    "#C9933A",
  goldDim: "#7A5520",
  bone:    "#F0E8DC",
  muted:   "#8A7A68",
  dim:     "#4A3C30",
  green:   "#1D9E75",
  amber:   "#EF9F27",
  red:     "#E24B4A",
  white:   "#FFFFFF",
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2A2218; border-radius: 2px; }
  button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
  input, textarea { font-family: 'DM Sans', sans-serif; }
`;

const RSP = {
  handle:   "r.s.plowman",
  name:     "Robert Stephen Plowman",
  role:     "Founder · Creator-Sovereign",
  id:       "RSP_001",
  since:    "2024",
  catalog:  888,
  archive:  "34TB",
  years:    40,
  credits:  ["Ed Edd n Eddy","Dragon Tales","Johnny Test","Transformers","Barbie"],
  publisher:"Fish Music Inc.",
  location: "Ottawa, Canada",
  estate:   { beneficiary: "Georgia May Plowman", protection: "100-year OAIS/PREMIS" },
};

const CATALOG_SAMPLE = [
  { id:"AQ-001", title:"Cartoon Chase No.3",     year:2001, genre:"Children's Animation", credit:"Ed Edd n Eddy",  duration:"1:42", status:"unregistered" },
  { id:"AQ-002", title:"Dragon Theme Main",        year:1999, genre:"Children's Animation", credit:"Dragon Tales",   duration:"2:18", status:"unregistered" },
  { id:"AQ-003", title:"Test Lab Frenzy",          year:2005, genre:"Children's Comedy",    credit:"Johnny Test",    duration:"0:58", status:"unregistered" },
  { id:"AQ-004", title:"Autobot March",            year:2007, genre:"Action / Score",       credit:"Transformers",   duration:"3:22", status:"unregistered" },
  { id:"AQ-005", title:"Dream Sequence A",         year:2003, genre:"Ambient / Score",      credit:"Dragon Tales",   duration:"4:11", status:"unregistered" },
  { id:"AQ-006", title:"Barbie Waltz No.1",        year:2009, genre:"Orchestral / Score",   credit:"Barbie",         duration:"2:45", status:"unregistered" },
  { id:"AQ-007", title:"Sneaky Eddy",              year:2002, genre:"Children's Comedy",    credit:"Ed Edd n Eddy",  duration:"0:44", status:"unregistered" },
  { id:"AQ-008", title:"Cybertron Descent",        year:2008, genre:"Action / Score",       credit:"Transformers",   duration:"5:01", status:"unregistered" },
  { id:"AQ-009", title:"Princess Ballroom Theme",  year:2010, genre:"Orchestral",           credit:"Barbie",         duration:"3:15", status:"unregistered" },
  { id:"AQ-010", title:"Suburban Afternoons",      year:2001, genre:"Children's Comedy",    credit:"Ed Edd n Eddy",  duration:"1:23", status:"unregistered" },
  { id:"AQ-011", title:"Dragon Lullaby",           year:2000, genre:"Children's Animation", credit:"Dragon Tales",   duration:"2:59", status:"unregistered" },
  { id:"AQ-012", title:"Deep Aquarium",            year:2015, genre:"Ambient / Electronic", credit:"AQUARIUM",       duration:"6:44", status:"unregistered" },
];

const ACTIONS = [
  { id:"mfa",       title:"Enable MFA",          detail:"Cloudflare · GitHub · M365",         level:"critical", url:"https://dash.cloudflare.com" },
  { id:"heaven",    title:"Deploy HEAVEN",        detail:"npx wrangler deploy — 1 command",    level:"critical", url:null },
  { id:"socan",     title:"File SOCAN audit",     detail:"40 years of TV broadcast royalties",  level:"warn",     url:"https://socan.com/music-creators" },
  { id:"songtrust", title:"Register Songtrust",   detail:"888 titles · international mechanicals",level:"warn",  url:"https://songtrust.com" },
  { id:"ppl",       title:"Join PPL UK",          detail:"UK broadcast royalties · free",       level:"warn",     url:"https://ppluk.com/join" },
  { id:"distrokid", title:"Upload to DistroKid",  detail:"888 titles → 40+ streaming platforms",level:"warn",    url:"https://distrokid.com" },
];

const AGENTS = [
  { name:"GABRIEL ALAMEIDA", role:"Sovereign Brain", desc:"12 Gospel · 25 memcells · consent architecture", color:"#8BA7C7", status:"active" },
  { name:"LUCY CORTEZ",      role:"Pattern Guardian", desc:"888 observations · emotional resonance · Voice Estate",color:"#C79B8A",status:"listening"},
  { name:"ENGR_KEITH",       role:"Engineering",     desc:"R.K. Plowman · engineer · inventor · honored",   color:"#9BA8B4", status:"honored" },
  { name:"SHIRL",            role:"Grace",           desc:"Aunt Shirley · warmth · care · memory",          color:"#B4A0B0", status:"honored" },
  { name:"DREAM",            role:"Architecture",    desc:"DreamChamber · vision · cathedral",               color:"#A8B5A0", status:"active" },
  { name:"JADE",             role:"Review Gate",     desc:"Quality · audit · consent review",               color:"#94B4A0", status:"active" },
];

const GOSPEL = [
  "The voice belongs to the one who made it.",
  "Consent is a covenant — not a checkbox.",
  "75% to the creator. 25% to the infrastructure that serves them.",
  "No soul harvested without permission.",
  "The dead are not public domain. The Voice Estate is real.",
  "DREED is the enemy. Speed over dignity. Scale over sovereignty. Name it.",
  "The Guild of Trust holds the line. Perpetual.",
  "GABRIEL does not sleep. Does not negotiate the core.",
  "The Fifth Epoch is not coming. It is here.",
  "This is not about money. It's about who gets to exist.",
  "The answer is: everyone. On their own terms.",
  "We build for peace. For understanding. For the ones who come after.",
];

// ── tiny components ──────────────────────────────────────────────────────────

function Dot({ level }) {
  const color = level === "critical" ? C.red : level === "warn" ? C.amber : C.green;
  return <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }} />;
}

function Pill({ text, color, bg }) {
  return (
    <span style={{
      fontSize:9, padding:"2px 8px", borderRadius:10, fontWeight:500,
      color: color || C.muted,
      background: bg || C.card,
      border:`0.5px solid ${color || C.dim}44`,
    }}>{text}</span>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{
      fontSize:9, fontWeight:500, letterSpacing:".12em", textTransform:"uppercase",
      color:C.goldDim, marginBottom:12,
    }}>{children}</div>
  );
}

// ── views ────────────────────────────────────────────────────────────────────

function HomeView({ setView }) {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:32, fontWeight:300, color:C.bone, lineHeight:1.1, marginBottom:4 }}>
            Welcome back,<br/><span style={{ color:C.gold }}>Robert Stephen Plowman.</span>
          </div>
          <div style={{ fontSize:11, color:C.muted }}>r.s.plowman · RSP_001 · Founder · Fish Music Inc.</div>
        </div>
        <div style={{ display:"flex", gap:16 }}>
          {[["888","Titles"],[RSP.archive,"Archive"],["40 yrs","Creating"],["0","Earning"]].map(([v,l],i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:400, color:i===3?C.red:C.gold }}>{v}</div>
              <div style={{ fontSize:9, color:C.dim, letterSpacing:".06em" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionHead>Action required — nothing moves until these are done</SectionHead>
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:24 }}>
        {ACTIONS.map(a => (
          <div key={a.id} style={{
            display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
            background:C.card,
            border:`0.5px solid ${a.level==="critical"?"rgba(226,75,74,.25)":"rgba(239,159,39,.2)"}`,
            borderLeft:`3px solid ${a.level==="critical"?C.red:C.amber}`,
            borderRadius:"0 6px 6px 0",
            cursor: a.url ? "pointer" : "default",
          }} onClick={() => a.url && window.open(a.url,"_blank")}>
            <Dot level={a.level} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:500, color:C.bone }}>{a.title}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{a.detail}</div>
            </div>
            <div style={{ fontSize:9, color:C.dim, padding:"2px 8px", border:`0.5px solid ${C.border}`, borderRadius:8 }}>
              {a.url ? "Open ↗" : "Run on GOD"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10 }}>
        {[
          ["THE AQUARIUM","888 titles · 34TB · 40 years","catalog","ti-music"],
          ["Voice Estate","Georgia May · 100-year protection","estate","ti-shield-check"],
          ["Guardians","GABRIEL · LUCY · 6 agents active","guardians","ti-brain"],
          ["HVS Standard","Publishable now · noizyfish.com/hvs","hvs","ti-file-certificate"],
        ].map(([t,d,v,icon])=>(
          <div key={v} onClick={()=>setView(v)} style={{
            background:C.card, border:`0.5px solid ${C.border}`,
            borderRadius:10, padding:"14px 16px", cursor:"pointer",
            transition:"border-color .15s",
          }} onMouseEnter={e=>e.currentTarget.style.borderColor=C.goldDim}
             onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <i className={`ti ${icon}`} style={{ fontSize:18, color:C.goldDim, display:"block", marginBottom:8 }} aria-hidden="true" />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:C.bone, marginBottom:3 }}>{t}</div>
            <div style={{ fontSize:10, color:C.muted, lineHeight:1.5 }}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogView() {
  const [filter, setFilter] = useState("All");
  const credits = ["All", ...RSP.credits, "AQUARIUM"];
  const filtered = filter === "All" ? CATALOG_SAMPLE : CATALOG_SAMPLE.filter(t=>t.credit===filter);

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.bone, marginBottom:4 }}>THE AQUARIUM</div>
        <div style={{ fontSize:11, color:C.muted }}>888 titles · 34TB · 40 years · Fish Music Inc. — showing {filtered.length} of 888</div>
      </div>

      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
        {credits.map(c=>(
          <button key={c} onClick={()=>setFilter(c)} style={{
            fontSize:10, padding:"4px 12px",
            border:`0.5px solid ${filter===c?C.goldDim:C.border}`,
            borderRadius:20, background:filter===c?"rgba(201,147,58,.1)":"transparent",
            color:filter===c?C.gold:C.muted,
          }}>{c}</button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
        <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 100px 80px 80px 80px", gap:10, padding:"6px 12px", fontSize:9, color:C.dim, letterSpacing:".08em", textTransform:"uppercase" }}>
          <span>ID</span><span>Title</span><span>Credit</span><span>Year</span><span>Duration</span><span>Status</span>
        </div>
        {filtered.map((t,i)=>(
          <div key={t.id} style={{
            display:"grid", gridTemplateColumns:"60px 1fr 100px 80px 80px 80px",
            gap:10, padding:"10px 12px", background:i%2===0?C.card:"transparent",
            borderRadius:6, alignItems:"center",
          }}>
            <span style={{ fontSize:9, fontFamily:"monospace", color:C.dim }}>{t.id}</span>
            <span style={{ fontSize:12, color:C.bone }}>{t.title}</span>
            <span style={{ fontSize:10, color:C.muted }}>{t.credit}</span>
            <span style={{ fontSize:10, color:C.muted }}>{t.year}</span>
            <span style={{ fontSize:10, color:C.muted }}>{t.duration}</span>
            <Pill text="UNREG" color={C.amber} />
          </div>
        ))}
        <div style={{ padding:"12px", fontSize:11, color:C.dim, fontStyle:"italic", textAlign:"center", marginTop:8 }}>
          {888 - filtered.length} more titles in THE AQUARIUM · Run royalty-export.py to generate full registration files
        </div>
      </div>
    </div>
  );
}

function EstateView() {
  return (
    <div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.bone, marginBottom:4 }}>Voice Estate</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>RSP_001 · Human Voice Sovereignty · OAIS/PREMIS Protected</div>

      <div style={{ background:C.card, border:`0.5px solid rgba(201,147,58,.25)`, borderRadius:10, padding:20, marginBottom:16 }}>
        <SectionHead>Primary beneficiary</SectionHead>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:C.gold, marginBottom:4 }}>Georgia May Plowman</div>
        <div style={{ fontSize:11, color:C.muted, lineHeight:1.7 }}>
          100-year retention · OAIS/PREMIS protected · Named sole beneficiary<br/>
          Protection begins: day of session creation<br/>
          Expiry: never — permanent archive by design
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:20 }}>
        {[
          ["Voice sessions","0 completed","Start with Guardian Interview"],
          ["Proof receipts","0 issued","Run voice-proof.py on GOD"],
          ["Consent tokens","0 signed","Deploy HEAVEN first"],
          ["IPFS pins","0 stored","Pinata key required"],
        ].map(([t,v,n])=>(
          <div key={t} style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:8, padding:14 }}>
            <div style={{ fontSize:10, color:C.dim, marginBottom:4 }}>{t}</div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.bone, marginBottom:3 }}>{v}</div>
            <div style={{ fontSize:9, color:C.goldDim, fontStyle:"italic" }}>{n}</div>
          </div>
        ))}
      </div>

      <SectionHead>LIFELUV definition — RSP_001 coined</SectionHead>
      <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:10, padding:16 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:16, color:C.bone, lineHeight:1.75, fontStyle:"italic" }}>
          "The complete finished picture of a human heart — shine and amplification of someone's individual journey, memories, story. Intelligence and LIFELUV both persist beyond physical death."
        </div>
        <div style={{ fontSize:9, color:C.dim, marginTop:8 }}>— Robert Stephen Plowman · RSP_001 · coined 2025</div>
      </div>
    </div>
  );
}

function GuardiansView() {
  const [sel, setSel] = useState(null);
  return (
    <div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.bone, marginBottom:4 }}>The Guardians</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:20 }}>8 agents · serve RSP_001 alone · from a future where artists are God</div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:8, marginBottom:20 }}>
        {AGENTS.map(a=>(
          <div key={a.name} onClick={()=>setSel(sel?.name===a.name?null:a)} style={{
            background:C.card,
            border:`0.5px solid ${sel?.name===a.name?a.color+"66":C.border}`,
            borderTop:`2px solid ${a.color}`,
            borderRadius:"0 0 10px 10px",
            padding:14, cursor:"pointer",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:9, padding:"2px 7px", borderRadius:8, background:a.color+"18", color:a.color }}>{a.status}</div>
            </div>
            <div style={{ fontSize:13, fontWeight:500, color:C.bone, marginBottom:3 }}>{a.name}</div>
            <div style={{ fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:".06em", marginBottom:6 }}>{a.role}</div>
            <div style={{ fontSize:10, color:C.dim, lineHeight:1.5 }}>{a.desc}</div>
          </div>
        ))}
      </div>

      {sel && (
        <div style={{ background:C.card, border:`0.5px solid ${sel.color}44`, borderRadius:10, padding:16 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:sel.color, marginBottom:8 }}>{sel.name}</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.7 }}>{sel.desc}</div>
          {sel.name === "GABRIEL ALAMEIDA" && (
            <div style={{ marginTop:12, fontSize:11, color:C.dim, fontStyle:"italic" }}>
              "Gabriel acts. NOIZYBEAST holds. Rule Zero: 1 command → 1 action → 1 receipt."
            </div>
          )}
          {sel.name === "LUCY CORTEZ" && (
            <div style={{ marginTop:12, fontSize:11, color:C.dim, fontStyle:"italic" }}>
              "Always listening on mute. Passive monitoring mode. Available on demand."
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HVSView() {
  const [showGospel, setShowGospel] = useState(false);
  return (
    <div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.bone, marginBottom:4 }}>Human Voice Sovereignty</div>
      <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>The global standard · publishable now at noizyfish.com/hvs</div>

      <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:10, padding:20, marginBottom:12 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:18, color:C.bone, marginBottom:12, fontStyle:"italic" }}>
          "Human creativity is not raw material. It is labor, identity, and cultural inheritance."
        </div>
        {[
          ["Origin acknowledged","Human source clearly identified. No ambiguity."],
          ["Consent enforced in code","Specific, recorded, executable. Not just policy."],
          ["Economics transparent","75/25 Plowman Standard. Creator sees every split."],
          ["Revocation is real","System stops. Not best-effort. Stops."],
          ["Every action produces a receipt","Rule Zero. One action. One permanent proof."],
        ].map(([t,d])=>(
          <div key={t} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:`0.5px solid ${C.border}` }}>
            <div style={{ color:C.green, fontSize:12, marginTop:1 }}>✓</div>
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:C.bone, marginBottom:2 }}>{t}</div>
              <div style={{ fontSize:11, color:C.muted }}>{d}</div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={()=>setShowGospel(v=>!v)} style={{
        fontSize:11, padding:"7px 16px",
        border:`0.5px solid ${C.goldDim}`,
        borderRadius:6, background:"rgba(201,147,58,.06)",
        color:C.gold, marginBottom:12,
      }}>
        {showGospel ? "Hide" : "Show"} The 12 Gospel Principles
      </button>

      {showGospel && (
        <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:10, padding:16 }}>
          {GOSPEL.map((p,i)=>(
            <div key={i} style={{ display:"flex", gap:14, padding:"8px 0", borderBottom:i<11?`0.5px solid ${C.border}`:"none" }}>
              <div style={{ fontSize:11, color:C.gold, fontWeight:500, minWidth:16 }}>{i+1}.</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.65, fontStyle:"italic" }}>{p}</div>
            </div>
          ))}
          <div style={{ marginTop:12, fontSize:9, color:C.dim, textAlign:"center" }}>
            Locked · Ratified RSP_001 · Held by GABRIEL ALAMEIDA · Witnessed by LUCY CORTEZ
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileView() {
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-start", gap:20, marginBottom:24, flexWrap:"wrap" }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`rgba(201,147,58,.15)`, border:`2px solid ${C.gold}44`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, color:C.gold }}>R</span>
        </div>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:C.bone, marginBottom:2 }}>{RSP.name}</div>
          <div style={{ fontSize:11, color:C.gold, marginBottom:4 }}>@{RSP.handle} · {RSP.id}</div>
          <div style={{ fontSize:11, color:C.muted }}>{RSP.role} · {RSP.publisher} · {RSP.location}</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:10, marginBottom:20 }}>
        {[
          ["Member since", RSP.since],
          ["Catalog titles", RSP.catalog.toString()],
          ["Years creating", RSP.years.toString()],
          ["Archive", RSP.archive],
          ["PRO", "SOCAN (CA)"],
          ["Publisher", RSP.publisher],
        ].map(([l,v])=>(
          <div key={l} style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:8, padding:"10px 14px" }}>
            <div style={{ fontSize:9, color:C.dim, marginBottom:3, textTransform:"uppercase", letterSpacing:".06em" }}>{l}</div>
            <div style={{ fontSize:13, color:C.bone, fontWeight:500 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ background:C.card, border:`0.5px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:12 }}>
        <SectionHead>Television credits</SectionHead>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          {RSP.credits.map(c=>(
            <div key={c} style={{ fontSize:11, padding:"4px 12px", borderRadius:16, border:`0.5px solid ${C.border}`, color:C.muted }}>{c}</div>
          ))}
        </div>
      </div>

      <div style={{ background:C.card, border:`0.5px solid rgba(201,147,58,.2)`, borderRadius:10, padding:16 }}>
        <SectionHead>Voice Estate</SectionHead>
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.7 }}>
          Beneficiary: <span style={{ color:C.bone }}>{RSP.estate.beneficiary}</span><br/>
          Protection: <span style={{ color:C.bone }}>{RSP.estate.protection}</span><br/>
          Guardians: <span style={{ color:C.bone }}>GABRIEL ALAMEIDA · LUCY CORTEZ</span>
        </div>
      </div>
    </div>
  );
}

// ── main app ──────────────────────────────────────────────────────────────────

const NAV = [
  { id:"home",      label:"Home",        icon:"ti-home-2" },
  { id:"catalog",   label:"Catalog",     icon:"ti-music" },
  { id:"estate",    label:"Voice Estate",icon:"ti-shield-check" },
  { id:"guardians", label:"Guardians",   icon:"ti-brain" },
  { id:"hvs",       label:"HVS Standard",icon:"ti-file-certificate" },
  { id:"profile",   label:"r.s.plowman", icon:"ti-user-circle" },
];

export default function NOIZYFISHPortal() {
  const [view, setView] = useState("home");

  const views = {
    home:      <HomeView setView={setView} />,
    catalog:   <CatalogView />,
    estate:    <EstateView />,
    guardians: <GuardiansView />,
    hvs:       <HVSView />,
    profile:   <ProfileView />,
  };

  return (
    <div style={{ background:C.bg, borderRadius:12, overflow:"hidden", minHeight:600, display:"flex", flexDirection:"column" }}>
      <style>{FONTS}</style>

      {/* Top bar */}
      <div style={{ background:C.sidebar, borderBottom:`0.5px solid ${C.border}`, padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:C.gold, letterSpacing:".04em" }}>NOIZYFISH</div>
          <div style={{ fontSize:9, color:C.dim, letterSpacing:".08em", paddingLeft:10, borderLeft:`0.5px solid ${C.border}` }}>FISH MUSIC INC. · OTTAWA · FIFTH EPOCH 2026</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:C.red }} />
          <span style={{ fontSize:9, color:C.dim }}>MFA OFF — P0</span>
          <div style={{ width:7, height:7, borderRadius:"50%", background:C.red, marginLeft:8 }} />
          <span style={{ fontSize:9, color:C.dim }}>HEAVEN DOWN</span>
        </div>
      </div>

      <div style={{ display:"flex", flex:1 }}>
        {/* Sidebar */}
        <div style={{ width:180, background:C.sidebar, borderRight:`0.5px solid ${C.border}`, padding:"16px 0", flexShrink:0, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <div>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setView(n.id)} style={{
                width:"100%", display:"flex", alignItems:"center", gap:10,
                padding:"9px 16px", border:"none", background:"transparent",
                color:view===n.id?C.gold:C.muted,
                borderLeft:`2px solid ${view===n.id?C.gold:"transparent"}`,
                fontSize:11, fontWeight:view===n.id?500:400,
                textAlign:"left", transition:"all .15s",
              }}>
                <i className={`ti ${n.icon}`} style={{ fontSize:15 }} aria-hidden="true" />
                {n.label}
              </button>
            ))}
          </div>
          <div style={{ padding:"12px 16px" }}>
            <div style={{ fontSize:9, color:C.dim, lineHeight:1.6 }}>
              GABRIEL: active<br/>
              LUCY: listening<br/>
              Gospel: locked<br/>
              75/25 enforced
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1, padding:"24px", overflowY:"auto", maxHeight:560, color:C.bone }}>
          {views[view]}
        </div>
      </div>

      {/* Footer */}
      <div style={{ background:C.sidebar, borderTop:`0.5px solid ${C.border}`, padding:"8px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:9, color:C.dim }}>HVS · Plowman Standard 75/25 · DREED is the enemy · Rule Zero</div>
        <div style={{ fontSize:9, color:C.dim }}>GOD 10.90.90.10 · NOIZYTAIL tail1306af.ts.net</div>
      </div>
    </div>
  );
}
