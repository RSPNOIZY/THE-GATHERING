import XCTest

final class GabrielTests: XCTestCase {
    func testGabrielIdentity() {
        let cmd = GabrielCommander()
        XCTAssertEqual(cmd.name, "Gabriel")
    }
}
