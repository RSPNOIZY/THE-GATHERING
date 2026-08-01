import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity
} from 'react-native';
import {
  Star, MessageSquare, Smile, Volume2, Coffee, Shield,
  ThumbsUp, ThumbsDown, ChevronRight, Award
} from 'lucide-react-native';

// ─── Passenger Vibe Profiles by Pickup Context ─────────────────────────────
interface VibeProfile {
  zone: string;
  time: string;
  persona: string;
  recommendedMusic: string;
  tempRecommendation: string;
  conversationApproach: string;
  tippingProbability: string;
  color: string;
}

const VIBE_PROFILES: VibeProfile[] = [
  {
    zone: 'YOW Airport (Domestic)',
    time: 'Arriving flights',
    persona: 'Business Traveller',
    recommendedMusic: 'Jazz / Lo-fi (low volume)',
    tempRecommendation: '21°C / 70°F — professional preference',
    conversationApproach: "Offer a brief welcome. If they're on their phone, don't speak. If eye contact, ask 'Good flight?' — one sentence.",
    tippingProbability: '🟢 HIGH — 40-60% tip rate',
    color: '#00ffcc',
  },
  {
    zone: 'ByWard Market',
    time: 'Friday–Saturday 12AM–3AM',
    persona: 'Late Night / Bar Crowd',
    recommendedMusic: 'Pop radio (what they likely know)',
    tempRecommendation: '20°C / 68°F — they may be warm',
    conversationApproach: "Keep it light and fun. 'Good night?' then let them lead. Do NOT engage if they seem aggressive.",
    tippingProbability: '🟡 MEDIUM — 20-35% tip, but high cancel risk',
    color: '#ff9900',
  },
  {
    zone: 'Parliament Hill / Sparks St',
    time: 'Mon–Fri 7–9AM',
    persona: 'Government Employee / Commuter',
    recommendedMusic: 'CBC Radio / News (or silence)',
    tempRecommendation: '22°C — business attire, comfortable',
    conversationApproach: "Say hello and destination confirmation. Quiet ride unless they initiate. Many listen to podcasts.",
    tippingProbability: '🟡 MEDIUM — 25-35% tip rate',
    color: '#8892b0',
  },
  {
    zone: 'Carleton / uOttawa',
    time: 'Evening / Weekend',
    persona: 'University Student',
    recommendedMusic: 'Current pop / whatever they ask',
    tempRecommendation: '21°C — casual setting',
    conversationApproach: "Friendly and relaxed. 'Hey! [confirm destination].' Let them vibe. They often Bluetooth request music.",
    tippingProbability: '🔴 LOW — 10-20% tip rate, high acceptance',
    color: '#ff0055',
  },
  {
    zone: 'Kanata Tech Park',
    time: 'Mon–Fri 5–7PM',
    persona: 'Tech Worker',
    recommendedMusic: 'Ambient / Instrumental (quiet)',
    tempRecommendation: '22°C — often coding on laptop during ride',
    conversationApproach: "Professional greeting. If they open laptop immediately — zero conversation. Best passengers for long quiet profitable rides.",
    tippingProbability: '🟢 HIGH — 35-50% tip rate',
    color: '#00ffcc',
  },
];

// ─── Post-Trip Review Advisor ──────────────────────────────────────────────
interface ReviewStar {
  label: string;
  tips: string[];
}
const STAR_ADVISORS: Record<number, ReviewStar> = {
  5: { label: 'PERFECT RIDE', tips: ['Excellent kinetic score', 'Positive atmosphere', 'On-time arrival', 'Clean vehicle'] },
  4: { label: 'GOOD RIDE', tips: ['Minor navigation delay possible', 'Consider AC adjustment next time', 'Music preference mismatch possible'] },
  3: { label: 'AVERAGE', tips: ['Review your kinetic score — hard braking detected?', 'Conversation too much or too little?', 'Check Google Maps vs Waze routing difference'] },
  2: { label: 'BELOW AVERAGE', tips: ['File support ticket if passenger was inappropriate', 'Route complaint: use "I followed GPS" defense', 'Note pax ID — potential repeat risk'] },
  1: { label: 'NEGATIVE REVIEW', tips: ['⚡ File immediate Uber support ticket', 'Screenshot the ride receipt as evidence', 'If harassment — report to Uber Safety'] },
};

export default function VibeCheck() {
  const [selectedProfile, setSelectedProfile] = useState<VibeProfile | null>(null);
  const [postTripStars, setPostTripStars] = useState<number | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>VIBE CHECK</Text>
          <Text style={styles.headerSub}>Passenger Intelligence & 5-Star Strategy</Text>
        </View>
        <Award color="#ff9900" size={24} />
      </View>

      {/* Active Vibe Profile */}
      {selectedProfile ? (
        <View style={[styles.activeProfile, { borderColor: selectedProfile.color }]}>
          <View style={styles.activeProfileHeader}>
            <View>
              <Text style={[styles.activeProfileZone, { color: selectedProfile.color }]}>
                {selectedProfile.zone}
              </Text>
              <Text style={styles.activeProfilePersona}>{selectedProfile.persona}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedProfile(null)} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>CHANGE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vibeRow}>
            <Volume2 color="#8892b0" size={16} />
            <View style={styles.vibeContent}>
              <Text style={styles.vibeLabel}>MUSIC</Text>
              <Text style={styles.vibeValue}>{selectedProfile.recommendedMusic}</Text>
            </View>
          </View>
          <View style={styles.vibeRow}>
            <Coffee color="#8892b0" size={16} />
            <View style={styles.vibeContent}>
              <Text style={styles.vibeLabel}>CABIN TEMP</Text>
              <Text style={styles.vibeValue}>{selectedProfile.tempRecommendation}</Text>
            </View>
          </View>
          <View style={styles.vibeRow}>
            <MessageSquare color="#8892b0" size={16} />
            <View style={styles.vibeContent}>
              <Text style={styles.vibeLabel}>CONVERSATION</Text>
              <Text style={[styles.vibeValue, styles.vibeConversation]}>{selectedProfile.conversationApproach}</Text>
            </View>
          </View>
          <View style={[styles.vibeRow, { borderBottomWidth: 0, marginTop: 4 }]}>
            <Smile color="#8892b0" size={16} />
            <View style={styles.vibeContent}>
              <Text style={styles.vibeLabel}>TIPPING PROBABILITY</Text>
              <Text style={[styles.vibeValue, { fontWeight: 'bold' }]}>{selectedProfile.tippingProbability}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>SELECT PICKUP ZONE — ACTIVATE VIBE CHECK</Text>
          {VIBE_PROFILES.map((profile, i) => (
            <TouchableOpacity
              key={i}
              style={styles.profileRow}
              onPress={() => setSelectedProfile(profile)}
            >
              <View style={[styles.profileDot, { backgroundColor: profile.color }]} />
              <View style={styles.profileContent}>
                <Text style={styles.profileZone}>{profile.zone}</Text>
                <Text style={styles.profileTime}>{profile.time} · {profile.persona}</Text>
              </View>
              <ChevronRight color="#374151" size={18} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Post-Trip Star Advisor */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>POST-TRIP STAR ADVISOR</Text>
        <Text style={styles.panelSub}>What rating did you receive? Get coaching:</Text>
        <View style={styles.starRow}>
          {[5, 4, 3, 2, 1].map((star) => (
            <TouchableOpacity
              key={star}
              style={[styles.starBtn, postTripStars === star && styles.starBtnActive]}
              onPress={() => setPostTripStars(star)}
            >
              <Star
                size={22}
                color={postTripStars === star ? '#ff9900' : '#374151'}
                fill={postTripStars === star ? '#ff9900' : 'transparent'}
              />
              <Text style={[styles.starBtnNum, postTripStars === star && styles.starBtnNumActive]}>
                {star}★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {postTripStars && (
          <View style={styles.starAdvice}>
            <Text style={[styles.starAdviceTitle, { color: postTripStars >= 4 ? '#00ff55' : postTripStars === 3 ? '#ff9900' : '#ff0055' }]}>
              {STAR_ADVISORS[postTripStars].label}
            </Text>
            {STAR_ADVISORS[postTripStars].tips.map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                {postTripStars >= 4
                  ? <ThumbsUp color="#00ff55" size={13} />
                  : <ThumbsDown color="#ff0055" size={13} />
                }
                <Text style={styles.tipItemText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Uber Support Ticket Helper */}
      <View style={[styles.panel, { borderColor: '#ff005533' }]}>
        <View style={styles.panelHeaderRow}>
          <Shield color="#ff0055" size={18} />
          <Text style={[styles.panelTitle, { color: '#ff0055', marginBottom: 0 }]}>UBER SUPPORT TICKET TEMPLATES</Text>
        </View>
        <View style={{ height: 10 }} />
        {[
          { label: 'Unfair 1-Star / False Rating', color: '#ff0055' },
          { label: 'Passenger Misconduct Report', color: '#ff0055' },
          { label: 'Pax No-Show — Cancellation Fee Dispute', color: '#ff9900' },
          { label: 'Incorrect Route Complaint Defense', color: '#ff9900' },
          { label: 'Missing Earnings / App Glitch', color: '#8892b0' },
        ].map((t, i) => (
          <TouchableOpacity key={i} style={styles.ticketRow}>
            <View style={[styles.ticketDot, { backgroundColor: t.color }]} />
            <Text style={styles.ticketLabel}>{t.label}</Text>
            <ChevronRight color="#374151" size={16} />
          </TouchableOpacity>
        ))}
        <Text style={styles.panelSub}>
          Tap any template → Lucy drafts your ticket in 3 sentences. Copy → Paste into Uber Help.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0d10' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#00ffcc', letterSpacing: 1 },
  headerSub: { fontSize: 11, color: '#8892b0', marginTop: 2 },
  activeProfile: { borderWidth: 2, borderRadius: 10, padding: 16, marginBottom: 16, backgroundColor: '#0f1319' },
  activeProfileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  activeProfileZone: { fontSize: 15, fontWeight: 'bold' },
  activeProfilePersona: { color: '#8892b0', fontSize: 12, marginTop: 2 },
  changeBtn: { backgroundColor: '#1f2937', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  changeBtnText: { color: '#8892b0', fontSize: 11, fontWeight: 'bold' },
  vibeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a2330' },
  vibeContent: { flex: 1 },
  vibeLabel: { fontSize: 9, color: '#64748b', fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 2 },
  vibeValue: { color: '#ffffff', fontSize: 13 },
  vibeConversation: { color: '#cbd5e1', lineHeight: 18 },
  panel: { backgroundColor: '#0f1319', borderColor: '#1f2937', borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  panelTitle: { fontSize: 11, fontWeight: 'bold', color: '#8892b0', marginBottom: 14, letterSpacing: 1 },
  panelHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  panelSub: { fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 15 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a2330' },
  profileDot: { width: 10, height: 10, borderRadius: 5 },
  profileContent: { flex: 1 },
  profileZone: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  profileTime: { color: '#8892b0', fontSize: 11, marginTop: 1 },
  starRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 12 },
  starBtn: { alignItems: 'center', backgroundColor: '#0a0d10', borderColor: '#1f2937', borderWidth: 1, borderRadius: 8, padding: 10, flex: 1 },
  starBtnActive: { backgroundColor: '#ff990015', borderColor: '#ff990066' },
  starBtnNum: { color: '#374151', fontSize: 10, marginTop: 4 },
  starBtnNumActive: { color: '#ff9900' },
  starAdvice: { backgroundColor: '#0a0d10', borderColor: '#1f2937', borderWidth: 1, borderRadius: 6, padding: 12 },
  starAdviceTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  tipItemText: { color: '#8892b0', fontSize: 12, flex: 1 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a2330' },
  ticketDot: { width: 6, height: 6, borderRadius: 3 },
  ticketLabel: { flex: 1, color: '#cbd5e1', fontSize: 13 },
});
