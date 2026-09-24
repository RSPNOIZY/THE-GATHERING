import XCTest

final class MickyTests: XCTestCase {
    func testMickyIdentity() {
        let bridge = MickyBridge()
        XCTAssertEqual(bridge.name, "Micky")
        XCTAssertEqual(bridge.role, "Legacy Audio Bridge")
    }
}
