// Receipt.swift
// NOIZY Empire — the CloudEvents-style receipt envelope.
//
// Every receipt has:
//   - CloudEvents 1.0 outer fields (specversion, id, source, type, time, subject, datacontenttype)
//   - NOIZY proof block (previous_hash, proof_hash, canonicalization, version)
//   - Simulation flag (quarantine boundary)
//   - Domain-specific `data` payload as canonical JSON
//
// Spec: RECEIPT_SPINE.md "CloudEvents-style envelope"

import Foundation

/// The full receipt — CloudEvents envelope + NOIZY proof + data payload.
public struct Receipt: Codable, Sendable, Equatable, Identifiable {

    // ── CloudEvents 1.0 fields ────────────────────────────────────────
    public let specversion: String           // always "1.0"
    public let id: String                    // ULID-style unique id
    public let source: String                // "noizy://gabriel/<component>"
    public let type: ReceiptType
    public let time: Date
    public let datacontenttype: String       // always "application/json"
    public let subject: String?              // typically the actor_id

    // ── NOIZY proof block ─────────────────────────────────────────────
    public let noizyProof: NoizyProof

    // ── Simulation flag (quarantine boundary) ─────────────────────────
    public let noizySimulation: Bool

    // ── Domain payload ────────────────────────────────────────────────
    /// JSON-encoded data payload. Stored as `[String: AnyCodable]`-compatible
    /// dictionary so the envelope is uniform regardless of receipt type.
    public let data: ReceiptPayload

    public init(
        id: String,
        source: String,
        type: ReceiptType,
        time: Date,
        subject: String?,
        noizyProof: NoizyProof,
        noizySimulation: Bool,
        data: ReceiptPayload
    ) {
        self.specversion = "1.0"
        self.id = id
        self.source = source
        self.type = type
        self.time = time
        self.datacontenttype = "application/json"
        self.subject = subject
        self.noizyProof = noizyProof
        self.noizySimulation = noizySimulation
        self.data = data
    }

    enum CodingKeys: String, CodingKey {
        case specversion
        case id
        case source
        case type
        case time
        case datacontenttype
        case subject
        case noizyProof = "noizy_proof"
        case noizySimulation = "noizy_simulation"
        case data
    }
}

// MARK: - NOIZY proof block

public struct NoizyProof: Codable, Sendable, Equatable {
    public let version: String              // "0.1"
    public let previousHash: String         // 64-char hex SHA-256, or 64 zeros for genesis
    public let proofHash: String            // 64-char hex SHA-256
    public let canonicalization: String     // "rfc8785"

    public init(
        version: String = "0.1",
        previousHash: String,
        proofHash: String,
        canonicalization: String = "rfc8785"
    ) {
        self.version = version
        self.previousHash = previousHash
        self.proofHash = proofHash
        self.canonicalization = canonicalization
    }

    public static let genesisHash = String(repeating: "0", count: 64)

    enum CodingKeys: String, CodingKey {
        case version
        case previousHash = "previous_hash"
        case proofHash = "proof_hash"
        case canonicalization
    }
}

// MARK: - Receipt payload

/// A receipt payload is a JSON object with arbitrary key/value pairs.
/// We use [String: ReceiptValue] so encoding is deterministic + canonical.
public struct ReceiptPayload: Codable, Sendable, Equatable {
    public let fields: [String: ReceiptValue]

    public init(_ fields: [String: ReceiptValue]) {
        self.fields = fields
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        self.fields = try container.decode([String: ReceiptValue].self)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(fields)
    }

    public subscript(key: String) -> ReceiptValue? {
        fields[key]
    }
}

/// A JSON-compatible value used inside a receipt payload.
/// Sealed to a fixed set so canonical encoding is unambiguous.
public enum ReceiptValue: Codable, Sendable, Equatable {
    case string(String)
    case int(Int64)
    case double(Double)
    case bool(Bool)
    case null
    case array([ReceiptValue])
    case object([String: ReceiptValue])

    public init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() {
            self = .null
        } else if let b = try? c.decode(Bool.self) {
            self = .bool(b)
        } else if let i = try? c.decode(Int64.self) {
            self = .int(i)
        } else if let d = try? c.decode(Double.self) {
            self = .double(d)
        } else if let s = try? c.decode(String.self) {
            self = .string(s)
        } else if let a = try? c.decode([ReceiptValue].self) {
            self = .array(a)
        } else if let o = try? c.decode([String: ReceiptValue].self) {
            self = .object(o)
        } else {
            throw DecodingError.dataCorruptedError(in: c, debugDescription: "unsupported ReceiptValue")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null:           try c.encodeNil()
        case .bool(let v):    try c.encode(v)
        case .int(let v):     try c.encode(v)
        case .double(let v):  try c.encode(v)
        case .string(let v):  try c.encode(v)
        case .array(let v):   try c.encode(v)
        case .object(let v):  try c.encode(v)
        }
    }
}

// MARK: - Convenience constructors for ReceiptValue (ergonomic)

extension ReceiptValue: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) { self = .string(value) }
}
extension ReceiptValue: ExpressibleByIntegerLiteral {
    public init(integerLiteral value: Int64) { self = .int(value) }
}
extension ReceiptValue: ExpressibleByFloatLiteral {
    public init(floatLiteral value: Double) { self = .double(value) }
}
extension ReceiptValue: ExpressibleByBooleanLiteral {
    public init(booleanLiteral value: Bool) { self = .bool(value) }
}
extension ReceiptValue: ExpressibleByNilLiteral {
    public init(nilLiteral: ()) { self = .null }
}

// MARK: - ID helper

public enum ReceiptID {
    /// Generate a ULID-like time-ordered receipt ID.
    /// Format: rcpt_<26 base32 chars> = 48ms-resolution timestamp + 80 bits randomness.
    public static func generate(at instant: Date = Date()) -> String {
        let ms = UInt64(instant.timeIntervalSince1970 * 1000)
        let alphabet = Array("0123456789ABCDEFGHJKMNPQRSTVWXYZ")  // Crockford base32
        var out = "rcpt_"

        // 10 chars of timestamp (48 bits)
        var t = ms
        var tsChars = [Character]()
        for _ in 0..<10 {
            tsChars.append(alphabet[Int(t & 0x1F)])
            t >>= 5
        }
        out.append(contentsOf: tsChars.reversed())

        // 16 chars of randomness (80 bits)
        for _ in 0..<16 {
            out.append(alphabet[Int.random(in: 0..<32)])
        }
        return out
    }
}
