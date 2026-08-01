/**
 * NOIZYMOBILE v2.0
 * Supersonic AI Rideshare Business Assistant — Canadian Edition
 * Robert Stephen Plowman · Ottawa, Ontario
 *
 * 7-Module Architecture:
 *  1. DriveMode      — CarPlay-optimized shift dashboard
 *  2. OfferAuditor   — AI trip vetting (TOS-safe screenshot analysis)
 *  3. SurgeOracle    — Ottawa-Gatineau live demand intelligence
 *  4. VibeCheck      — Passenger intelligence & 5-star strategy
 *  5. BusinessAdmin  — CRA mileage ledger & Class 10.1 CCA calculator
 *  6. SafetyDash     — Vehicle safety & electrical protocol
 *  7. Lucy           — Supersonic AI strategy assistant
 */

import React, { useState } from 'react';
import {
  SafeAreaView, StyleSheet, Text, TouchableOpacity, View,
  StatusBar, Platform
} from 'react-native';
import {
  Navigation, Target, Radio, Smile, BarChart2,
  Shield, Sparkles
} from 'lucide-react-native';

// ─── Module Imports ───────────────────────────────────────────────────────────
import DriveMode from './components/DriveMode';
import OfferAuditor from './components/OfferAuditor';
import SurgeOracle from './components/SurgeOracle';
import VibeCheck from './components/VibeCheck';
import BusinessAdmin from './components/BusinessAdmin';
import SafetyDashboard from './components/SafetyDashboard';
import LucyAssistant from './components/LucyAssistant';

// ─── Tab Definition ───────────────────────────────────────────────────────────
type TabId = 'drive' | 'audit' | 'surge' | 'vibe' | 'admin' | 'safety' | 'lucy';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  component: React.ComponentType;
}

const TABS: Tab[] = [
  {
    id: 'drive',
    label: 'DRIVE',
    icon: <Navigation size={22} />,
    activeColor: '#00ffcc',
    component: DriveMode,
  },
  {
    id: 'audit',
    label: 'AUDIT',
    icon: <Target size={22} />,
    activeColor: '#00ff55',
    component: OfferAuditor,
  },
  {
    id: 'surge',
    label: 'SURGE',
    icon: <Radio size={22} />,
    activeColor: '#ff0055',
    component: SurgeOracle,
  },
  {
    id: 'vibe',
    label: 'VIBE',
    icon: <Smile size={22} />,
    activeColor: '#ff9900',
    component: VibeCheck,
  },
  {
    id: 'admin',
    label: 'ADMIN',
    icon: <BarChart2 size={22} />,
    activeColor: '#00ffcc',
    component: BusinessAdmin,
  },
  {
    id: 'safety',
    label: 'SAFETY',
    icon: <Shield size={22} />,
    activeColor: '#ff9900',
    component: SafetyDashboard,
  },
  {
    id: 'lucy',
    label: 'LUCY',
    icon: <Sparkles size={22} />,
    activeColor: '#c084fc',
    component: LucyAssistant,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('drive');

  const currentTab = TABS.find(t => t.id === activeTab)!;
  const ActiveComponent = currentTab.component;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d10" />

      {/* Module Status Bar */}
      <View style={styles.moduleBar}>
        <View style={[styles.moduleIndicator, { backgroundColor: currentTab.activeColor }]} />
        <Text style={[styles.moduleTitle, { color: currentTab.activeColor }]}>
          NOIZYMOBILE · {currentTab.label}
        </Text>
        <Text style={styles.moduleTagline}>
          {activeTab === 'drive' && 'Shift Dashboard'}
          {activeTab === 'audit' && 'Offer Intelligence'}
          {activeTab === 'surge' && 'Ottawa-Gatineau Demand'}
          {activeTab === 'vibe' && '5-Star Strategy'}
          {activeTab === 'admin' && 'CRA Business Ledger'}
          {activeTab === 'safety' && 'Vehicle Safety Protocol'}
          {activeTab === 'lucy' && 'Supersonic AI Partner'}
        </Text>
      </View>

      {/* Active Module */}
      <View style={styles.moduleContainer}>
        <ActiveComponent />
      </View>

      {/* Bottom Nav Bar */}
      <View style={styles.navBar}>
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const IconWithColor = React.cloneElement(tab.icon as React.ReactElement<{ color: string; size: number }>, {
            color: isActive ? tab.activeColor : '#374151',
            size: 22,
          });
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              {/* Active indicator pill */}
              {isActive && (
                <View style={[styles.navActivePill, { backgroundColor: tab.activeColor }]} />
              )}
              {IconWithColor}
              <Text style={[styles.navLabel, isActive && { color: tab.activeColor }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0d10',
  },
  moduleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#060810',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    gap: 8,
  },
  moduleIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moduleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  moduleTagline: {
    fontSize: 11,
    color: '#374151',
    marginLeft: 'auto',
  },
  moduleContainer: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#060810',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    paddingBottom: Platform.OS === 'ios' ? 0 : 6,
    paddingTop: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 2,
    position: 'relative',
  },
  navItemActive: {
    // glow effect indicator handled by pill
  },
  navActivePill: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 2,
    borderRadius: 1,
  },
  navLabel: {
    fontSize: 8,
    color: '#374151',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
