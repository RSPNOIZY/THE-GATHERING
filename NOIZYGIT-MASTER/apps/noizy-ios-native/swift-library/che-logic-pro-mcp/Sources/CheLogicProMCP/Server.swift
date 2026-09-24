import Foundation
import MCP

/// Main MCP Server for Logic Pro control
/// Provides tools for controlling Logic Pro via AppleScript, MIDI, and Scripter templates
class CheLogicProMCPServer {
    private let server: Server
    private let transport: StdioTransport
    private let controller: LogicProController
    private let midiManager: MIDIManager
    private let scripterManager: ScripterTemplateManager
    private let tools: [Tool]

    init() async throws {
        server = Server(
            name: "che-logic-pro-mcp",
            version: "1.0.0"
        )
        transport = StdioTransport()
        controller = LogicProController()
        midiManager = MIDIManager.shared
        scripterManager = ScripterTemplateManager.shared

        tools = Self.defineTools()
        await registerHandlers()
    }

    // MARK: - Tool Definitions

    private static func defineTools() -> [Tool] {
        var allTools: [Tool] = []

        // === App Control Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_is_running",
                description: "Check if Logic Pro is currently running",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_launch",
                description: "Launch Logic Pro and wait for it to be ready",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_activate",
                description: "Bring Logic Pro to the front (make it the active app)",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_quit",
                description: "Quit Logic Pro",
                inputSchema: .object([:])
            ),
        ])

        // === Transport Control Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_play",
                description: "Start playback (or toggle play/stop)",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_stop",
                description: "Stop playback",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_record",
                description: "Start recording",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_rewind",
                description: "Go to the beginning of the project",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_forward",
                description: "Move playhead forward",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_backward",
                description: "Move playhead backward",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_cycle",
                description: "Toggle cycle (loop) mode on/off",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_metronome",
                description: "Toggle metronome on/off",
                inputSchema: .object([:])
            ),
        ])

        // === Track Management Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_create_track",
                description: "Create a new track in Logic Pro",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "type": .object([
                            "type": .string("string"),
                            "description": .string("Track type: 'midi' (software instrument), 'audio', or 'drummer'"),
                            "enum": .array([.string("midi"), .string("audio"), .string("drummer")])
                        ])
                    ]),
                    "required": .array([.string("type")])
                ])
            ),
            Tool(
                name: "logic_solo_track",
                description: "Toggle solo on the selected track",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_mute_track",
                description: "Toggle mute on the selected track",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_arm_track",
                description: "Arm the selected track for recording",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_delete_track",
                description: "Delete the selected track",
                inputSchema: .object([:])
            ),
        ])

        // === View/Window Control Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_toggle_mixer",
                description: "Toggle the Mixer view",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_piano_roll",
                description: "Toggle the Piano Roll editor",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_automation",
                description: "Toggle Automation view",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_editors",
                description: "Toggle the Editors pane",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_library",
                description: "Toggle the Library sidebar",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_inspector",
                description: "Toggle the Inspector sidebar",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_toggle_score",
                description: "Toggle the Score Editor",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_zoom_in",
                description: "Zoom in on the timeline",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_zoom_out",
                description: "Zoom out on the timeline",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_zoom_fit",
                description: "Zoom to fit all content in view",
                inputSchema: .object([:])
            ),
        ])

        // === Editing Command Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_undo",
                description: "Undo the last action",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_redo",
                description: "Redo the previously undone action",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_cut",
                description: "Cut the selected regions/events",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_copy",
                description: "Copy the selected regions/events",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_paste",
                description: "Paste from clipboard",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_duplicate",
                description: "Duplicate the selected regions",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_split",
                description: "Split regions at the playhead position",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_join",
                description: "Join selected regions into one",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_quantize",
                description: "Quantize selected MIDI notes",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_select_all",
                description: "Select all items in the current view",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_delete_selected",
                description: "Delete selected items",
                inputSchema: .object([:])
            ),
        ])

        // === Project Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_new_project",
                description: "Create a new project (opens template chooser)",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_open_project",
                description: "Open a project (shows file dialog)",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_save_project",
                description: "Save the current project",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_save_as",
                description: "Save the project with a new name",
                inputSchema: .object([:])
            ),
            Tool(
                name: "logic_bounce",
                description: "Open the Bounce dialog to export audio",
                inputSchema: .object([:])
            ),
        ])

        // === Generic Shortcut Tool ===
        allTools.append(
            Tool(
                name: "logic_shortcut",
                description: "Execute any keyboard shortcut in Logic Pro. Use this for commands not covered by other tools.",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "key": .object([
                            "type": .string("string"),
                            "description": .string("The key to press (single character like 'a', 'z', '1', etc.)")
                        ]),
                        "modifiers": .object([
                            "type": .string("array"),
                            "items": .object(["type": .string("string")]),
                            "description": .string("Modifier keys: 'command', 'shift', 'option', 'control'. Example: ['command', 'shift']")
                        ])
                    ]),
                    "required": .array([.string("key")])
                ])
            )
        )

        // === Utility Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "logic_screenshot",
                description: "Take a screenshot of the Logic Pro window",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "save_path": .object([
                            "type": .string("string"),
                            "description": .string("Path to save the screenshot. Default: /tmp/logic_pro_screenshot.png")
                        ])
                    ])
                ])
            ),
            Tool(
                name: "logic_window_info",
                description: "Get information about Logic Pro windows",
                inputSchema: .object([:])
            ),
        ])

        // === MIDI Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "midi_create_virtual_port",
                description: "Create a virtual MIDI port that appears in Logic Pro. Must be called before sending MIDI. After creation, select this port in Logic's MIDI preferences.",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "name": .object([
                            "type": .string("string"),
                            "description": .string("Name for the virtual MIDI port. Default: 'Logic Pro MCP'")
                        ])
                    ])
                ])
            ),
            Tool(
                name: "midi_list_ports",
                description: "List all available MIDI ports on the system",
                inputSchema: .object([:])
            ),
            Tool(
                name: "midi_send_note",
                description: "Send a MIDI note (Note On + Note Off after duration)",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "channel": .object([
                            "type": .string("integer"),
                            "description": .string("MIDI channel (1-16)"),
                            "minimum": .int(1),
                            "maximum": .int(16)
                        ]),
                        "note": .object([
                            "type": .string("integer"),
                            "description": .string("MIDI note number (0-127). Middle C = 60"),
                            "minimum": .int(0),
                            "maximum": .int(127)
                        ]),
                        "velocity": .object([
                            "type": .string("integer"),
                            "description": .string("Note velocity (0-127)"),
                            "minimum": .int(0),
                            "maximum": .int(127)
                        ]),
                        "duration_ms": .object([
                            "type": .string("integer"),
                            "description": .string("Note duration in milliseconds. Default: 500")
                        ])
                    ]),
                    "required": .array([.string("channel"), .string("note"), .string("velocity")])
                ])
            ),
            Tool(
                name: "midi_send_cc",
                description: "Send a MIDI Control Change message",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "channel": .object([
                            "type": .string("integer"),
                            "description": .string("MIDI channel (1-16)")
                        ]),
                        "controller": .object([
                            "type": .string("integer"),
                            "description": .string("Controller number (0-127). Common: 1=Mod Wheel, 7=Volume, 10=Pan, 64=Sustain")
                        ]),
                        "value": .object([
                            "type": .string("integer"),
                            "description": .string("Controller value (0-127)")
                        ])
                    ]),
                    "required": .array([.string("channel"), .string("controller"), .string("value")])
                ])
            ),
            Tool(
                name: "midi_send_chord",
                description: "Send multiple notes simultaneously as a chord",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "channel": .object([
                            "type": .string("integer"),
                            "description": .string("MIDI channel (1-16)")
                        ]),
                        "notes": .object([
                            "type": .string("array"),
                            "items": .object(["type": .string("integer")]),
                            "description": .string("Array of MIDI note numbers. Example: [60, 64, 67] for C major chord")
                        ]),
                        "velocity": .object([
                            "type": .string("integer"),
                            "description": .string("Note velocity (0-127)")
                        ]),
                        "duration_ms": .object([
                            "type": .string("integer"),
                            "description": .string("Chord duration in milliseconds. If omitted, notes stay on until note off.")
                        ])
                    ]),
                    "required": .array([.string("channel"), .string("notes"), .string("velocity")])
                ])
            ),
            Tool(
                name: "midi_send_program_change",
                description: "Send a MIDI Program Change message to change instrument/patch",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "channel": .object([
                            "type": .string("integer"),
                            "description": .string("MIDI channel (1-16)")
                        ]),
                        "program": .object([
                            "type": .string("integer"),
                            "description": .string("Program number (0-127)")
                        ])
                    ]),
                    "required": .array([.string("channel"), .string("program")])
                ])
            ),
            Tool(
                name: "midi_send_pitch_bend",
                description: "Send a MIDI Pitch Bend message",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "channel": .object([
                            "type": .string("integer"),
                            "description": .string("MIDI channel (1-16)")
                        ]),
                        "value": .object([
                            "type": .string("integer"),
                            "description": .string("Pitch bend value (0-16383). Center/no bend = 8192")
                        ])
                    ]),
                    "required": .array([.string("channel"), .string("value")])
                ])
            ),
        ])

        // === MMC (MIDI Machine Control) Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "midi_mmc_play",
                description: "Send MMC Play command (requires MMC to be enabled in Logic's sync settings)",
                inputSchema: .object([:])
            ),
            Tool(
                name: "midi_mmc_stop",
                description: "Send MMC Stop command",
                inputSchema: .object([:])
            ),
            Tool(
                name: "midi_mmc_record",
                description: "Send MMC Record command (punch in)",
                inputSchema: .object([:])
            ),
            Tool(
                name: "midi_mmc_rewind",
                description: "Send MMC Rewind command",
                inputSchema: .object([:])
            ),
            Tool(
                name: "midi_mmc_fast_forward",
                description: "Send MMC Fast Forward command",
                inputSchema: .object([:])
            ),
            Tool(
                name: "midi_mmc_pause",
                description: "Send MMC Pause command",
                inputSchema: .object([:])
            ),
        ])

        // === Scripter Template Tools ===
        allTools.append(contentsOf: [
            Tool(
                name: "scripter_list_templates",
                description: "List all available Logic Pro Scripter JavaScript templates",
                inputSchema: .object([:])
            ),
            Tool(
                name: "scripter_get_template",
                description: "Get the JavaScript code for a specific Scripter template",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "name": .object([
                            "type": .string("string"),
                            "description": .string("Name of the template to retrieve")
                        ])
                    ]),
                    "required": .array([.string("name")])
                ])
            ),
            Tool(
                name: "scripter_create_template",
                description: "Save a new Scripter JavaScript template",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "name": .object([
                            "type": .string("string"),
                            "description": .string("Name for the template (alphanumeric and underscores only)")
                        ]),
                        "code": .object([
                            "type": .string("string"),
                            "description": .string("JavaScript code for the Scripter plugin")
                        ]),
                        "description": .object([
                            "type": .string("string"),
                            "description": .string("Description of what the template does")
                        ])
                    ]),
                    "required": .array([.string("name"), .string("code")])
                ])
            ),
            Tool(
                name: "scripter_delete_template",
                description: "Delete a user-created Scripter template (cannot delete built-in templates)",
                inputSchema: .object([
                    "type": .string("object"),
                    "properties": .object([
                        "name": .object([
                            "type": .string("string"),
                            "description": .string("Name of the template to delete")
                        ])
                    ]),
                    "required": .array([.string("name")])
                ])
            ),
        ])

        return allTools
    }

    // MARK: - Handler Registration

    private func registerHandlers() async {
        // Register ListTools handler
        await server.withMethodHandler(ListTools.self) { [tools] _ in
            ListTools.Result(tools: tools)
        }

        // Register CallTool handler
        await server.withMethodHandler(CallTool.self) { [weak self] params in
            guard let self = self else {
                return CallTool.Result(content: [.text("Server unavailable")], isError: true)
            }
            return await self.handleToolCall(name: params.name, arguments: params.arguments ?? [:])
        }
    }

    // MARK: - Tool Call Handler

    private func handleToolCall(name: String, arguments: [String: Value]) async -> CallTool.Result {
        do {
            let result: String

            switch name {
            // === App Control ===
            case "logic_is_running":
                let running = await controller.isRunning()
                result = running ? "Logic Pro is running" : "Logic Pro is not running"

            case "logic_launch":
                result = try await controller.launch()

            case "logic_activate":
                result = try await controller.activate()

            case "logic_quit":
                result = try await controller.quit()

            // === Transport Control ===
            case "logic_play":
                result = try await controller.play()

            case "logic_stop":
                result = try await controller.stop()

            case "logic_record":
                result = try await controller.record()

            case "logic_rewind":
                result = try await controller.goToBeginning()

            case "logic_forward":
                result = try await controller.forward()

            case "logic_backward":
                result = try await controller.backward()

            case "logic_toggle_cycle":
                result = try await controller.toggleCycle()

            case "logic_toggle_metronome":
                result = try await controller.toggleMetronome()

            // === Track Management ===
            case "logic_create_track":
                let trackType = arguments["type"]?.stringValue ?? "midi"
                result = try await controller.createTrack(type: trackType)

            case "logic_solo_track":
                result = try await controller.soloTrack()

            case "logic_mute_track":
                result = try await controller.muteTrack()

            case "logic_arm_track":
                result = try await controller.armTrack()

            case "logic_delete_track":
                result = try await controller.deleteTrack()

            // === View/Window Control ===
            case "logic_toggle_mixer":
                result = try await controller.toggleMixer()

            case "logic_toggle_piano_roll":
                result = try await controller.togglePianoRoll()

            case "logic_toggle_automation":
                result = try await controller.toggleAutomation()

            case "logic_toggle_editors":
                result = try await controller.toggleEditors()

            case "logic_toggle_library":
                result = try await controller.toggleLibrary()

            case "logic_toggle_inspector":
                result = try await controller.toggleInspector()

            case "logic_toggle_score":
                result = try await controller.toggleScore()

            case "logic_zoom_in":
                result = try await controller.zoomIn()

            case "logic_zoom_out":
                result = try await controller.zoomOut()

            case "logic_zoom_fit":
                result = try await controller.zoomFit()

            // === Editing Commands ===
            case "logic_undo":
                result = try await controller.undo()

            case "logic_redo":
                result = try await controller.redo()

            case "logic_cut":
                result = try await controller.cut()

            case "logic_copy":
                result = try await controller.copy()

            case "logic_paste":
                result = try await controller.paste()

            case "logic_duplicate":
                result = try await controller.duplicate()

            case "logic_split":
                result = try await controller.split()

            case "logic_join":
                result = try await controller.join()

            case "logic_quantize":
                result = try await controller.quantize()

            case "logic_select_all":
                result = try await controller.selectAll()

            case "logic_delete_selected":
                result = try await controller.deleteSelected()

            // === Project Commands ===
            case "logic_new_project":
                result = try await controller.newProject()

            case "logic_open_project":
                result = try await controller.openProject()

            case "logic_save_project":
                result = try await controller.saveProject()

            case "logic_save_as":
                result = try await controller.saveAs()

            case "logic_bounce":
                result = try await controller.bounce()

            // === Generic Shortcut ===
            case "logic_shortcut":
                guard let key = arguments["key"]?.stringValue else {
                    return CallTool.Result(content: [.text("Missing required parameter 'key'")], isError: true)
                }
                let modifiers = arguments["modifiers"]?.arrayValue?.compactMap { $0.stringValue } ?? []
                result = try await controller.executeShortcut(key: key, modifiers: modifiers)

            // === Utility ===
            case "logic_screenshot":
                let savePath = arguments["save_path"]?.stringValue
                result = try await controller.screenshot(savePath: savePath)

            case "logic_window_info":
                result = try await controller.getWindowInfo()

            // === MIDI Tools ===
            case "midi_create_virtual_port":
                let portName = arguments["name"]?.stringValue ?? "Logic Pro MCP"
                result = try await midiManager.setup(name: portName)

            case "midi_list_ports":
                let ports = await midiManager.listPorts()
                let formatted = ports.map { port -> String in
                    let type = port["type"] as? String ?? "unknown"
                    let name = port["name"] as? String ?? "unnamed"
                    return "[\(type)] \(name)"
                }.joined(separator: "\n")
                result = "MIDI Ports:\n\(formatted)"

            case "midi_send_note":
                guard let channel = arguments["channel"]?.intValue,
                      let note = arguments["note"]?.intValue,
                      let velocity = arguments["velocity"]?.intValue else {
                    return CallTool.Result(content: [.text("Missing required parameters: channel, note, velocity")], isError: true)
                }
                let duration = arguments["duration_ms"]?.intValue ?? 500
                result = try await midiManager.sendNote(channel: channel, note: note, velocity: velocity, durationMs: duration)

            case "midi_send_cc":
                guard let channel = arguments["channel"]?.intValue,
                      let controller = arguments["controller"]?.intValue,
                      let value = arguments["value"]?.intValue else {
                    return CallTool.Result(content: [.text("Missing required parameters: channel, controller, value")], isError: true)
                }
                result = try await midiManager.sendControlChange(channel: channel, controller: controller, value: value)

            case "midi_send_chord":
                guard let channel = arguments["channel"]?.intValue,
                      let notesArray = arguments["notes"]?.arrayValue,
                      let velocity = arguments["velocity"]?.intValue else {
                    return CallTool.Result(content: [.text("Missing required parameters: channel, notes, velocity")], isError: true)
                }
                let notes = notesArray.compactMap { $0.intValue }
                let duration = arguments["duration_ms"]?.intValue
                result = try await midiManager.sendChord(channel: channel, notes: notes, velocity: velocity, durationMs: duration)

            case "midi_send_program_change":
                guard let channel = arguments["channel"]?.intValue,
                      let program = arguments["program"]?.intValue else {
                    return CallTool.Result(content: [.text("Missing required parameters: channel, program")], isError: true)
                }
                result = try await midiManager.sendProgramChange(channel: channel, program: program)

            case "midi_send_pitch_bend":
                guard let channel = arguments["channel"]?.intValue,
                      let value = arguments["value"]?.intValue else {
                    return CallTool.Result(content: [.text("Missing required parameters: channel, value")], isError: true)
                }
                result = try await midiManager.sendPitchBend(channel: channel, value: value)

            // === MMC Commands ===
            case "midi_mmc_play":
                result = try await midiManager.sendMMCCommand(.play)

            case "midi_mmc_stop":
                result = try await midiManager.sendMMCCommand(.stop)

            case "midi_mmc_record":
                result = try await midiManager.sendMMCCommand(.recordStrobe)

            case "midi_mmc_rewind":
                result = try await midiManager.sendMMCCommand(.rewind)

            case "midi_mmc_fast_forward":
                result = try await midiManager.sendMMCCommand(.fastForward)

            case "midi_mmc_pause":
                result = try await midiManager.sendMMCCommand(.pause)

            // === Scripter Templates ===
            case "scripter_list_templates":
                let templates = await scripterManager.listTemplates()
                let formatted = templates.map { t -> String in
                    let builtIn = t.isBuiltIn ? " [built-in]" : ""
                    return "• \(t.name)\(builtIn): \(t.description)"
                }.joined(separator: "\n")
                result = "Available Scripter Templates:\n\(formatted)"

            case "scripter_get_template":
                guard let name = arguments["name"]?.stringValue else {
                    return CallTool.Result(content: [.text("Missing required parameter 'name'")], isError: true)
                }
                guard let template = await scripterManager.getTemplate(name: name) else {
                    return CallTool.Result(content: [.text("Template '\(name)' not found")], isError: true)
                }
                result = """
                Template: \(template.name)
                Description: \(template.description)

                --- JavaScript Code ---
                \(template.code)
                """

            case "scripter_create_template":
                guard let name = arguments["name"]?.stringValue,
                      let code = arguments["code"]?.stringValue else {
                    return CallTool.Result(content: [.text("Missing required parameters: name, code")], isError: true)
                }
                let description = arguments["description"]?.stringValue
                result = try await scripterManager.saveTemplate(name: name, code: code, description: description)

            case "scripter_delete_template":
                guard let name = arguments["name"]?.stringValue else {
                    return CallTool.Result(content: [.text("Missing required parameter 'name'")], isError: true)
                }
                result = try await scripterManager.deleteTemplate(name: name)

            default:
                return CallTool.Result(content: [.text("Unknown tool: \(name)")], isError: true)
            }

            return CallTool.Result(content: [.text(result)])

        } catch {
            return CallTool.Result(content: [.text("Error: \(error.localizedDescription)")], isError: true)
        }
    }

    // MARK: - Run Server

    func run() async throws {
        try await server.start(transport: transport)
        await server.waitUntilCompleted()
    }
}

// MARK: - Value Extensions

extension Value {
    var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }

    var intValue: Int? {
        if case .int(let i) = self { return i }
        if case .double(let d) = self { return Int(d) }
        if case .string(let s) = self { return Int(s) }
        return nil
    }

    var doubleValue: Double? {
        if case .double(let d) = self { return d }
        if case .int(let i) = self { return Double(i) }
        if case .string(let s) = self { return Double(s) }
        return nil
    }

    var boolValue: Bool? {
        if case .bool(let b) = self { return b }
        return nil
    }

    var arrayValue: [Value]? {
        if case .array(let a) = self { return a }
        return nil
    }
}
