import XCTest
@testable import Heaven

final class HeavenTests: XCTestCase {
    func testPersonaSwitch() {
        let state = AppState.shared
        state.switchPersona(to: .lucy)
        XCTAssertEqual(state.persona, .lucy)
        state.switchPersona(to: .rsp)
        XCTAssertEqual(state.persona, .rsp)
    }

    func testHeavenConfig() {
        let config = HeavenConfig.default
        XCTAssertFalse(config.heaven17URL.isEmpty)
        XCTAssertFalse(config.dreamChamberURL.isEmpty)
    }
}
