import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Square, Volume2, ShieldAlert, Navigation2, Bluetooth } from 'lucide-react-native';

export default function DriveMode() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [volume, setVolume] = useState(1.0);
  const [telemetry, setTelemetry] = useState({
    odometer: 12450.2,
    fuelLevel: 82,
    oilLife: 90,
  });

  // Curated ambient soundscape loop
  const soundscapeUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'; // FOSS audio sample

  async function playSound() {
    try {
      console.log('Loading Sound');
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: soundscapeUrl },
        { shouldPlay: true, isLooping: true, volume }
      );
      setSound(newSound);
      setIsPlaying(true);
      console.log('Playing Sound');
    } catch (error) {
      console.error('Error loading sound', error);
    }
  }

  async function stopSound() {
    if (sound) {
      console.log('Stopping Sound');
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound on cleanup');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // Telemetry refresh polling simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        odometer: parseFloat((prev.odometer + 0.05).toFixed(2)),
      }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NOIZYMOBILE // DRIVE MODE</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>READY MODE ACTIVE</Text>
        </View>
      </View>

      {/* Telemetry Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>VEHICLE TELEMETRY (HONDALINK SYNC)</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{telemetry.odometer.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Odometer</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#00ff55' }]}>{telemetry.fuelLevel}%</Text>
            <Text style={styles.statLabel}>Fuel Level</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ff0055' }]}>{telemetry.oilLife}%</Text>
            <Text style={styles.statLabel}>Oil Life</Text>
          </View>
        </View>
      </View>

      {/* Audio Engine Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>SOUNDSTREAM ENGINE</Text>
        <Text style={styles.infoText}>Looping ambient track: Cyber Meditation Suite #1</Text>
        
        <View style={styles.audioControls}>
          {isPlaying ? (
            <TouchableOpacity style={[styles.hugeButton, styles.stopButton]} onPress={stopSound}>
              <Square color="#fff" size={40} />
              <Text style={styles.buttonText}>STOP LOOP</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.hugeButton, styles.playButton]} onPress={playSound}>
              <Play color="#000" size={40} fill="#000" />
              <Text style={[styles.buttonText, { color: '#000' }]}>START LOOP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Multipoint Routing Info */}
        <View style={styles.routingInfo}>
          <Bluetooth color="#00ffcc" size={20} />
          <Text style={styles.routingText}>
            Dual-Multipoint Active: Bose System (Passengers) | BlueParrott Headset (Driver Alerts)
          </Text>
        </View>
      </View>

      {/* Surge Alerts Panel */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>SURGE ORACLE (OTTAWA-GATINEAU)</Text>
        <View style={styles.alertRow}>
          <ShieldAlert color="#ff9900" size={24} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Surge Warning: YOW Airport</Text>
            <Text style={styles.alertDesc}>
              3 flights landing in next 15 mins. Reposition to YOW Cell Lot recommended.
            </Text>
          </View>
        </View>

        <View style={[styles.alertRow, { borderTopWidth: 1, borderTopColor: '#1f2937', marginTop: 10, paddingTop: 10 }]}>
          <Navigation2 color="#ff0055" size={24} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Gatineau Border Alert</Text>
            <Text style={styles.alertDesc}>
              Ontario drivers cannot pick up in Quebec. Empty backhaul expected if crossing Portage Bridge.
            </Text>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffcc',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#00ff5522',
    borderColor: '#00ff55',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#00ff55',
    fontSize: 10,
    fontWeight: 'bold',
  },
  panel: {
    backgroundColor: '#0f1319',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8892b0',
    marginBottom: 12,
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#8892b0',
  },
  infoText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 16,
  },
  audioControls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hugeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  playButton: {
    backgroundColor: '#00ffcc',
    shadowColor: '#00ffcc',
  },
  stopButton: {
    backgroundColor: '#ff0055',
    shadowColor: '#ff0055',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1.5,
  },
  routingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ffcc11',
    padding: 10,
    borderRadius: 6,
    borderColor: '#00ffcc22',
    borderWidth: 1,
  },
  routingText: {
    color: '#00ffcc',
    fontSize: 11,
    marginLeft: 8,
    flex: 1,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertContent: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  alertDesc: {
    fontSize: 12,
    color: '#8892b0',
    lineHeight: 16,
  },
});
