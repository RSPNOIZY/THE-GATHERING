import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { ShieldCheck, UserCheck, Key, EyeOff, Volume2 } from 'lucide-react-native';

export default function SafetyDashboard() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PASSENGER SAFETY PORTAL</Text>
        <Text style={styles.headerSubtitle}>Verified Noizymobile Operator credentials</Text>
      </View>

      {/* Operator Verification Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <UserCheck color="#00ffcc" size={24} />
          <Text style={styles.cardTitle}>VERIFIED DRIVER DETAILS</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Driver Operator:</Text>
          <Text style={styles.value}>Robert Stephen Plowman</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vehicle Model:</Text>
          <Text style={styles.value}>2026 Honda CR-V Touring Hybrid</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>City of Operation:</Text>
          <Text style={styles.value}>Ottawa-Gatineau Region</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Screening Status:</Text>
          <Text style={[styles.value, { color: '#00ff55', fontWeight: 'bold' }]}>100% CLEARED (Annual Background Check)</Text>
        </View>
      </View>

      {/* Vantrue Camera Local Storage Privacy Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <EyeOff color="#ff0055" size={24} />
          <Text style={[styles.cardTitle, { color: '#ff0055' }]}>VANTRUE DASHCAM PRIVACY ASSURANCE</Text>
        </View>
        <Text style={styles.paraText}>
          Your privacy inside this vehicle is strictly protected. This vehicle uses a high-definition Vantrue dual-lens safety camera with the following FOSS-aligned rules:
        </Text>
        
        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Local-Only Storage:</Text> Footage is saved directly to an encrypted local microSD card. It is <Text style={{ color: '#ff0055', fontWeight: 'bold' }}>NEVER</Text> uploaded to any remote server or third-party cloud.
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Audio Muted:</Text> Cabin audio recording is permanently toggled <Text style={{ color: '#ffcc00', fontWeight: 'bold' }}>OFF</Text> in the camera settings to ensure full compliance with two-party consent wiretap laws.
          </Text>
        </View>

        <View style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: 'bold', color: '#fff' }}>Automatic Overwrite:</Text> Safe trip footage is auto-purged within 24 hours. It is only reviewed manually in the event of an insurance claim or direct safety report.
          </Text>
        </View>
      </View>

      {/* Curated Soundscape Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Volume2 color="#00ffcc" size={24} />
          <Text style={styles.cardTitle}>CURRENT CABIN ATMOSPHERE</Text>
        </View>
        <Text style={styles.paraText}>
          The Bose 12-speaker audio array is currently playing curated musical loops designed for relaxation, stress reduction, and mental clarity during travel.
        </Text>
        <View style={styles.musicStats}>
          <Text style={styles.trackName}>Track: "Cyber Meditation Suite #1"</Text>
          <Text style={styles.artistName}>Composer: Robert Stephen Plowman</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d10',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ffcc',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8892b0',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#0f1319',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00ffcc',
    marginLeft: 10,
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1a2330',
  },
  label: {
    color: '#8892b0',
    fontSize: 13,
  },
  value: {
    color: '#ffffff',
    fontSize: 13,
  },
  paraText: {
    color: '#8892b0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 6,
  },
  bullet: {
    color: '#00ffcc',
    fontSize: 14,
    marginRight: 8,
    lineHeight: 18,
  },
  bulletText: {
    color: '#8892b0',
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  musicStats: {
    backgroundColor: '#0a0d10',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#00ffcc',
  },
  trackName: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  artistName: {
    color: '#8892b0',
    fontSize: 11,
    marginTop: 2,
  },
});
