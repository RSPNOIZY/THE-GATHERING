// ReceiptSchemaValidator.swift
// NOIZY Empire — JSON Schema Draft 2020-12 validation (subset for v0.1).
//
// This is a MINIMAL validator that enforces the exact shape of a NOIZY receipt.
// It doesn't implement the full Draft 2020-12 spec — it implements the subset
// needed to enforce the fields the Receipt Spine cares about. v0.2 will swap
// in a full validator (e.g. JSONSchema.swift) once the spine is operational.
//
// Spec: RECEIPT_SPINE.md "Schema-valid" (Rule 1)

import Foundation

public enum ReceiptValidationError: Error, CustomStringConvertible, Sendable {
    case missingField(String)
    case wrongType(field: String, expected: String, got: String)
    case invalidValue(field: String, reason: String)
    case unknownReceiptType(String)

    public var description: String {
        switch self {
        case .missingField(let f):
            return "missing required field: \(f)"
        case .wrongType(let f, let e, let g):
            return "field '\(f)' must be \(e), got \(g)"
        case .invalidValue(let f, let r):
            return "field '\(f)' invalid: \(r)"
        case .unknownReceiptType(let t):
            return "unknown receipt type: \(t)"
        }
    }
}

public enum ReceiptSchemaValidator {

    /// Validate a Receipt struct against the v0.1 schema.
    /// Throws on first violation. Returns silently on success.
    public static func validate(_ receipt: Receipt) throws {
        // CloudEvents required fields
        guard receipt.specversion == "1.0" else {
            throw ReceiptValidationError.invalidValue(field: "specversion", reason: "must be \"1.0\", got \"\(receipt.specversion)\"")
        }
        guard !receipt.id.isEmpty else {
            throw ReceiptValidationError.missingField("id")
        }
        guard receipt.id.hasPrefix("rcpt_") else {
            throw ReceiptValidationError.invalidValue(field: "id", reason: "must start with \"rcpt_\"")
        }
        guard !receipt.source.isEmpty else {
            throw ReceiptValidationError.missingField("source")
        }
        guard receipt.source.hasPrefix("noizy://") else {
            throw ReceiptValidationError.invalidValue(field: "source", reason: "must start with \"noizy://\"")
        }
        guard receipt.datacontenttype == "application/json" else {
            throw ReceiptValidationError.invalidValue(field: "datacontenttype", reason: "must be \"application/json\"")
        }

        // NOIZY proof block
        try validateProofBlock(receipt.noizyProof)

        // Receipt type must be in the fixed enum (already enforced by Swift type system)
        // but we re-check in case of decode-from-JSON paths
        guard ReceiptType.allCases.contains(receipt.type) else {
            throw ReceiptValidationError.unknownReceiptType(receipt.type.rawValue)
        }

        // Founder-only types must have subject == "RSP_001"
        if receipt.type.requiresFounderSignature {
            guard receipt.subject == "RSP_001" else {
                throw ReceiptValidationError.invalidValue(
                    field: "subject",
                    reason: "type \(receipt.type.rawValue) requires subject = \"RSP_001\""
                )
            }
        }

        // Data payload must be non-empty
        guard !receipt.data.fields.isEmpty else {
            throw ReceiptValidationError.invalidValue(field: "data", reason: "must contain at least one field")
        }
    }

    private static func validateProofBlock(_ proof: NoizyProof) throws {
        guard proof.version == "0.1" else {
            throw ReceiptValidationError.invalidValue(field: "noizy_proof.version", reason: "must be \"0.1\", got \"\(proof.version)\"")
        }
        guard isHex64(proof.previousHash) else {
            throw ReceiptValidationError.invalidValue(field: "noizy_proof.previous_hash", reason: "must be 64-char lowercase hex SHA-256")
        }
        guard isHex64(proof.proofHash) else {
            throw ReceiptValidationError.invalidValue(field: "noizy_proof.proof_hash", reason: "must be 64-char lowercase hex SHA-256")
        }
        guard proof.canonicalization == "rfc8785" else {
            throw ReceiptValidationError.invalidValue(field: "noizy_proof.canonicalization", reason: "must be \"rfc8785\"")
        }
    }

    private static func isHex64(_ s: String) -> Bool {
        guard s.count == 64 else { return false }
        for c in s {
            guard c.isHexDigit else { return false }
            // Enforce lowercase
            if c.isLetter && !c.isLowercase { return false }
        }
        return true
    }
}
