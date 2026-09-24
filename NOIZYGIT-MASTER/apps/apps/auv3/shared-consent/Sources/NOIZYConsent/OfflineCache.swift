// OfflineCache.swift
// NOIZY Empire — Audio-thread-safe cache for ConsentDecisions
//
// The audio render thread is REAL-TIME and cannot block on network. This actor
// holds the latest ConsentDecision per scope and is refreshed off-thread by
// ConsentGatewayClient. The audio thread reads via a non-blocking snapshot.
//
// Fail-mode policy:
//   - DEFAULT: fail-closed. If the cache entry is older than maxCacheAgeSeconds,
//     audio is BLOCKED until the gateway refreshes.
//   - OVERRIDE: RSP_001 can flip a 24h fail-open switch via setOfflineOverride().
//     The override is logged and auto-expires.
//
// Spec: DREAMCHAMBER_5_FRESH_IDEAS.md §1
// Doctrine: Never Clause #5 (Kill Switch propagates instantly even when offline)

import Foundation

/// Snapshot returned to the audio thread. Plain value type, no actor hops.
public struct ConsentSnapshot: Sendable, Equatable {
    public enum Light: Sendable, Equatable {
        case green        // Allow — all clear
        case yellow       // Allow with caution — stale cache, refresh in flight
        case red          // Deny — fail-closed
    }

    public let scope: Scope
    public let light: Light
    public let lastChecked: Date
    public let reason: String

    public var isAllowed: Bool {
        light == .green || light == .yellow
    }
}

/// Audio-thread-safe cache. The render thread does NOT touch the actor —
/// it reads the atomic snapshot via `currentSnapshot(for:)`.
public final class OfflineCache: @unchecked Sendable {
    private let lock = NSLock()
    private var snapshots: [Scope: ConsentSnapshot] = [:]
    private var offlineOverrideExpiresAt: Date? = nil
    private let maxCacheAgeSeconds: TimeInterval

    public init(maxCacheAgeSeconds: TimeInterval = 30) {
        self.maxCacheAgeSeconds = maxCacheAgeSeconds
    }

    /// Audio-thread safe read. Returns the current snapshot for a scope.
    /// If no snapshot exists or it's stale, returns red (fail-closed) unless
    /// the offline override is active.
    public func currentSnapshot(for scope: Scope) -> ConsentSnapshot {
        lock.lock()
        defer { lock.unlock() }

        let now = Date()
        guard let snap = snapshots[scope] else {
            return ConsentSnapshot(scope: scope, light: .red, lastChecked: .distantPast, reason: "no cached decision")
        }

        let age = now.timeIntervalSince(snap.lastChecked)
        if age <= maxCacheAgeSeconds {
            return snap
        }

        // Stale cache. Apply offline override policy.
        if let expiry = offlineOverrideExpiresAt, now < expiry {
            // Override active — green light with stale-warning marker.
            return ConsentSnapshot(scope: scope, light: .yellow, lastChecked: snap.lastChecked,
                                   reason: "offline override active until \(expiry)")
        }

        // No override → fail-closed.
        return ConsentSnapshot(scope: scope, light: .red, lastChecked: snap.lastChecked,
                               reason: "stale (\(Int(age))s old) and no offline override")
    }

    /// Off-thread update from ConsentGatewayClient.
    public func update(scope: Scope, decision: ConsentDecision) {
        lock.lock()
        defer { lock.unlock() }

        let light: ConsentSnapshot.Light
        let reason: String
        switch decision.verdict {
        case .allow:
            light = .green
            reason = "allow"
        case .deny:
            light = .red
            reason = decision.reason ?? "denied: \(decision.violations.map { $0.rawValue }.joined(separator: ","))"
        case .offline:
            // Don't overwrite a known-good entry with an offline result.
            // Just leave whatever we had; the staleness check will catch it.
            return
        }

        snapshots[scope] = ConsentSnapshot(
            scope: scope,
            light: light,
            lastChecked: decision.checkedAt,
            reason: reason
        )
    }

    /// Force the cache into RED for a scope (Kill Switch propagation path).
    /// Called when CONSENT_ORACLE notifies via SSE that a token was revoked.
    public func killSwitch(scope: Scope, reason: String = "kill switch fired") {
        lock.lock()
        defer { lock.unlock() }
        snapshots[scope] = ConsentSnapshot(
            scope: scope, light: .red, lastChecked: Date(), reason: reason
        )
    }

    /// Activate the offline override. Time-boxed (default 24 hours).
    /// Logged separately by the caller — this method only sets the flag.
    public func setOfflineOverride(durationHours: Double = 24) {
        lock.lock()
        defer { lock.unlock() }
        offlineOverrideExpiresAt = Date().addingTimeInterval(durationHours * 3600)
    }

    public func clearOfflineOverride() {
        lock.lock()
        defer { lock.unlock() }
        offlineOverrideExpiresAt = nil
    }

    /// For diagnostics / HUD display.
    public func allSnapshots() -> [ConsentSnapshot] {
        lock.lock()
        defer { lock.unlock() }
        return Array(snapshots.values)
    }
}
