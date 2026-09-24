// ReceiptType.swift
// NOIZY Empire — fixed receipt type enum.
//
// Adding a new type requires a code change AND a spec update AND a migration script.
// This is intentional. The Receipt Spine's stability comes from its immovable shape.
//
// Spec: RECEIPT_SPINE.md "Receipt type enum (fixed)"

import Foundation

public enum ReceiptType: String, Codable, Sendable, CaseIterable {
    case boot           = "ai.noizy.receipt.boot"
    case sessionStart   = "ai.noizy.receipt.session_start"
    case voiceCapture   = "ai.noizy.receipt.voice_capture"
    case consentCheck   = "ai.noizy.receipt.consent_check"
    case synthesis      = "ai.noizy.receipt.synthesis"
    case vaultCommit    = "ai.noizy.receipt.vault_commit"
    case revocation     = "ai.noizy.receipt.revocation"
    case royaltyEvent   = "ai.noizy.receipt.royalty_event"
    case lineageLink    = "ai.noizy.receipt.lineage_link"
    case killSwitch     = "ai.noizy.receipt.kill_switch"
    case manifestClose  = "ai.noizy.receipt.manifest_close"
    case simulation     = "ai.noizy.receipt.simulation"

    /// Short folder-safe name used in the filesystem layout.
    public var folderName: String {
        switch self {
        case .boot:           return "boot"
        case .sessionStart:   return "session_start"
        case .voiceCapture:   return "voice_capture"
        case .consentCheck:   return "consent_check"
        case .synthesis:      return "synthesis"
        case .vaultCommit:    return "vault_commit"
        case .revocation:     return "revocation"
        case .royaltyEvent:   return "royalty_event"
        case .lineageLink:    return "lineage_link"
        case .killSwitch:     return "kill_switch"
        case .manifestClose:  return "manifest_close"
        case .simulation:     return "simulation"
        }
    }

    /// True if this type may only be issued by RSP_001 directly (not by automated agents).
    public var requiresFounderSignature: Bool {
        self == .killSwitch
    }
}
