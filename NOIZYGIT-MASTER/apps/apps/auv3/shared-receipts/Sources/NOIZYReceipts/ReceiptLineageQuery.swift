// ReceiptLineageQuery.swift
// NOIZY Empire — walk ancestry, replay chain, verify integrity from EITHER store.
//
// The Receipt Spine has two parallel sources of truth:
//   1. SQLite (the index — fast queries)
//   2. JSON sidecars (the canonical disk store — survives DB corruption)
//
// This file proves the spine's resilience: lineage MUST be reconstructible from
// either store alone. The first milestone test exercises both paths.
//
// Spec: RECEIPT_SPINE.md "The first milestone"

import Foundation

public enum LineageError: Error, CustomStringConvertible, Sendable {
    case brokenChain(at: String, expected: String, got: String)
    case orphanedReceipt(id: String)
    case multipleGenesis
    case noGenesis
    case hashMismatch(id: String)
    case simulationContamination(id: String, ancestorId: String)

    public var description: String {
        switch self {
        case .brokenChain(let at, let e, let g):
            return "broken chain at \(at): expected previous_hash=\(e), got \(g)"
        case .orphanedReceipt(let id):
            return "orphaned receipt: \(id) — previous_hash references unknown receipt"
        case .multipleGenesis:
            return "more than one receipt has previous_hash=00...00"
        case .noGenesis:
            return "no genesis receipt found"
        case .hashMismatch(let id):
            return "hash mismatch on receipt \(id) — content does not match stored proof_hash"
        case .simulationContamination(let id, let ancestorId):
            return "simulation contamination: real receipt \(id) descends from simulation \(ancestorId)"
        }
    }
}

public struct LineageReport: Sendable {
    public let totalCount: Int
    public let realCount: Int
    public let simulationCount: Int
    public let chainTipHash: String
    public let genesisId: String
    public let walkOrder: [String]   // receipt ids in chain order
    public let allHashesValid: Bool

    public var description: String {
        """
        ─── LINEAGE REPORT ───
          total:        \(totalCount)
          real:         \(realCount)
          simulation:   \(simulationCount)
          genesis id:   \(genesisId)
          tip hash:     \(chainTipHash.prefix(16))…
          walk length:  \(walkOrder.count)
          all hashes:   \(allHashesValid ? "✓ valid" : "✗ INVALID")
        ──────────────────────
        """
    }
}

public enum ReceiptLineageQuery {

    /// Walk the chain in chronological order. Verifies:
    ///   - exactly one genesis
    ///   - every previous_hash references the actual prior tip
    ///   - every proof_hash recomputes from its content + previous_hash
    ///   - no real receipt descends from a simulation receipt
    public static func walk(_ receipts: [Receipt]) throws -> LineageReport {
        guard !receipts.isEmpty else {
            throw LineageError.noGenesis
        }

        // Find the genesis (previous_hash == "0"*64)
        let genesisCandidates = receipts.filter { $0.noizyProof.previousHash == NoizyProof.genesisHash }
        guard !genesisCandidates.isEmpty else { throw LineageError.noGenesis }
        guard genesisCandidates.count == 1 else { throw LineageError.multipleGenesis }
        let genesis = genesisCandidates[0]

        // Build a hash → receipt index for O(1) lookups
        var byProofHash: [String: Receipt] = [:]
        for r in receipts {
            byProofHash[r.noizyProof.proofHash] = r
        }

        // Walk forward from genesis
        var walkOrder: [String] = []
        var seenSimulationHashes: Set<String> = []
        var current: Receipt? = genesis

        while let r = current {
            walkOrder.append(r.id)
            if r.noizySimulation {
                seenSimulationHashes.insert(r.noizyProof.proofHash)
            }

            // Verify the hash recomputes
            do {
                let valid = try ReceiptHasher.verify(r)
                if !valid {
                    throw LineageError.hashMismatch(id: r.id)
                }
            } catch {
                if let lineage = error as? LineageError { throw lineage }
                throw LineageError.hashMismatch(id: r.id)
            }

            // Quarantine: if a real receipt's previous_hash points to a simulation, reject
            if !r.noizySimulation && seenSimulationHashes.contains(r.noizyProof.previousHash) {
                if let parent = byProofHash[r.noizyProof.previousHash] {
                    throw LineageError.simulationContamination(id: r.id, ancestorId: parent.id)
                }
            }

            // Find next: the receipt whose previous_hash == this one's proof_hash
            current = receipts.first { $0.noizyProof.previousHash == r.noizyProof.proofHash }
        }

        // Sanity: every receipt should have been walked
        if walkOrder.count != receipts.count {
            // Some receipt's previous_hash references a hash nobody emitted
            let walked = Set(walkOrder)
            for r in receipts where !walked.contains(r.id) {
                throw LineageError.orphanedReceipt(id: r.id)
            }
        }

        let realCount = receipts.filter { !$0.noizySimulation }.count
        let simulationCount = receipts.count - realCount
        let tipHash = walkOrder.last
            .flatMap { id in receipts.first { $0.id == id } }
            .map { $0.noizyProof.proofHash } ?? NoizyProof.genesisHash

        return LineageReport(
            totalCount: receipts.count,
            realCount: realCount,
            simulationCount: simulationCount,
            chainTipHash: tipHash,
            genesisId: genesis.id,
            walkOrder: walkOrder,
            allHashesValid: true
        )
    }

    /// Reconstruct lineage from SQLite alone.
    public static func walkFromSQLite(_ writer: ReceiptWriter) throws -> LineageReport {
        let receipts = try writer.store.fetchAllInChainOrder()
        return try walk(receipts)
    }

    /// Reconstruct lineage from JSON sidecars alone (filesystem source of truth).
    public static func walkFromSidecars(_ writer: ReceiptWriter) throws -> LineageReport {
        let receipts = try writer.loadAllSidecars()
        return try walk(receipts)
    }

    /// Cross-check: SQLite and sidecars must produce identical walk orders + tip hashes.
    public static func crossVerify(_ writer: ReceiptWriter) throws -> Bool {
        let sql = try walkFromSQLite(writer)
        let fs = try walkFromSidecars(writer)
        return sql.walkOrder == fs.walkOrder
            && sql.chainTipHash == fs.chainTipHash
            && sql.totalCount == fs.totalCount
    }
}
