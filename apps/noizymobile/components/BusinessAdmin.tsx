import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import {
  TrendingUp, DollarSign, Clock, Navigation,
  BarChart2, Award, AlertTriangle, CheckCircle
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Mock shift data (replace with live n8n webhook data) ---
const SHIFT_DATA = {
  grossToday: 187.40,
  netToday: 161.23,
  hoursActive: 6.5,
  tripsCompleted: 14,
  kmDriven: 142.6,
  kmBusiness: 131.4,
  kmDeadhead: 11.2,
  acceptanceRate: 88,
  avgTripCAD: 13.39,
  avgTipCAD: 1.80,
  topZone: 'YOW Airport',
  kineticScore: 94,
};

const CRA_RATE_PER_KM = 0.70; // 2026 CRA business mileage rate
const FUEL_PER_KM = 0.12;
const MAINT_PER_KM = 0.08;

function StatCard({
  label, value, sub, color = '#00ffcc', icon
}: {
  label: string; value: string; sub?: string; color?: string; icon?: React.ReactNode;
}) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      {icon}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function BusinessAdmin() {
  const [activeTab, setActiveTab] = useState<'today' | 'cra' | 'depreciation'>('today');

  const craDeduction = (SHIFT_DATA.kmBusiness * CRA_RATE_PER_KM).toFixed(2);
  const fuelCost = (SHIFT_DATA.kmDriven * FUEL_PER_KM).toFixed(2);
  const maintCost = (SHIFT_DATA.kmDriven * MAINT_PER_KM).toFixed(2);
  const deadheadPct = ((SHIFT_DATA.kmDeadhead / SHIFT_DATA.kmDriven) * 100).toFixed(1);

  // Class 10.1 CCA (30% declining balance on vehicle used for business)
  const vehicleCostCAD = 55000;
  const businessUsePct = (SHIFT_DATA.kmBusiness / SHIFT_DATA.kmDriven) * 100;
  const ccaClass = businessUsePct > 50 ? '10.1' : '10';
  const annualCCA = (vehicleCostCAD * 0.30 * (businessUsePct / 100)).toFixed(0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>BUSINESS ADMIN</Text>
          <Text style={styles.headerSub}>CRA-Compliant Canadian Ledger</Text>
        </View>
        <View style={[styles.badge, { borderColor: SHIFT_DATA.kineticScore > 90 ? '#00ff55' : '#ff9900' }]}>
          <Award color={SHIFT_DATA.kineticScore > 90 ? '#00ff55' : '#ff9900'} size={14} />
          <Text style={[styles.badgeText, { color: SHIFT_DATA.kineticScore > 90 ? '#00ff55' : '#ff9900' }]}>
            KINETIC {SHIFT_DATA.kineticScore}
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(['today', 'cra', 'depreciation'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'today' ? "TODAY'S SHIFT" : tab === 'cra' ? 'CRA WRITE-OFFS' : 'CLASS 10.1 CCA'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TODAY'S SHIFT TAB */}
      {activeTab === 'today' && (
        <>
          {/* Earnings Row */}
          <View style={styles.earningsHero}>
            <View style={styles.earningsMain}>
              <DollarSign color="#00ffcc" size={28} />
              <Text style={styles.grossAmount}>${SHIFT_DATA.grossToday.toFixed(2)}</Text>
              <Text style={styles.grossLabel}>GROSS (CAD)</Text>
            </View>
            <View style={styles.earningsSide}>
              <Text style={styles.netAmount}>${SHIFT_DATA.netToday.toFixed(2)}</Text>
              <Text style={styles.netLabel}>NET PROFIT</Text>
              <Text style={styles.netRateHr}>
                ${(SHIFT_DATA.grossToday / SHIFT_DATA.hoursActive).toFixed(2)}/hr
              </Text>
              <Text style={styles.netRateKm}>
                ${(SHIFT_DATA.grossToday / SHIFT_DATA.kmDriven).toFixed(2)}/km
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard label="Hours Active" value={`${SHIFT_DATA.hoursActive}h`} color="#00ffcc" icon={<Clock color="#00ffcc" size={18} />} />
            <StatCard label="Trips" value={`${SHIFT_DATA.tripsCompleted}`} color="#ff9900" icon={<Navigation color="#ff9900" size={18} />} />
            <StatCard label="Acceptance" value={`${SHIFT_DATA.acceptanceRate}%`} sub="Target: 85%+" color="#00ff55" icon={<CheckCircle color="#00ff55" size={18} />} />
            <StatCard label="Deadhead" value={`${deadheadPct}%`} sub="Target: <20%" color={parseFloat(deadheadPct) > 20 ? '#ff0055' : '#00ff55'} icon={<AlertTriangle color={parseFloat(deadheadPct) > 20 ? '#ff0055' : '#00ff55'} size={18} />} />
          </View>

          {/* Top Zone */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>TOP EARNING ZONE TODAY</Text>
            <View style={styles.zoneRow}>
              <BarChart2 color="#00ffcc" size={22} />
              <Text style={styles.zoneText}>{SHIFT_DATA.topZone}</Text>
              <Text style={styles.zoneAvg}>Avg ${SHIFT_DATA.avgTripCAD.toFixed(2)} / trip</Text>
            </View>
          </View>
        </>
      )}

      {/* CRA WRITE-OFFS TAB */}
      {activeTab === 'cra' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>CRA SELF-EMPLOYED DEDUCTIONS — TODAY</Text>

          <View style={styles.craRow}>
            <Text style={styles.craLabel}>Business KM (logged)</Text>
            <Text style={styles.craValue}>{SHIFT_DATA.kmBusiness.toFixed(1)} km</Text>
          </View>
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>CRA Mileage Rate (2026)</Text>
            <Text style={styles.craValue}>$0.70/km</Text>
          </View>
          <View style={[styles.craRow, styles.craTotal]}>
            <Text style={[styles.craLabel, { color: '#00ffcc', fontWeight: 'bold' }]}>Mileage Deduction</Text>
            <Text style={[styles.craValue, { color: '#00ffcc', fontWeight: 'bold' }]}>${craDeduction} CAD</Text>
          </View>
          <View style={styles.craDivider} />
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>Fuel Cost (est.)</Text>
            <Text style={[styles.craValue, { color: '#ff0055' }]}>-${fuelCost} CAD</Text>
          </View>
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>Maintenance (est. $0.08/km)</Text>
            <Text style={[styles.craValue, { color: '#ff0055' }]}>-${maintCost} CAD</Text>
          </View>
          <View style={styles.craDivider} />
          <View style={[styles.craRow, styles.craTotal]}>
            <Text style={[styles.craLabel, { color: '#00ff55', fontWeight: 'bold' }]}>True Net Profit</Text>
            <Text style={[styles.craValue, { color: '#00ff55', fontWeight: 'bold' }]}>${SHIFT_DATA.netToday.toFixed(2)} CAD</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Rogers cell plan, commercial insurance uplift, and vehicle depreciation (Class {ccaClass}) are also deductible as self-employment expenses. See the Class 10.1 CCA tab.
            </Text>
          </View>
        </View>
      )}

      {/* CLASS 10.1 CCA TAB */}
      {activeTab === 'depreciation' && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>CLASS 10.1 — VEHICLE CAPITAL COST ALLOWANCE</Text>

          <View style={styles.craRow}>
            <Text style={styles.craLabel}>Vehicle</Text>
            <Text style={styles.craValue}>2026 CR-V Hybrid Sport</Text>
          </View>
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>Purchase Price (est.)</Text>
            <Text style={styles.craValue}>${vehicleCostCAD.toLocaleString('en-CA')} CAD</Text>
          </View>
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>CRA Eligible Amount (Class 10.1 cap)</Text>
            <Text style={styles.craValue}>$37,000 CAD</Text>
          </View>
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>Business Use %</Text>
            <Text style={[styles.craValue, { color: '#00ffcc' }]}>{businessUsePct.toFixed(1)}%</Text>
          </View>
          <View style={styles.craRow}>
            <Text style={styles.craLabel}>CCA Rate</Text>
            <Text style={styles.craValue}>30% declining balance</Text>
          </View>
          <View style={[styles.craRow, styles.craTotal]}>
            <Text style={[styles.craLabel, { color: '#00ffcc', fontWeight: 'bold' }]}>Est. Annual CCA Deduction</Text>
            <Text style={[styles.craValue, { color: '#00ffcc', fontWeight: 'bold' }]}>${parseInt(annualCCA).toLocaleString('en-CA')} CAD</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⚠️ Class 10.1 applies to vehicles costing over $37,000 (the 2026 passenger vehicle limit). Consult a CRA-certified accountant. This is an estimate based on your business use percentage tracked by Noizymobile.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d10' },
  contentContainer: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#00ffcc', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#8892b0', marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  tabRow: { flexDirection: 'row', backgroundColor: '#0f1319', borderRadius: 8, marginBottom: 16, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#00ffcc22', borderWidth: 1, borderColor: '#00ffcc33' },
  tabText: { fontSize: 9, color: '#8892b0', fontWeight: 'bold', letterSpacing: 0.5 },
  tabTextActive: { color: '#00ffcc' },
  earningsHero: { flexDirection: 'row', backgroundColor: '#0f1319', borderRadius: 8, padding: 16, marginBottom: 12, borderColor: '#1f2937', borderWidth: 1 },
  earningsMain: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#1f2937', paddingRight: 16 },
  grossAmount: { fontSize: 34, fontWeight: 'bold', color: '#00ffcc', marginTop: 4 },
  grossLabel: { fontSize: 10, color: '#8892b0', marginTop: 2 },
  earningsSide: { flex: 1, paddingLeft: 16, justifyContent: 'center' },
  netAmount: { fontSize: 22, fontWeight: 'bold', color: '#00ff55' },
  netLabel: { fontSize: 10, color: '#8892b0' },
  netRateHr: { fontSize: 14, color: '#ffffff', marginTop: 6, fontWeight: 'bold' },
  netRateKm: { fontSize: 12, color: '#8892b0' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, minWidth: (width - 44) / 2, backgroundColor: '#0f1319', borderRadius: 8, padding: 12, borderTopWidth: 2, borderColor: '#1f2937', borderWidth: 1, borderTopColor: '#00ffcc', gap: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 11, color: '#8892b0' },
  statSub: { fontSize: 10, color: '#64748b' },
  panel: { backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  panelTitle: { fontSize: 11, fontWeight: 'bold', color: '#8892b0', marginBottom: 14, letterSpacing: 1 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zoneText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', flex: 1 },
  zoneAvg: { fontSize: 12, color: '#00ffcc' },
  craRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1a2330' },
  craTotal: { borderBottomWidth: 0, marginTop: 4 },
  craLabel: { color: '#8892b0', fontSize: 13, flex: 1 },
  craValue: { color: '#ffffff', fontSize: 13, fontWeight: '500' },
  craDivider: { height: 8 },
  infoBox: { backgroundColor: '#00ffcc0a', borderColor: '#00ffcc22', borderWidth: 1, borderRadius: 6, padding: 10, marginTop: 12 },
  infoText: { color: '#8892b0', fontSize: 11, lineHeight: 16 },
});
