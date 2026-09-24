import Foundation
import MCP

// Entry point for che-logic-pro-mcp
// Logic Pro MCP Server - Control Logic Pro via AppleScript and MIDI

let server = try await CheLogicProMCPServer()
try await server.run()
