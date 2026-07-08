// ============================================================================
// MC96ECO — iPad-to-GOD Audio Router
// Audio Hijack 4 Session Automation Script
// ============================================================================
// PURPOSE: Controls the "iPad → GOD" Audio Hijack session
//          Routes iPad audio input to M2 Ultra (GOD @ 10.90.90.10)
//
// USAGE:   Import into Audio Hijack → Session → Automations
//          Or trigger via Shortcuts / AppleScript / CLI
//
// AUTHOR:  MC96ECO AI OS for Robert Stephen Plowman
// DATE:    March 23, 2026
// ============================================================================

const SESSION_NAME = "iPad → GOD";

// --- Session Control Functions ---

/**
 * Start the iPad audio routing session
 * Call this when you want audio flowing from iPad to GOD
 */
function startRouting() {
    let session = app.sessionWithName(SESSION_NAME);

    if (!session) {
        console.log("ERROR: Session '" + SESSION_NAME + "' not found.");
        console.log("Create the session in Audio Hijack first (see setup guide).");
        return false;
    }

    if (session.running) {
        console.log("Session already running. iPad audio is flowing to GOD.");
        return true;
    }

    // Enable all blocks before starting
    let blocks = session.blocks;
    for (let i = 0; i < blocks.length; i++) {
        blocks[i].disabled = false;
    }

    session.start();
    console.log("=== iPad → GOD: Audio routing ACTIVE ===");
    console.log("Session: " + session.name);
    console.log("Status: LIVE");
    return true;
}

/**
 * Stop the iPad audio routing session
 */
function stopRouting() {
    let session = app.sessionWithName(SESSION_NAME);

    if (!session) {
        console.log("ERROR: Session '" + SESSION_NAME + "' not found.");
        return false;
    }

    if (!session.running) {
        console.log("Session is not running.");
        return true;
    }

    session.stop();
    console.log("=== iPad → GOD: Audio routing STOPPED ===");
    return true;
}

/**
 * Toggle the routing on/off
 */
function toggleRouting() {
    let session = app.sessionWithName(SESSION_NAME);

    if (!session) {
        console.log("ERROR: Session '" + SESSION_NAME + "' not found.");
        return false;
    }

    if (session.running) {
        session.stop();
        console.log("=== iPad → GOD: STOPPED ===");
    } else {
        session.start();
        console.log("=== iPad → GOD: STARTED ===");
    }
    return true;
}

/**
 * Get current session status
 */
function getStatus() {
    let session = app.sessionWithName(SESSION_NAME);

    if (!session) {
        return { active: false, error: "Session not found" };
    }

    let status = {
        active: session.running,
        name: session.name,
        runTime: session.runTime,
        blocks: []
    };

    let blocks = session.blocks;
    for (let i = 0; i < blocks.length; i++) {
        status.blocks.push({
            name: blocks[i].name,
            type: blocks[i].type,
            disabled: blocks[i].disabled
        });
    }

    console.log("Session: " + status.name);
    console.log("Active: " + status.active);
    console.log("Run Time: " + status.runTime + "s");
    console.log("Blocks: " + status.blocks.length);

    return status;
}

/**
 * Mute/unmute the output (keeps session running but silences output)
 */
function toggleMute() {
    let session = app.sessionWithName(SESSION_NAME);
    if (!session) return false;

    let blocks = session.blocks;
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].type === "OutputDevice") {
            blocks[i].disabled = !blocks[i].disabled;
            console.log("Output " + (blocks[i].disabled ? "MUTED" : "UNMUTED"));
        }
    }
    return true;
}

/**
 * Toggle recording on/off (capture the stream)
 */
function toggleRecording() {
    let session = app.sessionWithName(SESSION_NAME);
    if (!session) return false;

    let blocks = session.blocks;
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i].type === "Recorder") {
            blocks[i].disabled = !blocks[i].disabled;
            console.log("Recording " + (blocks[i].disabled ? "OFF" : "ON"));
        }
    }
    return true;
}

// --- Event Handlers (for Audio Hijack Automations) ---

/**
 * Session start event handler
 * Attach to: Session Will Start automation
 */
function onSessionStart() {
    console.log("=== MC96ECO AUDIO BRIDGE ===");
    console.log("iPad → GOD routing initialized");
    console.log("Target: M2 Ultra @ 10.90.90.10");
    console.log("Time: " + new Date().toLocaleString());

    // Optional: run a shell command to notify
    // app.runShellCommand('/usr/bin/osascript -e \'display notification "iPad audio now routing to GOD" with title "MC96ECO Audio Bridge"\'');
}

/**
 * Session stop event handler
 * Attach to: Session Did Stop automation
 */
function onSessionStop() {
    console.log("=== MC96ECO AUDIO BRIDGE DISCONNECTED ===");
    console.log("Time: " + new Date().toLocaleString());
}

// --- Default execution (when run directly) ---
toggleRouting();
