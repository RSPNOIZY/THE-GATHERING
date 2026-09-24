import XCTest
@testable import Lucy

final class LucyTests: XCTestCase {
    func testLucyIdentity() {
        XCTAssertEqual(AppState.shared.persona, .lucy)
    }
}
