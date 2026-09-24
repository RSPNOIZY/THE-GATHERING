import Foundation

public actor DurableEventJournal {
    private let url: URL
    private let encoder: JSONEncoder

    public init(url: URL, encoder: JSONEncoder = .noizy) {
        self.url = url
        self.encoder = encoder
    }

    public func append(_ event: BridgeEvent) throws {
        try FileManager.default.createDirectory(
            at: url.deletingLastPathComponent(),
            withIntermediateDirectories: true
        )
        if !FileManager.default.fileExists(atPath: url.path) {
            FileManager.default.createFile(atPath: url.path, contents: nil)
        }
        let line = try encoder.encode(event) + Data([0x0A])
        let handle = try FileHandle(forWritingTo: url)
        try handle.seekToEnd()
        try handle.write(contentsOf: line)
        try handle.close()
    }

    public func recent(limit: Int) -> [BridgeEvent] {
        guard limit > 0,
              let text = try? String(contentsOf: url, encoding: .utf8)
        else {
            return []
        }

        return text
            .split(whereSeparator: \.isNewline)
            .suffix(limit)
            .compactMap { line -> BridgeEvent? in
                try? JSONDecoder.noizy.decode(BridgeEvent.self, from: Data(line.utf8))
            }
    }

    public func count() -> Int {
        guard let text = try? String(contentsOf: url, encoding: .utf8) else {
            return 0
        }
        return text.split(whereSeparator: \.isNewline).count
    }
}
