/**
 * NOIZYSTREAM — Dante Bridge
 *
 * Abstraction layer between the NOIZYSTREAM control plane
 * and the Dante audio network on the local LAN.
 *
 * ARCHITECTURE NOTE:
 *   Dante operates at the OS / driver level (Dante Virtual Soundcard,
 *   Dante AVIO, Dante-enabled interfaces). There is no public Dante
 *   REST API — control is via Dante Controller (GUI) or Dante Domain
 *   Manager (API with licensed hardware).
 *
 *   This bridge exposes an async interface that NOIZYSTREAM calls.
 *   The concrete implementations map to:
 *     - OSC / network commands (if your hardware supports it)
 *     - AppleScript / shell automation of Dante Controller on macOS
 *     - Future: Dante Domain Manager API when DDM is licensed
 *
 *   Stub methods are marked [STUB] — replace with real implementations
 *   when hardware is in hand.
 */

import * as dgram from 'dgram';
import { StreamEndpoint, Route } from '../types';

// ── Config ────────────────────────────────────────────────────────────────────

export interface DanteBridgeConfig {
  /** IP of the Dante network interface on the M2 Ultra */
  localIp: string;
  /** Subnet for Dante device discovery (e.g. "192.168.10.0/24") */
  danteSubnet: string;
  /** Dante Controller mDNS service name (for discovery) */
  controllerService: string;
  /** Port for Dante discovery (Audinate uses 4440 for mDNS/discovery) */
  discoveryPort: number;
}

const DEFAULT_CONFIG: DanteBridgeConfig = {
  localIp: process.env.DANTE_LOCAL_IP ?? '10.90.90.10',
  danteSubnet: process.env.DANTE_SUBNET ?? '10.90.90.0/24',
  controllerService: '_netaudio-arc._udp',
  discoveryPort: 4440,
};

// ── Device / Channel types ────────────────────────────────────────────────────

export interface DanteDevice {
  name: string;
  ip: string;
  rxChannels: string[];
  txChannels: string[];
  sampleRate: number;
  latencyUs: number;
  clockSync: 'master' | 'slave' | 'unknown';
}

export interface DanteSubscription {
  /** Receiver device name */
  rxDevice: string;
  /** Receiver channel label */
  rxChannel: string;
  /** Transmitter device name */
  txDevice: string;
  /** Transmitter channel label */
  txChannel: string;
  active: boolean;
}

// ── Bridge ────────────────────────────────────────────────────────────────────

export class DanteBridge {
  private config: DanteBridgeConfig;
  private discovered: Map<string, DanteDevice> = new Map();
  private subscriptions: Map<string, DanteSubscription> = new Map();
  private udpSocket: dgram.Socket | null = null;

  constructor(config: Partial<DanteBridgeConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Start passive mDNS/discovery listener for Dante devices on the LAN */
  async startDiscovery(): Promise<void> {
    // [STUB] Real implementation: bind to mDNS multicast (224.0.0.251:5353)
    // and parse _netaudio-arc._udp and _netaudio-cmc._udp service announcements.
    // Audinate's discovery protocol details are not public; practical options:
    //   1. Parse Dante Controller output via AppleScript
    //   2. Observe mDNS packets with dns-sd / bonjour
    //   3. Dante Domain Manager REST API (licensed)
    console.log('[dante-bridge] Discovery started (stub — no real mDNS parsing yet)');
    console.log(`[dante-bridge] Listening on subnet: ${this.config.danteSubnet}`);
  }

  /** [STUB] Return currently known Dante devices */
  async listDevices(): Promise<DanteDevice[]> {
    // TODO: Replace with real mDNS discovery results
    return [...this.discovered.values()];
  }

  /** [STUB] Map a NOIZYSTREAM StreamEndpoint to a Dante subscription */
  async subscribeRoute(route: Route, endpoints: StreamEndpoint[]): Promise<DanteSubscription | null> {
    const source = endpoints.find(e => e.id === route.sourceEndpointId);
    if (!source?.dante) {
      console.warn('[dante-bridge] Source endpoint has no Dante metadata:', route.sourceEndpointId);
      return null;
    }

    for (const sinkId of route.sinkEndpointIds) {
      const sink = endpoints.find(e => e.id === sinkId);
      if (!sink?.dante) {
        console.warn('[dante-bridge] Sink endpoint has no Dante metadata:', sinkId);
        continue;
      }

      const sub: DanteSubscription = {
        rxDevice: sink.dante.deviceName,
        rxChannel: sink.dante.channelLabel,
        txDevice: source.dante.deviceName,
        txChannel: source.dante.channelLabel,
        active: false, // [STUB] becomes true when DDM confirms
      };

      const key = `${sub.rxDevice}/${sub.rxChannel}←${sub.txDevice}/${sub.txChannel}`;
      this.subscriptions.set(key, sub);

      // [STUB] Real implementation would call Dante Domain Manager:
      //   POST /api/subscriptions  { rxDevice, rxChannel, txDevice, txChannel }
      // Or shell out to a Dante Controller automation script.
      console.log(`[dante-bridge] STUB subscribe: ${key}`);
      sub.active = true; // optimistic for now
    }

    return null;
  }

  /** [STUB] Remove a Dante subscription (mute route at Dante layer) */
  async unsubscribeRoute(routeId: string): Promise<void> {
    // [STUB] Reverse the subscription created by subscribeRoute
    console.log(`[dante-bridge] STUB unsubscribe route: ${routeId}`);
  }

  /** [STUB] Query latency for a route at the Dante layer */
  async measureLatency(routeId: string): Promise<number | null> {
    // Dante reports latency per subscription in microseconds.
    // Real implementation: query DDM or Dante Controller.
    // Return value in milliseconds.
    return null; // [STUB]
  }

  /** List active subscriptions (those we know about) */
  listSubscriptions(): DanteSubscription[] {
    return [...this.subscriptions.values()];
  }

  /** [STUB] Check health of the Dante network */
  async health(): Promise<{ status: 'up' | 'down' | 'unknown'; deviceCount: number; subscriptionCount: number }> {
    // Real: query DDM health endpoint or Dante Controller status
    return {
      status: 'unknown', // [STUB]
      deviceCount: this.discovered.size,
      subscriptionCount: this.subscriptions.size,
    };
  }

  close() {
    this.udpSocket?.close();
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const dante = new DanteBridge();
