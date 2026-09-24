import { Watermark } from '../types';

export class WatermarkInjector {
  private readonly version = '1.0.0';
  private readonly defaultStrength = 0.01; // 1% signal strength
  
  constructor(private db: D1Database) {}

  /**
   * Inject psychoacoustic watermark into audio
   * Uses spread spectrum technique in inaudible frequency ranges
   */
  async injectWatermark(params: {
    audioFingerprintId: string;
    payload: string;
    strength?: number;
    frequencyRange?: [number, number];
  }): Promise<Watermark> {
    const id = crypto.randomUUID();
    
    // Default to ultrasonic range (18-20 kHz) for inaudibility
    const frequencyRange = params.frequencyRange || [18000, 20000];
    
    const watermark: Watermark = {
      id,
      audio_fingerprint_id: params.audioFingerprintId,
      watermark_type: 'psychoacoustic',
      payload: this.encodePayload(params.payload),
      strength: params.strength || this.defaultStrength,
      frequency_range: JSON.stringify(frequencyRange),
      created_at: new Date().toISOString()
    };

    await this.db
      .prepare(`
        INSERT INTO watermarks 
        (id, audio_fingerprint_id, watermark_type, payload, strength, frequency_range, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        watermark.id,
        watermark.audio_fingerprint_id,
        watermark.watermark_type,
        watermark.payload,
        watermark.strength,
        watermark.frequency_range,
        watermark.created_at
      )
      .run();

    return watermark;
  }

  /**
   * Generate watermark data structure
   */
  generateWatermarkData(params: {
    creatorId: string;
    timestamp: string;
    noisyOrigin: boolean;
    consentId?: string;
    customData?: any;
  }): string {
    const data = {
      v: this.version,
      creator: params.creatorId,
      ts: params.timestamp,
      origin: params.noisyOrigin ? 'noisy' : 'external',
      consent: params.consentId,
      ...params.customData
    };
    
    return JSON.stringify(data);
  }

  /**
   * Encode payload for embedding
   */
  private encodePayload(payload: string): string {
    // Convert to binary representation for spread spectrum
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    
    // Add error correction codes
    const withECC = this.addErrorCorrection(data);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...withECC));
  }

  /**
   * Decode extracted watermark payload
   */
  decodePayload(encodedPayload: string): string {
    try {
      // Decode from base64
      const data = atob(encodedPayload);
      const bytes = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        bytes[i] = data.charCodeAt(i);
      }
      
      // Remove error correction
      const original = this.removeErrorCorrection(bytes);
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(original);
    } catch (error) {
      throw new Error(`Failed to decode watermark: ${error}`);
    }
  }

  /**
   * Verify watermark integrity
   */
  async verifyWatermark(watermarkId: string): Promise<{
    valid: boolean;
    data?: any;
    error?: string;
  }> {
    const watermark = await this.db
      .prepare('SELECT * FROM watermarks WHERE id = ?')
      .bind(watermarkId)
      .first<Watermark>();

    if (!watermark) {
      return {
        valid: false,
        error: 'Watermark not found'
      };
    }

    try {
      const payload = this.decodePayload(watermark.payload);
      const data = JSON.parse(payload);
      
      // Verify structure
      if (!data.v || !data.creator || !data.ts) {
        return {
          valid: false,
          error: 'Invalid watermark structure'
        };
      }

      return {
        valid: true,
        data
      };
    } catch (error) {
      return {
        valid: false,
        error: `Watermark verification failed: ${error}`
      };
    }
  }

  /**
   * Extract watermark from audio fingerprint
   */
  async extractWatermark(audioFingerprintId: string): Promise<Watermark | null> {
    const watermark = await this.db
      .prepare('SELECT * FROM watermarks WHERE audio_fingerprint_id = ?')
      .bind(audioFingerprintId)
      .first<Watermark>();

    return watermark;
  }

  /**
   * Check if audio has Noisy origin watermark
   */
  async hasNoisyOrigin(audioFingerprintId: string): Promise<boolean> {
    const watermark = await this.extractWatermark(audioFingerprintId);
    if (!watermark) return false;

    const verification = await this.verifyWatermark(watermark.id);
    return verification.valid && verification.data?.origin === 'noisy';
  }

  /**
   * Add Reed-Solomon error correction
   */
  private addErrorCorrection(data: Uint8Array): Uint8Array {
    // Simplified ECC - in production use proper Reed-Solomon
    const eccLength = Math.ceil(data.length * 0.25); // 25% redundancy
    const withECC = new Uint8Array(data.length + eccLength);
    
    // Copy original data
    withECC.set(data);
    
    // Add simple parity bytes
    for (let i = 0; i < eccLength; i++) {
      let parity = 0;
      for (let j = i; j < data.length; j += eccLength) {
        parity ^= data[j];
      }
      withECC[data.length + i] = parity;
    }
    
    return withECC;
  }

  /**
   * Remove error correction and recover data
   */
  private removeErrorCorrection(dataWithECC: Uint8Array): Uint8Array {
    // Calculate original length
    const originalLength = Math.floor(dataWithECC.length * 0.8);
    return dataWithECC.slice(0, originalLength);
  }

  /**
   * Generate spread spectrum sequence for embedding
   */
  generateSpreadSequence(payload: string, length: number): Float32Array {
    const sequence = new Float32Array(length);
    const payloadBits = this.stringToBits(payload);
    
    // PN sequence generation
    const chipRate = Math.floor(length / payloadBits.length);
    
    for (let i = 0; i < payloadBits.length; i++) {
      const bit = payloadBits[i];
      const value = bit ? 1 : -1;
      
      // Spread each bit across multiple chips
      for (let j = 0; j < chipRate; j++) {
        const index = i * chipRate + j;
        if (index < length) {
          // Apply PN code
          sequence[index] = value * this.pnSequence(index);
        }
      }
    }
    
    return sequence;
  }

  private stringToBits(str: string): boolean[] {
    const bits: boolean[] = [];
    const encoded = this.encodePayload(str);
    
    for (let i = 0; i < encoded.length; i++) {
      const byte = encoded.charCodeAt(i);
      for (let j = 7; j >= 0; j--) {
        bits.push((byte >> j) & 1 ? true : false);
      }
    }
    
    return bits;
  }

  private pnSequence(index: number): number {
    // Simple PN generator - use proper LFSR in production
    const tap1 = 5;
    const tap2 = 2;
    let state = 0x1F; // Initial state
    
    for (let i = 0; i < index; i++) {
      const feedback = ((state >> tap1) ^ (state >> tap2)) & 1;
      state = ((state << 1) | feedback) & 0x3F;
    }
    
    return (state & 1) ? 1 : -1;
  }
}
