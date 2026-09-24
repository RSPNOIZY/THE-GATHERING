// ReceiptStore.swift
// NOIZY Empire — WAL-backed SQLite store for the Receipt Spine.
//
// Uses libsqlite3 directly via the system SQLite3 module (no SPM dependency).
// WAL mode is enabled at open so concurrent readers don't block while a writer
// is appending receipts.
//
// Spec: RECEIPT_SPINE.md "Storage layout" + Rule 2

import Foundation
import SQLite3

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

public enum ReceiptStoreError: Error, CustomStringConvertible, Sendable {
    case cannotOpen(String)
    case prepareFailed(String)
    case stepFailed(String)
    case bindFailed(String)
    case integrityViolation(String)
    case notFound

    public var description: String {
        switch self {
        case .cannotOpen(let s):       return "cannot open SQLite: \(s)"
        case .prepareFailed(let s):    return "prepare failed: \(s)"
        case .stepFailed(let s):       return "step failed: \(s)"
        case .bindFailed(let s):       return "bind failed: \(s)"
        case .integrityViolation(let s): return "integrity violation: \(s)"
        case .notFound:                return "not found"
        }
    }
}

public final class ReceiptStore: @unchecked Sendable {
    public let dbPath: URL
    private var db: OpaquePointer?
    private let lock = NSLock()

    public init(dbPath: URL) throws {
        self.dbPath = dbPath
        try FileManager.default.createDirectory(
            at: dbPath.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )

        var handle: OpaquePointer?
        let flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX
        guard sqlite3_open_v2(dbPath.path, &handle, flags, nil) == SQLITE_OK else {
            let msg = handle.flatMap { String(cString: sqlite3_errmsg($0)) } ?? "unknown"
            sqlite3_close(handle)
            throw ReceiptStoreError.cannotOpen(msg)
        }
        self.db = handle

        // Enable WAL mode + foreign keys + busy timeout
        try execute("PRAGMA journal_mode=WAL;")
        try execute("PRAGMA synchronous=NORMAL;")
        try execute("PRAGMA foreign_keys=ON;")
        try execute("PRAGMA busy_timeout=5000;")

        // Create the schema
        try execute("""
            CREATE TABLE IF NOT EXISTS receipts (
                id              TEXT PRIMARY KEY,
                receipt_type    TEXT NOT NULL,
                source          TEXT NOT NULL,
                subject         TEXT,
                time_iso        TEXT NOT NULL,
                time_unix_ms    INTEGER NOT NULL,
                previous_hash   TEXT NOT NULL,
                proof_hash      TEXT NOT NULL UNIQUE,
                noizy_simulation INTEGER NOT NULL CHECK (noizy_simulation IN (0, 1)),
                envelope_json   TEXT NOT NULL,
                created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        """)
        try execute("CREATE INDEX IF NOT EXISTS idx_receipts_time ON receipts(time_unix_ms);")
        try execute("CREATE INDEX IF NOT EXISTS idx_receipts_type ON receipts(receipt_type);")
        try execute("CREATE INDEX IF NOT EXISTS idx_receipts_subject ON receipts(subject);")
        try execute("CREATE INDEX IF NOT EXISTS idx_receipts_previous ON receipts(previous_hash);")
    }

    deinit {
        if let db = db { sqlite3_close(db) }
    }

    // MARK: - Public API

    /// Append a receipt. Caller has already validated and hash-chained it.
    public func append(_ receipt: Receipt) throws {
        lock.lock(); defer { lock.unlock() }

        let envelopeData = try ReceiptHasher.canonicalJSON(receipt)
        let envelopeJSON = String(data: envelopeData, encoding: .utf8) ?? "{}"

        let sql = """
            INSERT INTO receipts (
                id, receipt_type, source, subject, time_iso, time_unix_ms,
                previous_hash, proof_hash, noizy_simulation, envelope_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        var stmt: OpaquePointer?
        defer { if stmt != nil { sqlite3_finalize(stmt) } }

        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReceiptStoreError.prepareFailed(lastError())
        }

        let isoFormatter = ISO8601DateFormatter()
        isoFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        sqlite3_bind_text(stmt, 1, receipt.id, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 2, receipt.type.rawValue, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 3, receipt.source, -1, SQLITE_TRANSIENT)
        if let subj = receipt.subject {
            sqlite3_bind_text(stmt, 4, subj, -1, SQLITE_TRANSIENT)
        } else {
            sqlite3_bind_null(stmt, 4)
        }
        sqlite3_bind_text(stmt, 5, isoFormatter.string(from: receipt.time), -1, SQLITE_TRANSIENT)
        sqlite3_bind_int64(stmt, 6, sqlite3_int64(receipt.time.timeIntervalSince1970 * 1000))
        sqlite3_bind_text(stmt, 7, receipt.noizyProof.previousHash, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 8, receipt.noizyProof.proofHash, -1, SQLITE_TRANSIENT)
        sqlite3_bind_int(stmt, 9, receipt.noizySimulation ? 1 : 0)
        sqlite3_bind_text(stmt, 10, envelopeJSON, -1, SQLITE_TRANSIENT)

        let rc = sqlite3_step(stmt)
        guard rc == SQLITE_DONE else {
            throw ReceiptStoreError.stepFailed(lastError())
        }
    }

    /// Fetch the most recent receipt's proof_hash (for chaining), or nil if empty.
    public func chainTipHash() throws -> String? {
        lock.lock(); defer { lock.unlock() }
        let sql = "SELECT proof_hash FROM receipts ORDER BY time_unix_ms DESC, id DESC LIMIT 1;"
        var stmt: OpaquePointer?
        defer { if stmt != nil { sqlite3_finalize(stmt) } }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReceiptStoreError.prepareFailed(lastError())
        }
        let rc = sqlite3_step(stmt)
        if rc == SQLITE_ROW, let cstr = sqlite3_column_text(stmt, 0) {
            return String(cString: cstr)
        }
        if rc == SQLITE_DONE { return nil }
        throw ReceiptStoreError.stepFailed(lastError())
    }

    /// Fetch a single receipt by id.
    public func fetch(id: String) throws -> Receipt? {
        lock.lock(); defer { lock.unlock() }
        let sql = "SELECT envelope_json FROM receipts WHERE id = ? LIMIT 1;"
        var stmt: OpaquePointer?
        defer { if stmt != nil { sqlite3_finalize(stmt) } }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReceiptStoreError.prepareFailed(lastError())
        }
        sqlite3_bind_text(stmt, 1, id, -1, SQLITE_TRANSIENT)
        let rc = sqlite3_step(stmt)
        guard rc == SQLITE_ROW, let cstr = sqlite3_column_text(stmt, 0) else {
            return nil
        }
        let json = String(cString: cstr)
        guard let data = json.data(using: .utf8) else { return nil }
        let decoder = ReceiptHasher.canonicalDecoder()
        return try? decoder.decode(Receipt.self, from: data)
    }

    /// Fetch all receipts in chain order (oldest first).
    public func fetchAllInChainOrder() throws -> [Receipt] {
        lock.lock(); defer { lock.unlock() }
        let sql = "SELECT envelope_json FROM receipts ORDER BY time_unix_ms ASC, id ASC;"
        var stmt: OpaquePointer?
        defer { if stmt != nil { sqlite3_finalize(stmt) } }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReceiptStoreError.prepareFailed(lastError())
        }
        var out: [Receipt] = []
        let decoder = ReceiptHasher.canonicalDecoder()
        while sqlite3_step(stmt) == SQLITE_ROW {
            if let cstr = sqlite3_column_text(stmt, 0) {
                let json = String(cString: cstr)
                if let data = json.data(using: .utf8),
                   let r = try? decoder.decode(Receipt.self, from: data) {
                    out.append(r)
                }
            }
        }
        return out
    }

    /// Total count of receipts.
    public func count() throws -> Int {
        lock.lock(); defer { lock.unlock() }
        let sql = "SELECT COUNT(*) FROM receipts;"
        var stmt: OpaquePointer?
        defer { if stmt != nil { sqlite3_finalize(stmt) } }
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            throw ReceiptStoreError.prepareFailed(lastError())
        }
        guard sqlite3_step(stmt) == SQLITE_ROW else { return 0 }
        return Int(sqlite3_column_int64(stmt, 0))
    }

    // MARK: - Internals

    private func execute(_ sql: String) throws {
        var err: UnsafeMutablePointer<CChar>?
        if sqlite3_exec(db, sql, nil, nil, &err) != SQLITE_OK {
            let msg = err.map { String(cString: $0) } ?? "unknown"
            sqlite3_free(err)
            throw ReceiptStoreError.stepFailed(msg)
        }
    }

    private func lastError() -> String {
        guard let db = db else { return "no db" }
        return String(cString: sqlite3_errmsg(db))
    }
}
