const templates = {
    "1": {
        title: "Dreamchamber Launch",
        fields: ['title', 'goal', 'deliverables', 'constraints', 'vibe'],
        pattern: (f) => `Start dreamchamber: ${f.title || '[ Title ]'}
Goal: ${f.goal || '[ one-sentence outcome ]'}
Deliverables: ${f.deliverables || '[ list ]'}
Constraints: ${f.constraints || '[ budget; date; must-haves ]'}
Vibe: ${f.vibe || '[ tone: executive / playful / cinematic ]'}
Start`
    },
    "6": {
        title: "Infrastructure Recovery",
        fields: ['service', 'error', 'logs'],
        pattern: (f) => `Forge task: Infrastructure Recovery // vibe: field agent
Goal: Diagnose and fix Cloudflare ${f.error || '522'} on ${f.service || '[ domain ]'}.
Deliverables: Root cause analysis; fix verification; failover plan. Start`
    },
    "8": {
        title: "Founder Architecture",
        fields: ['stack', 'flow', 'goal'],
        pattern: (f) => `Forge task: Founder Architecture // vibe: executive
Goal: Blueprint the ${f.goal || 'NOIZY.AI'} agentic system.
Deliverables: founder‑grade architecture doc; module map; integration strategy. Start`
    },
    "13": {
        title: "Spring Boot Fixer",
        fields: ['path', 'error', 'package'],
        pattern: (f) => `Forge task: Spring Boot Fixer // vibe: field agent
Goal: Fix 404 error on @RequestMapping for ${f.path || '[ URL path ]'}.
Deliverables: Controller scan verification; @RestController audit; fix verification. Start`
    },
    "17": {
        title: "Discord Bot Deployment",
        fields: ['appId', 'token', 'serverIp'],
        pattern: (f) => `Forge task: Discord Bot Deployment // vibe: studio
Goal: Deploy NOIZY Discord Bot on GABRIEL (${f.serverIp || '10.90.90.20'}).
Deliverables: PM2 process initialization; intent verification; voice memo reaction test. Start`
    },
    "18": {
        title: "Slack Bot Deployment",
        fields: ['socketToken', 'botToken', 'serverIp'],
        pattern: (f) => `Forge task: Slack Bot Deployment // vibe: executive
Goal: Deploy NOIZY Slack Bot in Socket Mode on GABRIEL (${f.serverIp || '10.90.90.20'}).
Deliverables: PM2 process initialization; event subscription test; /noizy command verification. Start`
    },
    "19": {
        title: "Learning Node Blueprint",
        fields: ['concept', 'nodes', 'connections'],
        pattern: (f) => `Forge task: Learning Node Blueprint // vibe: dreamchamber
Goal: Map the concept of "${f.concept || '[ Concept ]'}" into a visual node structure.
Nodes: ${f.nodes || '[ primary nodes ]'}
Connections: ${f.connections || '[ semantic links ]'}
Deliverables: Mermaid diagram; 3-slide visual deck; obsidian-ready map. Start`
    },
    "20": {
        title: "Executive Function Exoskeleton",
        fields: ['task', 'blockers', 'support'],
        pattern: (f) => `Forge task: Executive Function Exoskeleton // vibe: studio
Goal: De-friction the task: "${f.task || '[ Task ]'}".
Blockers: ${f.blockers || '[ friction points ]'}
Support: ${f.support || '[ AI scaffolding needed ]'}
Deliverables: Step-by-step node map; automated reminders; "one-click" initiation script. Start`
    },
    "14": { title: "Discord Router", fields: ['webhookUrl'], pattern: (f) => `Discord Router: ${f.webhookUrl}` },
    "15": { title: "Slack Agent Connector", fields: ['appId'], pattern: (f) => `Slack App: ${f.appId}` },
    "16": { title: "Cloudflare Edge Routing", fields: ['domain'], pattern: (f) => `Edge: ${f.domain}` },
    "9": { title: "PPTX Slide Blueprint", fields: ['title'], pattern: (f) => `Slide: ${f.title}` },
    "10": { title: "Cognitive Mapping", fields: ['topic'], pattern: (f) => `Map: ${f.topic}` },
    "11": { title: "Task Dragger", fields: ['projects'], pattern: (f) => `Board: ${f.projects}` },
    "12": { title: "Project Cockpit", fields: ['name'], pattern: (f) => `Cockpit: ${f.name}` }
};

function updateGenerator() {
    const type = document.getElementById('template-select').value;
    const container = document.getElementById('generator-inputs');
    const config = templates[type];
    
    if (!config) return;

    container.innerHTML = (config.fields || []).map(field => `
        <div class="input-group">
            <label>${field.replace(/([A-Z])/g, ' $1')}</label>
            <input type="text" class="custom-input" placeholder="Enter ${field}..." oninput="generatePrompt()" data-field="${field}">
        </div>
    `).join('');
    
    generatePrompt();
}

function generatePrompt() {
    const type = document.getElementById('template-select').value;
    const inputs = document.querySelectorAll('#generator-inputs input');
    const fields = {};
    inputs.forEach(input => {
        fields[input.dataset.field] = input.value;
    });
    
    if (templates[type]) {
        const prompt = templates[type].pattern(fields);
        document.getElementById('generated-prompt').innerText = prompt;
    }
}

function copyTemplate(id) {
    const el = document.getElementById(id);
    const text = el.tagName === 'CODE' ? el.innerText : el.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector(`button[onclick="copyTemplate('${id}')"]`);
        if (!btn) return;
        const originalText = btn.innerHTML;
        
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Signal Captured
        `;
        btn.style.boxShadow = '0 0 20px rgba(0, 242, 255, 0.4)';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.boxShadow = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-up');
        }
    });
}, observerOptions);

const architectures = {
    'A': {
        name: "Full OS",
        prompt: "Forge task: Blueprint Full OS PPTX // vibe: executive\nGoal: Create a master architecture for the NOIZY.AI Cognitive Exoskeleton.\nSlides: 1. Hub (System Map), 2. Labs (R&D), 3. Swarm (Bots/Ops), 4. Vault (Memory), 5. Flow (Task Logic).\nDeliverables: Slide-by-slide content map; node-based navigation guide. Start"
    },
    'B': {
        name: "Creative Lab",
        prompt: "Forge task: Blueprint Creative Lab PPTX // vibe: cinematic\nGoal: Design the creative identity and R&D branch of the Dreamchamber.\nSlides: 1. Identity (Brand), 2. Music (Acoustics), 3. Visuals (Art), 4. Synthesis (Creative AI).\nDeliverables: Visual style guide; asset organization map. Start"
    },
    'D': {
        name: "Hybrid",
        prompt: "Forge task: Blueprint Hybrid Core PPTX // vibe: studio\nGoal: Build a balanced operational and creative foundation.\nSlides: 1. Gateway (Entry), 2. Operational Hub (Daily), 3. Creative R&D (Music/AI), 4. Vault (Storage).\nDeliverables: Modular slide structure; interaction logic. Start"
    },
    'E': {
        name: "Minimal",
        prompt: "Forge task: Blueprint Minimal Seed PPTX // vibe: field agent\nGoal: Create the absolute minimum viable exoskeleton.\nSlides: 1. Core (Now), 2. Growth (Next), 3. Vision (Later).\nDeliverables: 3-slide core map. Start"
    }
};

function selectPPTX(arch) {
    document.querySelectorAll('.pptx-option').forEach(opt => opt.classList.remove('active'));
    const selectedOpt = document.querySelector(`.pptx-option[onclick="selectPPTX('${arch}')"]`);
    if (selectedOpt) selectedOpt.classList.add('active');

    const config = architectures[arch];
    if (config) {
        document.getElementById('pptx-blueprint-cmd').innerText = config.prompt;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('section').forEach(section => observer.observe(section));
    updateGenerator();
    selectPPTX('D'); // Default selection
});
