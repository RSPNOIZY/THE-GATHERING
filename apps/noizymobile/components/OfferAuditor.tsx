import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput
} from 'react-native';
import {
  Mic, CheckCircle, XCircle, AlertTriangle, Target, TrendingUp, Clock
} from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuditResult {
  decision: 'ACCEPT' | 'DECLINE';
  reason: string;
  grossFare: number;
  distanceKm: number;
  durationMin: number;
  ratePerHour: number;
  ratePerKm: number;
  isGatineau: boolean;
  effectiveRatePerKm?: number;
  color: string;
}

// ─── Ottawa Red Zones (time-sensitive high-risk pickup locations) ─────────────
const RED_ZONES: Record<string, { risk: string; hours?: string }> = {
  'byward': { risk: 'HIGH cancel & aggression risk', hours: 'Fri–Sat 11PM–3AM' },
  'rideau street': { risk: 'High cancel risk', hours: 'Late night' },
  'sparks street': { risk: 'Tourist area — short low-value trips' },
};

// ─── Gatineau Detection ───────────────────────────────────────────────────────
const GATINEAU_KEYWORDS = [
  'gatineau', 'hull', 'aylmer', 'chelsea', 'wakefield',
  'boulevard de la gappe', 'promenade du portage', 'casino lac-leamy',
  'macdonald-cartier', 'alexandra bridge', 'portage bridge'
];

function isGatineauDestination(dest: string): boolean {
  const d = dest.toLowerCase();
  return GATINEAU_KEYWORDS.some(kw => d.includes(kw));
}

function auditOffer(
  grossFare: number,
  distanceKm: number,
  durationMin: number,
  destination: string,
  pickupKm: number = 0
): AuditResult {
  const totalKm = distanceKm + pickupKm;
  const gatineau = isGatineauDestination(destination);
  const effectiveKm = gatineau ? totalKm * 2 : totalKm; // double for empty return
  const ratePerHour = (grossFare / durationMin) * 60;
  const ratePerKm = grossFare / totalKm;
  const effectiveRatePerKm = grossFare / effectiveKm;

  const MIN_HOURLY = 25.0;
  const MIN_PER_KM = 1.00;
  const MIN_EFFECTIVE_PER_KM = 0.75;

  let decision: 'ACCEPT' | 'DECLINE' = 'ACCEPT';
  let reason = '';

  if (gatineau && effectiveRatePerKm < MIN_EFFECTIVE_PER_KM) {
    decision = 'DECLINE';
    reason = `Gatineau Deadhead Trap. Effective rate $${effectiveRatePerKm.toFixed(2)}/km after empty return.`;
  } else if (ratePerHour < MIN_HOURLY) {
    decision = 'DECLINE';
    reason = `Below hourly target. $${ratePerHour.toFixed(2)}/hr vs $${MIN_HOURLY} minimum.`;
  } else if (ratePerKm < MIN_PER_KM) {
    decision = 'DECLINE';
    reason = `Below per-km target. $${ratePerKm.toFixed(2)}/km vs $${MIN_PER_KM} minimum.`;
  } else {
    reason = `Strong offer. $${ratePerHour.toFixed(2)}/hr, $${ratePerKm.toFixed(2)}/km.`;
  }

  return {
    decision,
    reason,
    grossFare,
    distanceKm,
    durationMin,
    ratePerHour,
    ratePerKm,
    isGatineau: gatineau,
    effectiveRatePerKm: gatineau ? effectiveRatePerKm : undefined,
    color: decision === 'ACCEPT' ? '#00ff55' : '#ff0055',
  };
}

// ─── Recent Audits History ────────────────────────────────────────────────────
const SAMPLE_HISTORY: Array<{ result: AuditResult; time: string }> = [
  { result: auditOffer(18.50, 14.2, 22, 'Kanata'), time: '11:34 PM' },
  { result: auditOffer(8.20, 12.0, 18, 'Gatineau Hull', 2.1), time: '11:08 PM' },
  { result: auditOffer(31.00, 22.4, 28, 'YOW Airport'), time: '10:47 PM' },
];

export default function OfferAuditor() {
  const [fare, setFare] = useState('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [destination, setDestination] = useState('');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [history] = useState(SAMPLE_HISTORY);

  const runAudit = () => {
    const f = parseFloat(fare);
    const d = parseFloat(distance);
    const dur = parseFloat(duration);
    if (!f || !d || !dur || !destination.trim()) return;
    const r = auditOffer(f, d, dur, destination, 1.5);
    setResult(r);
  };

  const clearForm = () => {
    setFare('');
    setDistance('');
    setDuration('');
    setDestination('');
    setResult(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>OFFER AUDITOR</Text>
          <Text style={styles.headerSub}>AI Vibe Check — No TOS Violation</Text>
        </View>
        <View style={styles.safeTag}>
          <CheckCircle color="#00ff55" size={12} />
          <Text style={styles.safeText}>UBER TOS SAFE</Text>
        </View>
      </View>

      {/* How It Works */}
      <View style={styles.howItWorksBox}>
        <Mic color="#ff9900" size={16} />
        <Text style={styles.howItWorksText}>
          Take a screenshot of the incoming Uber offer → tap the iPhone Action Button → Siri Shortcut reads aloud the ACCEPT/DECLINE decision in 2 seconds via BlueParrott. Or use the manual form below.
        </Text>
      </View>

      {/* Manual Audit Form */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>MANUAL OFFER AUDIT</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>FARE (CAD $)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={fare} onChangeText={setFare} placeholder="18.50" placeholderTextColor="#374151" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DISTANCE (km)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={distance} onChangeText={setDistance} placeholder="14.2" placeholderTextColor="#374151" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>DURATION (min)</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={duration} onChangeText={setDuration} placeholder="22" placeholderTextColor="#374151" />
          </View>
        </View>

        <Text style={styles.inputLabel}>DESTINATION</Text>
        <TextInput style={[styles.input, styles.inputFull]} value={destination} onChangeText={setDestination} placeholder="e.g. Kanata, Gatineau, YOW Airport" placeholderTextColor="#374151" />

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.auditBtn} onPress={runAudit}>
            <Target color="#000" size={20} />
            <Text style={styles.auditBtnText}>AUDIT THIS OFFER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearBtn} onPress={clearForm}>
            <Text style={styles.clearBtnText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Audit Result */}
      {result && (
        <View style={[styles.resultCard, { borderColor: result.color }]}>
          <View style={styles.resultHeader}>
            {result.decision === 'ACCEPT'
              ? <CheckCircle color={result.color} size={36} />
              : <XCircle color={result.color} size={36} />
            }
            <Text style={[styles.resultDecision, { color: result.color }]}>
              {result.decision}
            </Text>
          </View>
          <Text style={styles.resultReason}>{result.reason}</Text>

          {result.isGatineau && (
            <View style={styles.gatineauAlert}>
              <AlertTriangle color="#ff0055" size={14} />
              <Text style={styles.gatineauText}>
                Gatineau destination detected. Effective rate after empty return: ${result.effectiveRatePerKm?.toFixed(2)}/km
              </Text>
            </View>
          )}

          <View style={styles.resultMetrics}>
            <View style={styles.resultMetric}>
              <Clock color="#8892b0" size={14} />
              <Text style={styles.resultMetricValue}>${result.ratePerHour.toFixed(2)}</Text>
              <Text style={styles.resultMetricLabel}>/hr</Text>
            </View>
            <View style={styles.resultMetric}>
              <TrendingUp color="#8892b0" size={14} />
              <Text style={styles.resultMetricValue}>${result.ratePerKm.toFixed(2)}</Text>
              <Text style={styles.resultMetricLabel}>/km</Text>
            </View>
            <View style={styles.resultMetric}>
              <Target color="#8892b0" size={14} />
              <Text style={styles.resultMetricValue}>${result.grossFare.toFixed(2)}</Text>
              <Text style={styles.resultMetricLabel}>gross</Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent History */}
      <Text style={styles.sectionTitle}>RECENT AUDIT HISTORY</Text>
      {history.map((item, i) => (
        <View key={i} style={styles.historyRow}>
          <View style={[styles.historyDot, { backgroundColor: item.result.color }]} />
          <View style={styles.historyContent}>
            <Text style={styles.historyDecision} numberOfLines={1}>
              {item.result.decision} — ${item.result.grossFare} / {item.result.distanceKm}km → {item.result.isGatineau ? 'Gatineau ⛔' : 'Ottawa'}
            </Text>
            <Text style={styles.historyRate}>
              ${item.result.ratePerHour.toFixed(2)}/hr · ${item.result.ratePerKm.toFixed(2)}/km
            </Text>
          </View>
          <Text style={styles.historyTime}>{item.time}</Text>
        </View>
      ))}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d10' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#00ffcc', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#8892b0', marginTop: 2 },
  safeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00ff5510', borderColor: '#00ff5533', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  safeText: { color: '#00ff55', fontSize: 9, fontWeight: 'bold' },
  howItWorksBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#ff990010', borderColor: '#ff990033', borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 16 },
  howItWorksText: { color: '#8892b0', fontSize: 12, lineHeight: 17, flex: 1 },
  panel: { backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  panelTitle: { fontSize: 11, fontWeight: 'bold', color: '#8892b0', marginBottom: 14, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  inputGroup: { flex: 1 },
  inputLabel: { fontSize: 10, color: '#8892b0', fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 },
  input: { backgroundColor: '#0a0d10', borderColor: '#1f2937', borderWidth: 1, borderRadius: 6, padding: 10, color: '#ffffff', fontSize: 15 },
  inputFull: { marginBottom: 14 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  auditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00ffcc', borderRadius: 8, paddingVertical: 14, gap: 8 },
  auditBtnText: { fontSize: 15, fontWeight: 'bold', color: '#000', letterSpacing: 1 },
  clearBtn: { backgroundColor: '#1f2937', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#8892b0', fontSize: 13 },
  resultCard: { borderWidth: 2, borderRadius: 10, padding: 16, marginBottom: 16, backgroundColor: '#0f1319' },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  resultDecision: { fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  resultReason: { color: '#ffffff', fontSize: 14, marginBottom: 10, lineHeight: 20 },
  gatineauAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#ff005510', borderRadius: 4, padding: 8, marginBottom: 10 },
  gatineauText: { color: '#ff0055', fontSize: 11, flex: 1 },
  resultMetrics: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 12 },
  resultMetric: { alignItems: 'center', gap: 2 },
  resultMetricValue: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  resultMetricLabel: { fontSize: 10, color: '#8892b0' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#8892b0', marginBottom: 10, letterSpacing: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 6, padding: 10, marginBottom: 8 },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyContent: { flex: 1 },
  historyDecision: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  historyRate: { color: '#8892b0', fontSize: 11 },
  historyTime: { color: '#64748b', fontSize: 11 },
});
