import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import {
  Radio, MapPin, Plane, Music2, ZapOff, AlertCircle, RefreshCw, CheckCircle
} from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SurgeEvent {
  id: string;
  zone: string;
  type: 'airport' | 'concert' | 'sports' | 'bar' | 'university' | 'government';
  title: string;
  eta: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  riskFlag?: string;
  tip: string;
}

// ─── Ottawa Zone Intelligence Database ───────────────────────────────────────
const LIVE_SURGE_EVENTS: SurgeEvent[] = [
  {
    id: '1',
    zone: 'YOW Airport',
    type: 'airport',
    title: 'AC 421 + WJ 705 Landing in 12 mins',
    eta: 'Surge in ~18 mins',
    urgency: 'HIGH',
    tip: 'Position at Domestic Cell Lot. Domestic tips 30% higher than International.',
  },
  {
    id: '2',
    zone: 'Canadian Tire Centre',
    type: 'sports',
    title: 'Senators vs. Maple Leafs ends ~10:15 PM',
    eta: '14,000 fans dispersing',
    urgency: 'HIGH',
    tip: 'Stage on Palladium Drive. Avoid internal lot — security slow-walks you out.',
  },
  {
    id: '3',
    zone: 'NAC / Arts Court',
    type: 'concert',
    title: 'Orchestra concert ends ~9:45 PM',
    eta: 'Surge in ~25 mins',
    urgency: 'MEDIUM',
    tip: 'Elgin St & Slater St pickup. Passengers are formal, tip well, no loud music.',
  },
  {
    id: '4',
    zone: 'ByWard Market',
    type: 'bar',
    title: 'Last call 2:00 AM (Fri night)',
    eta: 'Surge 1:45–2:30 AM',
    urgency: 'HIGH',
    riskFlag: 'HIGH CANCEL & BELLIGERENT RISK — ByWard Fri/Sat after midnight',
    tip: 'Use AI Vibe Check before every accept. Avoid William St corridor 2:00–2:30 AM.',
  },
  {
    id: '5',
    zone: 'Gatineau (Casino)',
    type: 'concert',
    title: 'Casino event ending ~11:30 PM',
    eta: 'Demand across river',
    urgency: 'LOW',
    riskFlag: '⛔ DEADHEAD TRAP — Ontario drivers cannot pick up in Quebec',
    tip: 'Avoid crossing. If you drop off in Gatineau, get back to Ottawa via Portage Bridge immediately — the Uber app will stop showing requests until you cross back.',
  },
  {
    id: '6',
    zone: 'Kanata Tech Park',
    type: 'government',
    title: 'Shopify / Nokia shift change at 5:00 PM',
    eta: 'Surge in ~40 mins',
    urgency: 'MEDIUM',
    tip: 'Long trips to Centretown, $20–$35 fares. Excellent $/km ratio. Pre-position Hazeldean Rd.',
  },
];

const URGENCY_COLORS: Record<SurgeEvent['urgency'], string> = {
  HIGH: '#ff0055',
  MEDIUM: '#ff9900',
  LOW: '#00ffcc',
};

const TYPE_ICONS: Record<SurgeEvent['type'], React.ReactNode> = {
  airport: <Plane color="#00ffcc" size={20} />,
  concert: <Music2 color="#ff9900" size={20} />,
  sports: <Radio color="#ff0055" size={20} />,
  bar: <AlertCircle color="#ff9900" size={20} />,
  university: <MapPin color="#00ffcc" size={20} />,
  government: <MapPin color="#8892b0" size={20} />,
};

export default function SurgeOracle() {
  const [events, setEvents] = useState<SurgeEvent[]>(LIVE_SURGE_EVENTS);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just now');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    // In production: POST to n8n webhook → Skyvern scrapes YOW arrivals + event sites
    setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }));
      setIsRefreshing(false);
    }, 1500);
  }, []);

  const highUrgency = events.filter(e => e.urgency === 'HIGH');
  const otherEvents = events.filter(e => e.urgency !== 'HIGH');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SURGE ORACLE</Text>
          <Text style={styles.headerSub}>Ottawa-Gatineau Live Intelligence</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refresh} disabled={isRefreshing}>
          <RefreshCw color="#00ffcc" size={18} style={isRefreshing ? styles.spin : undefined} />
          <Text style={styles.refreshText}>{lastRefreshed}</Text>
        </TouchableOpacity>
      </View>

      {/* Active High-Priority Alerts */}
      {highUrgency.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.sectionTitle}>🔴 HIGH PRIORITY — ACT NOW</Text>
          {highUrgency.map(event => (
            <SurgeCard key={event.id} event={event} />
          ))}
        </View>
      )}

      {/* Upcoming Events */}
      <Text style={styles.sectionTitle}>📡 INCOMING DEMAND SIGNALS</Text>
      {otherEvents.map(event => (
        <SurgeCard key={event.id} event={event} />
      ))}

      {/* Gatineau Warning Banner */}
      <View style={styles.warningBanner}>
        <ZapOff color="#ff0055" size={22} />
        <View style={styles.warningContent}>
          <Text style={styles.warningTitle}>GATINEAU DEADHEAD PROTOCOL</Text>
          <Text style={styles.warningText}>
            Ontario-licensed drivers cannot pick up passengers in Quebec (Gatineau/Hull/Aylmer). Crossing for a drop-off forces an empty 100% return trip. The Offer Auditor automatically penalizes these trips.
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

function SurgeCard({ event }: { event: SurgeEvent }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <View style={[styles.card, { borderLeftColor: URGENCY_COLORS[event.urgency] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {TYPE_ICONS[event.type]}
          <View style={styles.cardTitleGroup}>
            <Text style={styles.cardZone}>{event.zone}</Text>
            <Text style={styles.cardTitle}>{event.title}</Text>
          </View>
        </View>
        <View style={[styles.urgencyBadge, { borderColor: URGENCY_COLORS[event.urgency] }]}>
          <Text style={[styles.urgencyText, { color: URGENCY_COLORS[event.urgency] }]}>
            {event.urgency}
          </Text>
        </View>
      </View>

      <Text style={styles.etaText}>{event.eta}</Text>

      {event.riskFlag && (
        <View style={styles.riskFlag}>
          <Text style={styles.riskText}>{event.riskFlag}</Text>
        </View>
      )}

      <View style={styles.tipBox}>
        <CheckCircle color="#00ffcc" size={14} />
        <Text style={styles.tipText}>{event.tip}</Text>
      </View>

      <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissed(true)}>
        <Text style={styles.dismissText}>NOTED — DISMISS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d10' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#00ffcc', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#8892b0', marginTop: 2 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  refreshText: { color: '#8892b0', fontSize: 11 },
  spin: { transform: [{ rotate: '45deg' }] },
  alertSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#8892b0', marginBottom: 10, letterSpacing: 1 },
  card: { backgroundColor: '#0f1319', borderWidth: 1, borderColor: '#1f2937', borderLeftWidth: 3, borderRadius: 8, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  cardTitleGroup: { flex: 1 },
  cardZone: { fontSize: 13, fontWeight: 'bold', color: '#ffffff' },
  cardTitle: { fontSize: 12, color: '#8892b0', marginTop: 2 },
  urgencyBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  urgencyText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  etaText: { fontSize: 12, color: '#00ffcc', marginBottom: 6, fontWeight: '600' },
  riskFlag: { backgroundColor: '#ff005515', borderColor: '#ff005533', borderWidth: 1, borderRadius: 4, padding: 6, marginBottom: 8 },
  riskText: { color: '#ff0055', fontSize: 11, fontWeight: 'bold' },
  tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#00ffcc08', borderColor: '#00ffcc22', borderWidth: 1, borderRadius: 4, padding: 8, marginBottom: 10 },
  tipText: { color: '#8892b0', fontSize: 11, lineHeight: 15, flex: 1 },
  dismissBtn: { alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 8 },
  dismissText: { color: '#374151', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ff005510', borderColor: '#ff005533', borderWidth: 1, borderRadius: 8, padding: 14, gap: 12, marginTop: 8 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 12, fontWeight: 'bold', color: '#ff0055', marginBottom: 4 },
  warningText: { fontSize: 11, color: '#8892b0', lineHeight: 16 },
});
