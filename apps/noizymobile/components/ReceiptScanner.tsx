import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Camera as CameraIcon, RefreshCw, Check, AlertCircle } from 'lucide-react-native';

export default function ReceiptScanner() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.text, { color: '#ff0055' }]}>No access to camera. Camera permissions are required for OCR scanning.</Text>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef) {
      const options = { quality: 0.85, skipProcessing: false };
      const data = await cameraRef.takePictureAsync(options);
      setPhoto(data.uri);
    }
  };

  const uploadToN8n = async () => {
    if (!photo) return;
    setIsScanning(true);
    
    // Simulate n8n webhook API call
    setTimeout(() => {
      setIsScanning(false);
      Alert.alert(
        "CRA-Compliant Logged!",
        "OCR Extraction Complete:\nAmount: $76.45 CAD\nCategory: Fuel (CRA Tax Deductible)\nLogged in Baserow Ledger.",
        [{ text: "OK", onPress: () => setPhoto(null) }]
      );
    }, 2500);
  };

  return (
    <View style={styles.container}>
      {photo ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo }} style={styles.preview} />
          
          <View style={styles.overlay}>
            {isScanning ? (
              <View style={styles.scanningOverlay}>
                <RefreshCw color="#00ffcc" size={48} style={styles.spin} />
                <Text style={styles.scanningText}>AGENT ZERO OCR EXTRACTING...</Text>
              </View>
            ) : (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionButton, styles.retakeButton]} onPress={() => setPhoto(null)}>
                  <RefreshCw color="#fff" size={24} />
                  <Text style={styles.actionText}>RETAKE</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.confirmButton]} onPress={uploadToN8n}>
                  <Check color="#000" size={24} />
                  <Text style={[styles.actionText, { color: '#000' }]}>SUBMIT TO LEDGER</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        <CameraView
          style={styles.camera}
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.guidelineBox}>
              <Text style={styles.guidelineText}>POSITION RECEIPT WITHIN BORDER</Text>
            </View>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner}>
                <CameraIcon color="#000" size={32} />
              </View>
            </TouchableOpacity>

            <View style={styles.safetyNotice}>
              <AlertCircle color="#ffcc00" size={16} />
              <Text style={styles.safetyNoticeText}>
                Never scan receipts while driving. Stop in READY mode.
              </Text>
            </View>
          </View>
        </CameraView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d10',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0d10',
    padding: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
    alignItems: 'center',
  },
  guidelineBox: {
    borderWidth: 2,
    borderColor: '#00ffcc88',
    borderStyle: 'dashed',
    borderRadius: 8,
    width: '90%',
    height: '60%',
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ffcc05',
  },
  guidelineText: {
    color: '#00ffcc',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00ffcc33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ffcc',
    marginBottom: 10,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00ffcc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffcc0011',
    borderColor: '#ffcc0022',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
  },
  safetyNoticeText: {
    color: '#ffcc00',
    fontSize: 11,
    marginLeft: 6,
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a0d10cc',
    padding: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    flex: 0.48,
  },
  retakeButton: {
    backgroundColor: '#374151',
  },
  confirmButton: {
    backgroundColor: '#00ffcc',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  scanningOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  scanningText: {
    color: '#00ffcc',
    fontWeight: 'bold',
    marginTop: 16,
    letterSpacing: 1,
  },
  spin: {
    // Rotation is handled via standard UI trigger in this mock
  }
});
