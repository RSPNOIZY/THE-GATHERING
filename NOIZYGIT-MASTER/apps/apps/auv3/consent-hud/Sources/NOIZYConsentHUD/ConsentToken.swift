// ConsentToken.swift
// NOIZY Empire — mirrors Heaven D1 schema for hvs_consent_tokens
//
// Doctrine:
//   "Consent as executable code. Provenance as default.
//    Revocation as sacred. Compensation as automatic."
//
// Every field here is enforced by one or more of the 9 Never Clauses.
// Modifying this file requires CONSENT_AUDITOR review (per .claude/agents/consent-auditor.md).

import Foundation

/// A scoped, time-limited, revocable consent grant from a human actor.
/// Mirrors the `hvs_consent_tokens` table in Heaven's D1 database.
public struct ConsentToken: Codable, Sendable, Equatable, Identifiable {
    /// Unique token identifier (UUIDv4 in production).
    public let id: String

    /// The actor (human) granting consent. Maps to hvs_actors.actor_id.
    /// Example: "RSP_001"
    public let actorId: String

    /// What this consent permits. Each scope is a discrete capability.
    /// Examples: ["voice_capture", "synthesis", "sublicense"]
    public let scopes: [Scope]

    /// Where this consent is valid (ISO 3166 country codes).
    /// Empty array == globally invalid (territory must be explicit).
    public let territories: [String]

    /// When the consent was granted.
    public let grantedAt: Date

    /// When the consent expires. nil == valid until revoked.
    public let expiresAt: Date?

    /// Live revocation state. If `.revoked`, the Kill Switch has fired.
    public let killSwitchState: KillSwitchState

    /// SHA-256 hash of the C2PA manifest attached to this token.
    /// Empty string == no manifest yet (NEVER acceptable for synthesis).
    public let c2paManifestHash: String

    /// Royalty share owed to the actor. Must satisfy 75/25 rule.
    /// 0.75 means the actor takes 75% — the constitutional minimum for primary actors.
    public let royaltyShare: Double

    public init(
        id: String,
        actorId: String,
        scopes: [Scope],
        territories: [String],
        grantedAt: Date,
        expiresAt: Date? = nil,
        killSwitchState: KillSwitchState = .active,
        c2paManifestHash: String,
        royaltyShare: Double = 0.75
    ) {
        self.id = id
        self.actorId = actorId
        self.scopes = scopes
        self.territories = territories
        self.grantedAt = grantedAt
        self.expiresAt = expiresAt
        self.killSwitchState = killSwitchState
        self.c2paManifestHash = c2paManifestHash
        self.royaltyShare = royaltyShare
    }

    // MARK: - Doctrinal validators

    /// Returns the Never Clauses this token currently violates, if any.
    /// An empty array means the token is constitutionally clean.
    public func neverClauseViolations() -> [NeverClause] {
        var violations: [NeverClause] = []

        // Clause 5: NO_BYPASS_KILL_SWITCH — if revoked, every downstream op must fail.
        if killSwitchState == .revoked {
            violations.append(.bypassKillSwitch)
        }

        // Clause 6: NO_HIDDEN_PROVENANCE — every token needs a C2PA manifest.
        if c2paManifestHash.isEmpty {
            violations.append(.hiddenProvenance)
        }

        // Clause 7: NO_EXPLOITATION — 75/25 split is the floor, not the ceiling.
        if royaltyShare < 0.75 {
            violations.append(.exploitation)
        }

        // Implicit: expired tokens are dead (this isn't a Never Clause violation,
        // but a `live(at:)` check in ConsentGatewayClient handles that path).

        return violations
    }

    /// Convenience: token is currently usable for synthesis.
    public func isLive(at instant: Date = Date()) -> Bool {
        guard killSwitchState == .active else { return false }
        guard neverClauseViolations().isEmpty else { return false }
        if let expiry = expiresAt, instant >= expiry { return false }
        return true
    }
}

/// Discrete capability granted by a consent token.
public enum Scope: String, Codable, Sendable, CaseIterable {
    case voiceCapture       = "voice_capture"
    case synthesis          = "synthesis"
    case training           = "training"
    case sublicense         = "sublicense"
    case publicPerformance  = "public_performance"
    case archivalPreservation = "archival_preservation"
}

/// Live state of a consent token's Kill Switch.
public enum KillSwitchState: String, Codable, Sendable {
    /// Token is active and enforceable.
    case active

    /// Token has been revoked. All downstream operations must fail-closed immediately.
    case revoked

    /// Token is paused (soft hold). Distinct from revoked — the actor can re-activate.
    case paused
}

/// The 9 Never Clauses — immovable law per .claude/rules/consent-kernel.md
public enum NeverClause: String, Codable, Sendable, CaseIterable {
    case synthWithoutConsent     = "NO_SYNTH_WITHOUT_CONSENT"          // #1
    case trainingWithoutConsent  = "NO_TRAINING_WITHOUT_CONSENT"       // #2
    case identityImpersonation   = "NO_IDENTITY_IMPERSONATION"         // #3
    case sublicensingWithoutActor = "NO_SUBLICENSING_WITHOUT_ACTOR"    // #4
    case bypassKillSwitch        = "NO_BYPASS_KILL_SWITCH"             // #5
    case hiddenProvenance        = "NO_HIDDEN_PROVENANCE"              // #6
    case exploitation            = "NO_EXPLOITATION"                   // #7
    case minorVoiceSynthesis     = "NO_MINOR_VOICE_SYNTHESIS"          // #8
    case ledgerTampering         = "NO_LEDGER_TAMPERING"               // #9
}
