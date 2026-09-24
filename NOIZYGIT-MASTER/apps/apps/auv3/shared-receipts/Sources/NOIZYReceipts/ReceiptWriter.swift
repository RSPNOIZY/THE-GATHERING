// ReceiptWriter.swift
// NOIZY Empire — atomic dual-write append for the Receipt Spine.
//
// THE 5 RULES (all five must hold or the receipt is rejected):
//   1. Schema valid (ReceiptSchemaValidator)
//   2. Hash-chained from chain tip (ReceiptHasher)
//   3. Persisted to SQLite (ReceiptStore)
//   4. Persisted to JSON sidecar at <container>/receipts/YYYY-MM-DD/<type>/<id>.json
//   5. Lives in the App Group container
//
// Plus the simulation quarantine rule:
//   - A real receipt cannot have a simulation receipt as its previous_hash ancestor
//   - A simulation receipt CAN reference real ancestors (one-way link)
//
// Spec: RECEIPT_SPINE.md "The 5 immovable rules" + "Simulation quarantine rule"

import Foundation

public enum ReceiptWriterError: Error, CustomStringConvertible, Sendable {
    case validationFailed(ReceiptValidationError)
    case hashChainBroken(reason: String)
    case sqliteFailed(ReceiptStoreError)
    case sidecarFailed(reason: String)
    case simulationQuarantine(reason: String)

    public var description: String {
        switch self {
        case .validationFailed(let e):     return "validation: \(e)"
        case .hashChainBroken(let r):      return "hash chain: \(r)"
        case .sqliteFailed(let e):         return "sqlite: \(e)"
        case .sidecarFailed(let r):        return "sidecar: \(r)"
        case .simulationQuarantine(let r): return "simulation quarantine: \(r)"
        }
    }
}

public final class ReceiptWriter: @unchecked Sendable {
    public let containerURL: URL
    public let store: ReceiptStore
    private let lock = NSLock()
    private let isoFolderFormatter: DateFormatter

    /// Initialize the writer against an App Group shared container.
    /// `containerURL` should come from
    /// `FileManager.default.containerURL(forSecurityApplicationGroupIdentifier:)`
    /// in production. For dev / SPM tests, pass any directory.
    public init(containerURL: URL) throws {
        self.containerURL = containerURL
        try FileManager.default.createDirectory(at: containerURL, withIntermediateDirectories: true)
        let dbURL = containerURL.appendingPathComponent("receipts.sqlite")
        self.store = try ReceiptStore(dbPath: dbURL)
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC")
        self.isoFolderFormatter = f
    }

    /// Convenience initializer for the default App Group identifier.
    /// Falls back to ~/Library/Containers/NOIZY/Receipts/ if the App Group is unavailable
    /// (e.g. running outside of an extension during dev).
    public static func defaultContainer(appGroupID: String = "group.ai.noizy.receipts") throws -> URL {
        if let url = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupID) {
            return url.appendingPathComponent("ReceiptSpine", isDirectory: true)
        }
        // Dev fallback
        let home = FileManager.default.homeDirectoryForCurrentUser
        return home.appendingPathComponent("Library/Containers/NOIZY/Receipts", isDirectory: true)
    }

    /// Append a candidate receipt. The candidate's `previousHash` and `proofHash`
    /// are IGNORED — both are recomputed from the chain tip + canonical content.
    /// Returns the finalized receipt that was actually persisted.
    @discardableResult
    public func append(_ candidate: Receipt) throws -> Receipt {
        lock.lock(); defer { lock.unlock() }

        // (2) Hash chain from current tip
        let previousHash: String
        do {
            previousHash = try store.chainTipHash() ?? NoizyProof.genesisHash
        } catch {
            throw ReceiptWriterError.sqliteFailed(error as? ReceiptStoreError ?? .stepFailed("\(error)"))
        }

        // Build the receipt with the freshly computed previousHash + proofHash
        let intermediate = Receipt(
            id: candidate.id,
            source: candidate.source,
            type: candidate.type,
            time: candidate.time,
            subject: candidate.subject,
            noizyProof: NoizyProof(
                previousHash: previousHash,
                proofHash: NoizyProof.genesisHash   // placeholder, recomputed below
            ),
            noizySimulation: candidate.noizySimulation,
            data: candidate.data
        )

        let proofHash: String
        do {
            proofHash = try ReceiptHasher.computeProofHash(receipt: intermediate, previousHash: previousHash)
        } catch {
            throw ReceiptWriterError.hashChainBroken(reason: "\(error)")
        }

        let finalized = Receipt(
            id: candidate.id,
            source: candidate.source,
            type: candidate.type,
            time: candidate.time,
            subject: candidate.subject,
            noizyProof: NoizyProof(previousHash: previousHash, proofHash: proofHash),
            noizySimulation: candidate.noizySimulation,
            data: candidate.data
        )

        // (1) Schema validation
        do {
            try ReceiptSchemaValidator.validate(finalized)
        } catch let e as ReceiptValidationError {
            throw ReceiptWriterError.validationFailed(e)
        }

        // Simulation quarantine check
        try enforceSimulationQuarantine(candidate: finalized, previousHash: previousHash)

        // (3) SQLite write
        do {
            try store.append(finalized)
        } catch let e as ReceiptStoreError {
            throw ReceiptWriterError.sqliteFailed(e)
        }

        // (4) JSON sidecar write
        try writeSidecar(finalized)

        return finalized
    }

    /// Replay every receipt from the JSON sidecar tree (filesystem source of truth).
    /// Used by ReceiptLineageQuery for "files alone" reconstruction.
    public func loadAllSidecars() throws -> [Receipt] {
        let receiptsRoot = containerURL.appendingPathComponent("receipts", isDirectory: true)
        guard FileManager.default.fileExists(atPath: receiptsRoot.path) else { return [] }

        var found: [Receipt] = []
        let decoder = ReceiptHasher.canonicalDecoder()

        if let enumerator = FileManager.default.enumerator(at: receiptsRoot, includingPropertiesForKeys: nil) {
            for case let url as URL in enumerator where url.pathExtension == "json" {
                if let data = try? Data(contentsOf: url),
                   let receipt = try? decoder.decode(Receipt.self, from: data) {
                    found.append(receipt)
                }
            }
        }
        // Sort by time ASC, then by id ASC, so chain order is deterministic
        found.sort { (a, b) in
            if a.time != b.time { return a.time < b.time }
            return a.id < b.id
        }
        return found
    }

    // MARK: - Internals

    private func writeSidecar(_ receipt: Receipt) throws {
        let datePart = isoFolderFormatter.string(from: receipt.time)
        let folder = containerURL
            .appendingPathComponent("receipts", isDirectory: true)
            .appendingPathComponent(datePart, isDirectory: true)
            .appendingPathComponent(receipt.type.folderName, isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        } catch {
            throw ReceiptWriterError.sidecarFailed(reason: "create dir: \(error)")
        }

        let target = folder.appendingPathComponent("\(receipt.id).json")
        let tmp = target.appendingPathExtension("tmp")

        do {
            let canonical = try ReceiptHasher.canonicalJSON(receipt)
            // Pretty-print for human inspection (not the canonical-hash form, but a more
            // readable mirror — the SQLite envelope_json is the canonical authoritative copy).
            let pretty = try JSONSerialization.data(
                withJSONObject: JSONSerialization.jsonObject(with: canonical),
                options: [.prettyPrinted, .sortedKeys]
            )
            try pretty.write(to: tmp, options: .atomic)
            if FileManager.default.fileExists(atPath: target.path) {
                try FileManager.default.removeItem(at: target)
            }
            try FileManager.default.moveItem(at: tmp, to: target)
        } catch {
            throw ReceiptWriterError.sidecarFailed(reason: "\(error)")
        }
    }

    private func enforceSimulationQuarantine(candidate: Receipt, previousHash: String) throws {
        // If the candidate is REAL, its previous receipt must also be REAL.
        // If the candidate is SIMULATION, anything is allowed (one-way link).
        guard !candidate.noizySimulation else { return }

        // Genesis: nothing to check
        if previousHash == NoizyProof.genesisHash { return }

        // Look up the previous receipt — if found and simulation, reject
        do {
            let allReceipts = try store.fetchAllInChainOrder()
            if let prev = allReceipts.first(where: { $0.noizyProof.proofHash == previousHash }) {
                if prev.noizySimulation {
                    throw ReceiptWriterError.simulationQuarantine(
                        reason: "real receipt \(candidate.id) cannot reference simulation parent \(prev.id)"
                    )
                }
            }
        } catch let e as ReceiptStoreError {
            throw ReceiptWriterError.sqliteFailed(e)
        }
    }
}
