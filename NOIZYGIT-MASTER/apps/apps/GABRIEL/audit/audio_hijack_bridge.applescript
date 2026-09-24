-- =============================================================================
-- NOIZY EMPIRE — Audio Hijack AppleScript Bridge
-- GABRIEL Voice Army Signal Chain
-- iPhone → Audio Hijack → GOD → GABRIEL provenance log
-- Usage: osascript audio_hijack_bridge.applescript [start|stop|status] [session_name]
-- =============================================================================

on run argv
    set cmd to "status"
    set sessionName to "RSP_001"

    if (count of argv) >= 1 then set cmd to item 1 of argv
    if (count of argv) >= 2 then set sessionName to item 2 of argv

    if cmd is "start" then
        startSession(sessionName)
    else if cmd is "stop" then
        stopSession(sessionName)
    else if cmd is "status" then
        getStatus(sessionName)
    else if cmd is "list" then
        listSessions()
    end if
end run

-- Start a named recording session
on startSession(sName)
    tell application "Audio Hijack"
        set allSessions to every session
        repeat with s in allSessions
            if name of s is sName then
                start s
                log "STARTED: " & sName
                return "started"
            end if
        end repeat
        log "SESSION NOT FOUND: " & sName
        return "not_found"
    end tell
end startSession

-- Stop a named recording session
on stopSession(sName)
    tell application "Audio Hijack"
        set allSessions to every session
        repeat with s in allSessions
            if name of s is sName then
                stop s
                log "STOPPED: " & sName
                return "stopped"
            end if
        end repeat
        return "not_found"
    end tell
end stopSession

-- Get status of a session
on getStatus(sName)
    tell application "Audio Hijack"
        set allSessions to every session
        repeat with s in allSessions
            if name of s is sName then
                set isRunning to running of s
                if isRunning then
                    return sName & ": RECORDING"
                else
                    return sName & ": IDLE"
                end if
            end if
        end repeat
        return sName & ": NOT FOUND"
    end tell
end getStatus

-- List all sessions
on listSessions()
    tell application "Audio Hijack"
        set allSessions to every session
        set result to ""
        repeat with s in allSessions
            set isRunning to running of s
            set indicator to "[ ] "
            if isRunning then set indicator to "[R] "
            set result to result & indicator & (name of s) & linefeed
        end repeat
        return result
    end tell
end listSessions
