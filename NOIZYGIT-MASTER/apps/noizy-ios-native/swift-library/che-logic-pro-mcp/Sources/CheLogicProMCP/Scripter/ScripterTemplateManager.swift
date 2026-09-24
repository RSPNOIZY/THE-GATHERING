import Foundation

/// Scripter template data structure
struct ScripterTemplate: Codable {
    let name: String
    let description: String
    let code: String
    let isBuiltIn: Bool

    init(name: String, description: String, code: String, isBuiltIn: Bool = false) {
        self.name = name
        self.description = description
        self.code = code
        self.isBuiltIn = isBuiltIn
    }
}

/// Actor that manages Logic Pro Scripter JavaScript templates
/// Provides built-in templates and allows users to save custom ones
actor ScripterTemplateManager {
    private var templates: [String: ScripterTemplate] = [:]
    private let templatesDirectory: URL
    private var isInitialized = false

    static let shared = ScripterTemplateManager()

    private init() {
        // Store templates in Application Support
        let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        templatesDirectory = appSupport.appendingPathComponent("CheLogicProMCP/ScripterTemplates")

        // Create directory if needed
        try? FileManager.default.createDirectory(at: templatesDirectory, withIntermediateDirectories: true)

        // Templates will be loaded on first access
    }

    /// Ensure templates are loaded (call from public methods)
    private func ensureInitialized() {
        guard !isInitialized else { return }
        loadBuiltInTemplates()
        loadUserTemplates()
        isInitialized = true
    }

    // MARK: - Built-in Templates

    private func loadBuiltInTemplates() {
        // Arpeggiator
        templates["arpeggiator"] = ScripterTemplate(
            name: "arpeggiator",
            description: "Basic arpeggiator that plays held notes in sequence at configurable rate",
            code: """
            /*
             * Arpeggiator - Logic Pro Scripter Template
             * Plays held notes in ascending sequence
             *
             * Usage: Insert as MIDI FX on a Software Instrument track
             * Hold down multiple notes to hear the arpeggio
             */

            var NeedsTimingInfo = true;
            var noteBuffer = [];
            var currentIndex = 0;
            var lastBeat = -1;

            // Arpeggio rate in beats (1/16 = sixteenth notes)
            var rate = 1/16;

            function HandleMIDI(event) {
                if (event instanceof NoteOn) {
                    // Add note to buffer, sorted by pitch
                    noteBuffer.push(event);
                    noteBuffer.sort(function(a, b) { return a.pitch - b.pitch; });
                } else if (event instanceof NoteOff) {
                    // Remove note from buffer
                    noteBuffer = noteBuffer.filter(function(n) {
                        return n.pitch !== event.pitch;
                    });
                    if (noteBuffer.length === 0) {
                        currentIndex = 0;
                    }
                } else {
                    event.send();
                }
            }

            function ProcessMIDI() {
                var info = GetTimingInfo();
                if (!info.playing || noteBuffer.length === 0) return;

                var currentBeat = Math.floor(info.blockStartBeat / rate);
                if (currentBeat !== lastBeat) {
                    lastBeat = currentBeat;

                    // Get current note from buffer
                    var sourceNote = noteBuffer[currentIndex % noteBuffer.length];

                    // Create and send Note On
                    var noteOn = new NoteOn();
                    noteOn.pitch = sourceNote.pitch;
                    noteOn.velocity = sourceNote.velocity;
                    noteOn.send();

                    // Schedule Note Off
                    var noteOff = new NoteOff();
                    noteOff.pitch = sourceNote.pitch;
                    noteOff.sendAfterBeats(rate * 0.9);

                    currentIndex++;
                }
            }

            function Reset() {
                noteBuffer = [];
                currentIndex = 0;
                lastBeat = -1;
            }
            """,
            isBuiltIn: true
        )

        // Chord Generator
        templates["chord_generator"] = ScripterTemplate(
            name: "chord_generator",
            description: "Generates chords from single notes - play one note, hear a full chord",
            code: """
            /*
             * Chord Generator - Logic Pro Scripter Template
             * Transforms single notes into chords
             *
             * Usage: Insert as MIDI FX, play single notes
             * Adjust chordType variable to change chord quality
             */

            // Available chord types and their intervals from root
            var chordTypes = {
                major: [0, 4, 7],
                minor: [0, 3, 7],
                diminished: [0, 3, 6],
                augmented: [0, 4, 8],
                major7: [0, 4, 7, 11],
                minor7: [0, 3, 7, 10],
                dominant7: [0, 4, 7, 10],
                sus2: [0, 2, 7],
                sus4: [0, 5, 7],
                add9: [0, 4, 7, 14],
                power: [0, 7, 12]
            };

            // Current chord type - change this to switch chords
            var currentChordType = "major";

            function HandleMIDI(event) {
                if (event instanceof NoteOn) {
                    var intervals = chordTypes[currentChordType] || chordTypes.major;
                    for (var i = 0; i < intervals.length; i++) {
                        var newPitch = event.pitch + intervals[i];
                        if (newPitch <= 127) {
                            var note = new NoteOn();
                            note.pitch = newPitch;
                            note.velocity = event.velocity;
                            note.send();
                        }
                    }
                } else if (event instanceof NoteOff) {
                    var intervals = chordTypes[currentChordType] || chordTypes.major;
                    for (var i = 0; i < intervals.length; i++) {
                        var newPitch = event.pitch + intervals[i];
                        if (newPitch <= 127) {
                            var note = new NoteOff();
                            note.pitch = newPitch;
                            note.send();
                        }
                    }
                } else {
                    event.send();
                }
            }
            """,
            isBuiltIn: true
        )

        // MIDI Filter
        templates["midi_filter"] = ScripterTemplate(
            name: "midi_filter",
            description: "Filters MIDI events by type, range, and velocity",
            code: """
            /*
             * MIDI Filter - Logic Pro Scripter Template
             * Filters out unwanted MIDI events
             *
             * Usage: Insert as MIDI FX to filter specific ranges
             * Adjust parameters below to configure filtering
             */

            // Filter settings
            var filterNotes = false;        // Set true to block all notes
            var filterCC = false;           // Set true to block all CC
            var filterPitchBend = false;    // Set true to block pitch bend
            var filterAftertouch = false;   // Set true to block aftertouch

            // Note range filter (only applies when filterNotes is false)
            var minNote = 0;    // Minimum note to pass (0-127)
            var maxNote = 127;  // Maximum note to pass (0-127)

            // Velocity filter
            var minVelocity = 1;    // Minimum velocity to pass (0-127)
            var maxVelocity = 127;  // Maximum velocity to pass (0-127)

            // Specific CC to filter (empty array = allow all)
            var filteredCCs = [];  // e.g., [1, 64] to block Mod Wheel and Sustain

            function HandleMIDI(event) {
                // Filter notes
                if (event instanceof Note) {
                    if (filterNotes) return;
                    if (event.pitch < minNote || event.pitch > maxNote) return;

                    if (event instanceof NoteOn) {
                        if (event.velocity < minVelocity || event.velocity > maxVelocity) return;
                    }
                }

                // Filter Control Change
                if (event instanceof ControlChange) {
                    if (filterCC) return;
                    if (filteredCCs.indexOf(event.number) !== -1) return;
                }

                // Filter Pitch Bend
                if (event instanceof PitchBend) {
                    if (filterPitchBend) return;
                }

                // Filter Aftertouch
                if (event instanceof PolyPressure || event instanceof ChannelPressure) {
                    if (filterAftertouch) return;
                }

                // Pass through everything else
                event.send();
            }
            """,
            isBuiltIn: true
        )

        // Velocity Processor
        templates["velocity_processor"] = ScripterTemplate(
            name: "velocity_processor",
            description: "Adjusts note velocities with scaling, offset, and randomization",
            code: """
            /*
             * Velocity Processor - Logic Pro Scripter Template
             * Modifies note velocities in various ways
             *
             * Usage: Insert as MIDI FX to adjust dynamics
             */

            // Velocity scaling (1.0 = no change, 0.5 = half, 2.0 = double)
            var velocityScale = 1.0;

            // Velocity offset (added after scaling)
            var velocityOffset = 0;

            // Randomization amount (0 = none, 20 = +/- 20)
            var randomAmount = 0;

            // Compression settings
            var compressAbove = 127;  // Compress velocities above this
            var compressRatio = 1.0;  // Compression ratio (1.0 = no compression)

            // Fixed velocity mode (set > 0 to use fixed velocity)
            var fixedVelocity = 0;

            function HandleMIDI(event) {
                if (event instanceof NoteOn) {
                    var vel = event.velocity;

                    // Fixed velocity mode
                    if (fixedVelocity > 0) {
                        vel = fixedVelocity;
                    } else {
                        // Apply scaling
                        vel = Math.round(vel * velocityScale);

                        // Apply offset
                        vel += velocityOffset;

                        // Apply compression
                        if (vel > compressAbove) {
                            var excess = vel - compressAbove;
                            vel = compressAbove + Math.round(excess / compressRatio);
                        }

                        // Apply randomization
                        if (randomAmount > 0) {
                            vel += Math.round((Math.random() - 0.5) * 2 * randomAmount);
                        }
                    }

                    // Clamp to valid range
                    event.velocity = Math.max(1, Math.min(127, vel));
                }
                event.send();
            }
            """,
            isBuiltIn: true
        )

        // Note Delay
        templates["note_delay"] = ScripterTemplate(
            name: "note_delay",
            description: "Delays notes by a specified amount in beats or milliseconds",
            code: """
            /*
             * Note Delay - Logic Pro Scripter Template
             * Delays notes by configurable amount
             *
             * Usage: Insert as MIDI FX to add timing delay
             */

            var NeedsTimingInfo = true;

            // Delay amount in beats (1/16 = one sixteenth note)
            var delayBeats = 1/16;

            // Feedback amount (0-1, how much of original velocity for echoes)
            var feedback = 0;

            // Number of echoes (0 = just delay, no echoes)
            var echoes = 0;

            function HandleMIDI(event) {
                if (event instanceof NoteOn) {
                    // Send delayed original note
                    var delayedOn = new NoteOn(event);
                    delayedOn.sendAfterBeats(delayBeats);

                    // Send echoes if enabled
                    if (echoes > 0 && feedback > 0) {
                        var currentVel = event.velocity;
                        for (var i = 1; i <= echoes; i++) {
                            currentVel = Math.round(currentVel * feedback);
                            if (currentVel < 1) break;

                            var echo = new NoteOn(event);
                            echo.velocity = currentVel;
                            echo.sendAfterBeats(delayBeats * (i + 1));
                        }
                    }
                } else if (event instanceof NoteOff) {
                    // Delay note off to match
                    var delayedOff = new NoteOff(event);
                    delayedOff.sendAfterBeats(delayBeats);

                    // Echoes for note off
                    if (echoes > 0 && feedback > 0) {
                        for (var i = 1; i <= echoes; i++) {
                            var echoOff = new NoteOff(event);
                            echoOff.sendAfterBeats(delayBeats * (i + 1));
                        }
                    }
                } else {
                    event.send();
                }
            }
            """,
            isBuiltIn: true
        )

        // Transpose
        templates["transpose"] = ScripterTemplate(
            name: "transpose",
            description: "Transposes notes by semitones with octave limiting",
            code: """
            /*
             * Transpose - Logic Pro Scripter Template
             * Shifts notes up or down by semitones
             *
             * Usage: Insert as MIDI FX to transpose in real-time
             */

            // Transpose amount in semitones (+12 = up one octave)
            var semitones = 0;

            // Limit notes to this range after transposition
            var minNote = 0;
            var maxNote = 127;

            // Wrap mode: true = wrap to valid range, false = clamp
            var wrapMode = false;

            function HandleMIDI(event) {
                if (event instanceof Note) {
                    var newPitch = event.pitch + semitones;

                    if (wrapMode) {
                        // Wrap to valid range
                        while (newPitch < minNote) newPitch += 12;
                        while (newPitch > maxNote) newPitch -= 12;
                    } else {
                        // Clamp to range
                        if (newPitch < minNote || newPitch > maxNote) {
                            // Note outside range, don't send
                            return;
                        }
                    }

                    event.pitch = newPitch;
                }
                event.send();
            }
            """,
            isBuiltIn: true
        )
    }

    // MARK: - User Templates

    private func loadUserTemplates() {
        guard let files = try? FileManager.default.contentsOfDirectory(at: templatesDirectory, includingPropertiesForKeys: nil) else {
            return
        }

        for file in files where file.pathExtension == "json" {
            guard let data = try? Data(contentsOf: file),
                  let template = try? JSONDecoder().decode(ScripterTemplate.self, from: data) else {
                continue
            }
            templates[template.name] = template
        }
    }

    // MARK: - Public API

    /// List all available templates
    func listTemplates() -> [ScripterTemplate] {
        ensureInitialized()
        return Array(templates.values).sorted { $0.name < $1.name }
    }

    /// Get a specific template by name
    func getTemplate(name: String) -> ScripterTemplate? {
        ensureInitialized()
        return templates[name]
    }

    /// Save a new user template
    func saveTemplate(name: String, code: String, description: String?) throws -> String {
        ensureInitialized()

        // Validate name
        let validNamePattern = "^[a-zA-Z][a-zA-Z0-9_]*$"
        guard name.range(of: validNamePattern, options: .regularExpression) != nil else {
            throw ScripterError.invalidTemplateName(name)
        }

        // Check if trying to overwrite built-in
        if let existing = templates[name], existing.isBuiltIn {
            throw ScripterError.cannotDeleteBuiltIn
        }

        let template = ScripterTemplate(
            name: name,
            description: description ?? "User template",
            code: code,
            isBuiltIn: false
        )

        templates[name] = template

        // Save to file
        let fileURL = templatesDirectory.appendingPathComponent("\(name).json")
        do {
            let data = try JSONEncoder().encode(template)
            try data.write(to: fileURL)
        } catch {
            throw ScripterError.saveFailed(error.localizedDescription)
        }

        return "Template '\(name)' saved successfully"
    }

    /// Delete a user template
    func deleteTemplate(name: String) throws -> String {
        ensureInitialized()

        guard let template = templates[name] else {
            throw ScripterError.templateNotFound(name)
        }

        if template.isBuiltIn {
            throw ScripterError.cannotDeleteBuiltIn
        }

        templates.removeValue(forKey: name)

        let fileURL = templatesDirectory.appendingPathComponent("\(name).json")
        try? FileManager.default.removeItem(at: fileURL)

        return "Template '\(name)' deleted"
    }
}
