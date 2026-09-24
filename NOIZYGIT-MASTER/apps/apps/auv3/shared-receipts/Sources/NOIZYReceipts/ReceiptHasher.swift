// ReceiptHasher.swift
// NOIZY Empire — RFC 8785 canonical JSON + SHA-256 hash chain.
//
// proof_hash = SHA256(previous_proof_hash || canonical_json(envelope_without_proof_hash + data))
//
// "Canonical JSON" here means RFC 8785: sorted object keys, no whitespace,
// no escaped slashes, deterministic number encoding, UTF-8.
//
// Spec: RECEIPT_SPINE.md "Hash chain doctrine"

import Foundation
import CryptoKit

public enum ReceiptHasher {

    /// Compute the proof_hash for a receipt about to be appended.
    /// `receipt` is the candidate receipt — its `noizyProof.proofHash` is IGNORED
    /// and recomputed from the rest of its content + `previousHash`.
    public static func computeProofHash(
        receipt: Receipt,
        previousHash: String
    ) throws -> String {
        // Build the envelope-without-proofHash that gets hashed
        let signable = SignableReceipt(
            specversion: receipt.specversion,
            id: receipt.id,
            source: receipt.source,
            type: receipt.type.rawValue,
            time: receipt.time,
            datacontenttype: receipt.datacontenttype,
            subject: receipt.subject,
            noizySimulation: receipt.noizySimulation,
            data: receipt.data,
            previousHash: previousHash
        )
        let canonical = try canonicalJSON(signable)
        var hasher = SHA256()
        hasher.update(data: previousHash.data(using: .utf8)!)
        hasher.update(data: canonical)
        let digest = hasher.finalize()
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    /// Re-derive a receipt's proof_hash and check it matches what's stored.
    public static func verify(_ receipt: Receipt) throws -> Bool {
        let recomputed = try computeProofHash(
            receipt: receipt,
            previousHash: receipt.noizyProof.previousHash
        )
        return recomputed == receipt.noizyProof.proofHash
    }

    /// RFC 8785-style canonical JSON encoding.
    /// Apple's JSONEncoder with .sortedKeys + .withoutEscapingSlashes is RFC-8785-equivalent
    /// for the value subset we use (no NaN/Infinity, no large integers >2^53, no Unicode normalization).
    public static func canonicalJSON<T: Encodable>(_ value: T) throws -> Data {
        let encoder = canonicalEncoder()
        return try encoder.encode(value)
    }

    /// Build the canonical JSONEncoder used for both hashing and sidecar writing.
    public static func canonicalEncoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
        encoder.dateEncodingStrategy = .custom { date, encoder in
            // Local formatter — ISO8601DateFormatter is not Sendable, build fresh per call.
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            var container = encoder.singleValueContainer()
            try container.encode(f.string(from: date))
        }
        return encoder
    }

    /// Build the matching JSONDecoder. Uses the same fractional-second ISO 8601 format
    /// that the encoder writes — critical for round-trip parity.
    public static func canonicalDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let str = try container.decode(String.self)
            // Local formatters — ISO8601DateFormatter is not Sendable.
            let withFractional = ISO8601DateFormatter()
            withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let d = withFractional.date(from: str) { return d }
            let withoutFractional = ISO8601DateFormatter()
            withoutFractional.formatOptions = [.withInternetDateTime]
            if let d = withoutFractional.date(from: str) { return d }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "invalid ISO8601 date: \(str)")
        }
        return decoder
    }
}

// MARK: - Signable shape

/// The shape that gets hashed: everything in a Receipt EXCEPT the proof_hash itself
/// (since the proof_hash is what we're computing). The previous_hash is included
/// inline so a single canonical JSON contains all chain inputs.
private struct SignableReceipt: Encodable {
    let specversion: String
    let id: String
    let source: String
    let type: String
    let time: Date
    let datacontenttype: String
    let subject: String?
    let noizySimulation: Bool
    let data: ReceiptPayload
    let previousHash: String

    enum CodingKeys: String, CodingKey {
        case specversion
        case id
        case source
        case type
        case time
        case datacontenttype
        case subject
        case noizySimulation = "noizy_simulation"
        case data
        case previousHash = "previous_hash"
    }
}
