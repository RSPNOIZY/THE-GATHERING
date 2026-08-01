import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import { Send, Sparkles, TrendingUp, Calendar, FileText, DollarSign } from 'lucide-react-native';

// ─── Lucy Persona ─────────────────────────────────────────────────────────────
const LUCY_SYSTEM_CONTEXT = `You are Lucy, the Supersonic AI business strategy assistant for Robert Plowman, an independent rideshare driver in Ottawa, Ontario, Canada. You specialize in:
1. Canadian CRA self-employment tax optimization (mileage, Class 10.1 CCA, business expenses)
2. Ottawa-Gatineau rideshare market intelligence (YOW, ByWard, Kanata, Parliament Hill)
3. Uber & Lyft business strategy (offer filtering, zone timing, 5-star maintenance)
4. NOIZY Empire business coaching (earnings growth, brand, sustainability)
Your tone is sharp, direct, empowering, and never corporate-sounding. Robert is a business owner — treat him as one.`;

// ─── Quick Prompts ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: <Calendar color="#00ffcc" size={16} />, label: 'Shift Briefing', prompt: 'Give me my morning shift briefing. What zones should I start in? Any Ottawa events today?' },
  { icon: <TrendingUp color="#ff9900" size={16} />, label: 'Earnings Review', prompt: 'Analyze my earnings this week. What can I optimize to hit $200/day net?' },
  { icon: <FileText color="#8892b0" size={16} />, label: 'CRA Question', prompt: 'What CRA expenses can I write off as an Uber/Lyft driver in Ontario?' },
  { icon: <DollarSign color="#00ff55" size={16} />, label: 'Rogers Plan ROI', prompt: 'Is Rogers Ultimate 5G ($130/mo) worth upgrading to for my car hotspot setup? Calculate the business deduction and ROI.' },
];

// ─── Canned Responses (pre-built until n8n/Ollama hook is live) ──────────────
const LUCY_RESPONSES: Record<string, string> = {
  'shift': `🟢 **SHIFT BRIEFING — Ottawa, ${new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}**

**Weather:** Check Environment Canada. If precipitation — surge is guaranteed at shift end (16:00–18:30) and bar close (02:00).

**Today's Priority Zones:**
1. **YOW Airport (Domestic)** — Check arrivals board. AC & WJ flights 17:00–19:00 = 🔥 high demand
2. **Kanata Tech Park (Palladium / Hazeldean)** — Shift change 17:00. Long $25–$40 rides to Centretown
3. **Parliament Hill** — Clear at 17:30. Gov employees heading home. Reliable, quiet, medium tip

**Zone Avoids Tonight:**
- ByWard Market before midnight (short trips, tourist zone)
- Gatineau (deadhead trap — no Quebec pickups)

**Minimum Accept Threshold:** $1.20/km or $28/hr gross. Stick to it. 💪`,

  'earnings': `📊 **EARNINGS OPTIMIZATION ANALYSIS**

Based on your current shift data ($187 gross / 6.5hrs):
- Current rate: **$28.83/hr gross**
- Target: $35/hr gross = **$200/day in 6hr shift**

**Gap: $6.17/hr — Here's how to close it:**

1. **Cut Deadhead 5% → Save ~$0.80/hr** — Pre-position after drops. Never drive more than 2km to next pickup
2. **Add 2 Airport Runs/Shift** — YOW domestic averages $31.50. 2 runs = +$63/shift
3. **Decline all sub-$12 offers** — 3 bad trips at 20 min each = 1hr of $12/hr instead of $35
4. **Work the Senate/Parliament zone 17:00–18:30** — Reliable $18–$22 fares with zero deadhead return to core

**Monthly projection at $35/hr (20hr/wk):** ~**$3,640 gross / $3,120 net CAD**`,

  'cra': `🏛️ **CRA SELF-EMPLOYMENT DEDUCTIONS — ONTARIO UBER/LYFT**

As a self-employed gig driver, you can deduct:

**Vehicle Expenses (Business % of total km):**
- ⛽ Fuel
- 🔧 Repairs & maintenance  
- 🛡️ Insurance (commercial uplift portion)
- 📋 Registration & licensing
- 💰 Class 10.1 CCA (30% declining balance on vehicle cost, capped at $37,000 for 2026)

**Direct Business Expenses:**
- 📱 Rogers cell plan (business % — you use it for Uber app = 80-100% business)
- 📸 Dashcam (100% deductible)
- 🎧 BlueParrott headset (100% deductible)
- 🚗 Car wash (commercial drivers — deductible)
- 💻 Noizymobile app pro-ration (100% deductible as software tool)

**HST/GST Note:** If you earn over $30,000 in 4 consecutive calendar quarters, you MUST register for a GST/HST number. Uber remits HST on your behalf — check your annual tax summary.

**Key Form:** T2125 (Statement of Business Activities). File by June 15 if self-employed (but pay by April 30 to avoid interest).`,

  'rogers': `📡 **ROGERS ULTIMATE 5G — BUSINESS ROI ANALYSIS**

**Plan Cost:** ~$130/mo CAD (Rogers Ultimate 5G, Unlimited, 5G access)

**CRA Business Deduction:**
- Uber app: ~70% business use → **$91/mo deductible**
- Effective after-tax cost (at 26% marginal rate): **~$96/mo**

**Network Value:**
- 5G Personal Hotspot via iPhone → iPad co-pilot screen in car = enterprise-grade workflow
- Wireless CarPlay (iPhone 15 Pro Max) handles driving navigation while personal hotspot powers the iPad console
- Replaces need for separate in-car data plan ($0 additional device fee)

**Competitive Alternative:** Rogers Performance ($65/mo, 100GB) — saves $65/mo but throttled hotspot. For an AI-powered car office, Ultimate is the right call.

**ROI Verdict:** ✅ **WORTH IT.** At $96/mo effective cost, you recover this with 3 extra YOW airport runs per month ($93+). The network reliability on 5G SA (standalone) also reduces dropped n8n webhooks from your mobile edge server. This is infrastructure, not a luxury.`
};

function getLucyResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('shift') || p.includes('briefing') || p.includes('zone') || p.includes('start')) return LUCY_RESPONSES['shift'];
  if (p.includes('earn') || p.includes('200') || p.includes('optim') || p.includes('week')) return LUCY_RESPONSES['earnings'];
  if (p.includes('cra') || p.includes('tax') || p.includes('deduct') || p.includes('write')) return LUCY_RESPONSES['cra'];
  if (p.includes('rogers') || p.includes('5g') || p.includes('hotspot') || p.includes('plan')) return LUCY_RESPONSES['rogers'];
  return `I got you. Let me think through this... 

For questions like "${prompt}", here's my quick take: the answer always comes back to the same three numbers — **$/hr, $/km, and deadhead ratio**. Whatever decision you're making, run it through that filter first. 

For a deeper analysis, connect me to your n8n data pipeline so I can pull live shift stats. Go to Settings → n8n Webhook → enter your MacBook's local IP to unlock full AI mode. 🔥`;
}

interface Message {
  id: string;
  role: 'user' | 'lucy';
  content: string;
  time: string;
}

export default function LucyAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'lucy',
      content: "Hey Robert 👋 I'm Lucy — your Supersonic AI business partner. What are we optimizing today? Hit a quick action below or type anything.",
      time: new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const lucyResponse = getLucyResponse(msg);
      const lucyMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'lucy',
        content: lucyResponse,
        time: new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, lucyMsg]);
      setIsThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={120}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.lucyAvatar}>
          <Sparkles color="#000" size={20} />
        </View>
        <View>
          <Text style={styles.headerTitle}>LUCY</Text>
          <Text style={styles.headerSub}>Supersonic AI · Rideshare Strategy</Text>
        </View>
        <View style={styles.onlineTag}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {QUICK_ACTIONS.map((action, i) => (
          <TouchableOpacity key={i} style={styles.quickBtn} onPress={() => sendMessage(action.prompt)}>
            {action.icon}
            <Text style={styles.quickBtnText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <ScrollView ref={scrollRef} style={styles.messageList} contentContainerStyle={styles.messageListContent}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.lucyBubble]}>
            {msg.role === 'lucy' && (
              <View style={styles.lucyLabel}>
                <Sparkles color="#00ffcc" size={10} />
                <Text style={styles.lucyLabelText}>LUCY</Text>
              </View>
            )}
            <Text style={msg.role === 'user' ? styles.userText : styles.lucyText}>{msg.content}</Text>
            <Text style={styles.messageTime}>{msg.time}</Text>
          </View>
        ))}
        {isThinking && (
          <View style={[styles.messageBubble, styles.lucyBubble]}>
            <View style={styles.lucyLabel}>
              <Sparkles color="#00ffcc" size={10} />
              <Text style={styles.lucyLabelText}>LUCY</Text>
            </View>
            <Text style={styles.thinkingText}>Thinking... ⚡</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Lucy anything..."
          placeholderTextColor="#374151"
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()}>
          <Send color="#000" size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d10' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  lucyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#00ffcc', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#8892b0' },
  onlineTag: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff55' },
  onlineText: { color: '#00ff55', fontSize: 9, fontWeight: 'bold' },
  quickActions: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  quickBtnText: { color: '#8892b0', fontSize: 12 },
  messageList: { flex: 1 },
  messageListContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '88%', borderRadius: 12, padding: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#00ffcc22', borderColor: '#00ffcc33', borderWidth: 1, borderBottomRightRadius: 2 },
  lucyBubble: { alignSelf: 'flex-start', backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderBottomLeftRadius: 2 },
  lucyLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  lucyLabelText: { color: '#00ffcc', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
  lucyText: { color: '#e2e8f0', fontSize: 13, lineHeight: 19 },
  userText: { color: '#ffffff', fontSize: 13, lineHeight: 19 },
  messageTime: { color: '#374151', fontSize: 9, marginTop: 4, alignSelf: 'flex-end' },
  thinkingText: { color: '#8892b0', fontSize: 13, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#1f2937', alignItems: 'flex-end' },
  textInput: { flex: 1, backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#ffffff', fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00ffcc', alignItems: 'center', justifyContent: 'center' },
});
