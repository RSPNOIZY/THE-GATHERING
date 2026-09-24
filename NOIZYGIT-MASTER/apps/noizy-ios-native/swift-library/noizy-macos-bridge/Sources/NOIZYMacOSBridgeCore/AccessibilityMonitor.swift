import AppKit
import Foundation
@preconcurrency import ApplicationServices

private let axObserverCallback: AXObserverCallback = { _, element, notification, refcon in
    guard let refcon else { return }
    let monitor = Unmanaged<AccessibilityMonitor>.fromOpaque(refcon).takeUnretainedValue()
    monitor.handleAXNotification(element: element, notification: notification as String)
}

public final class AccessibilityMonitor: @unchecked Sendable {
    private let config: BridgeConfig
    private let hub: EventHub
    private let sequencer: EventSequencer
    private let scriptingProbe: ScriptingBridgeProbe
    private var observers: [pid_t: AXObserver] = [:]
    private var notificationTokens: [any NSObjectProtocol] = []
    private let queue = DispatchQueue(label: "ai.noizy.macos-bridge.accessibility", qos: .userInteractive)

    public init(
        config: BridgeConfig,
        hub: EventHub,
        sequencer: EventSequencer,
        scriptingProbe: ScriptingBridgeProbe
    ) {
        self.config = config
        self.hub = hub
        self.sequencer = sequencer
        self.scriptingProbe = scriptingProbe
    }

    deinit {
        for token in notificationTokens {
            NSWorkspace.shared.notificationCenter.removeObserver(token)
        }
        for observer in observers.values {
            CFRunLoopRemoveSource(
                CFRunLoopGetMain(),
                AXObserverGetRunLoopSource(observer),
                CFRunLoopMode.defaultMode
            )
        }
    }

    public func start() {
        let status = Permissions.snapshot(prompt: config.promptForAccessibilityPermission)
        Task {
            let event = BridgeEvent(
                sequence: await sequencer.next(),
                source: "permissions",
                name: "accessibility-status",
                payload: [
                    "trusted": .bool(status.accessibilityTrusted),
                    "prompted": .bool(status.accessibilityPrompted),
                    "note": .string(status.note)
                ]
            )
            try? await hub.record(event)
        }

        observeWorkspace()
        for app in NSWorkspace.shared.runningApplications where app.activationPolicy == .regular {
            installObserver(for: app)
        }
        if let frontmost = NSWorkspace.shared.frontmostApplication {
            publishWorkspaceEvent(name: "application-frontmost", application: frontmost)
            installObserver(for: frontmost)
            publishScriptingSnapshot()
        }
    }

    private func observeWorkspace() {
        let center = NSWorkspace.shared.notificationCenter
        notificationTokens.append(
            center.addObserver(
                forName: NSWorkspace.didActivateApplicationNotification,
                object: nil,
                queue: nil
            ) { [weak self] notification in
                guard let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication else {
                    return
                }
                self?.installObserver(for: app)
                self?.publishWorkspaceEvent(name: "application-activated", application: app)
                self?.publishScriptingSnapshot()
            }
        )
        notificationTokens.append(
            center.addObserver(
                forName: NSWorkspace.didLaunchApplicationNotification,
                object: nil,
                queue: nil
            ) { [weak self] notification in
                guard let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication else {
                    return
                }
                self?.installObserver(for: app)
                self?.publishWorkspaceEvent(name: "application-launched", application: app)
            }
        )
        notificationTokens.append(
            center.addObserver(
                forName: NSWorkspace.didTerminateApplicationNotification,
                object: nil,
                queue: nil
            ) { [weak self] notification in
                guard let app = notification.userInfo?[NSWorkspace.applicationUserInfoKey] as? NSRunningApplication else {
                    return
                }
                self?.publishWorkspaceEvent(name: "application-terminated", application: app)
                self?.observers[app.processIdentifier] = nil
            }
        )
    }

    private func installObserver(for application: NSRunningApplication) {
        let pid = application.processIdentifier
        if observers[pid] != nil {
            return
        }

        let element = AXUIElementCreateApplication(pid)
        var observer: AXObserver?
        let createError = AXObserverCreate(pid, axObserverCallback, &observer)
        guard createError == .success, let observer else {
            publishAXObserverStatus(application: application, status: createError)
            return
        }

        let refcon = Unmanaged.passUnretained(self).toOpaque()
        let notifications: [String] = [
            kAXFocusedWindowChangedNotification,
            kAXFocusedUIElementChangedNotification,
            kAXWindowCreatedNotification,
            kAXTitleChangedNotification,
            kAXValueChangedNotification,
            kAXSelectedTextChangedNotification,
            kAXMainWindowChangedNotification
        ]
        var registered: [String] = []
        var rejected: [String: String] = [:]
        for notification in notifications {
            let result = AXObserverAddNotification(observer, element, notification as CFString, refcon)
            let name = notification
            if result == .success || result == .notificationAlreadyRegistered {
                registered.append(name)
            } else {
                rejected[name] = "\(result.rawValue)"
            }
        }

        CFRunLoopAddSource(
            CFRunLoopGetMain(),
            AXObserverGetRunLoopSource(observer),
            CFRunLoopMode.defaultMode
        )
        observers[pid] = observer

        publishAXObserverStatus(
            application: application,
            status: .success,
            registered: registered,
            rejected: rejected
        )
    }

    private func publishWorkspaceEvent(name: String, application: NSRunningApplication) {
        Task {
            let event = BridgeEvent(
                sequence: await sequencer.next(),
                source: "workspace",
                name: name,
                pid: application.processIdentifier,
                bundleIdentifier: application.bundleIdentifier,
                applicationName: application.localizedName,
                elementRole: "application",
                elementTitle: application.localizedName,
                payload: [
                    "activationPolicy": .string("\(application.activationPolicy.rawValue)"),
                    "isActive": .bool(application.isActive),
                    "isFinishedLaunching": .bool(application.isFinishedLaunching)
                ]
            )
            try? await hub.record(event)
        }
    }

    private func publishAXObserverStatus(
        application: NSRunningApplication,
        status: AXError,
        registered: [String] = [],
        rejected: [String: String] = [:]
    ) {
        Task {
            var payload: [String: JSONValue] = [
                "axError": .string("\(status.rawValue)"),
                "registeredNotifications": .array(registered.map(JSONValue.string)),
                "rejectedNotifications": .object(rejected.mapValues(JSONValue.string))
            ]
            payload["trusted"] = .bool(Permissions.accessibilityTrusted(prompt: false))
            let event = BridgeEvent(
                sequence: await sequencer.next(),
                source: "accessibility",
                name: "observer-status",
                pid: application.processIdentifier,
                bundleIdentifier: application.bundleIdentifier,
                applicationName: application.localizedName,
                elementRole: "application",
                elementTitle: application.localizedName,
                payload: payload
            )
            try? await hub.record(event)
        }
    }

    fileprivate func handleAXNotification(element: AXUIElement, notification: String) {
        let snapshot = elementSnapshot(element)
        Task {
            var payload = snapshot.payload
            payload["notification"] = .string(notification)
            let event = BridgeEvent(
                sequence: await sequencer.next(),
                source: "accessibility",
                name: notificationName(notification),
                pid: snapshot.pid,
                bundleIdentifier: snapshot.bundleIdentifier,
                applicationName: snapshot.applicationName,
                elementRole: snapshot.role,
                elementTitle: snapshot.title,
                payload: payload
            )
            try? await hub.record(event)
        }
    }

    private func publishScriptingSnapshot() {
        queue.async { [scriptingProbe, hub] in
            Task {
                let event = await scriptingProbe.frontmostSnapshotEvent()
                try? await hub.record(event)
            }
        }
    }

    private func elementSnapshot(_ element: AXUIElement) -> AXElementSnapshot {
        var pid: pid_t = 0
        AXUIElementGetPid(element, &pid)
        let application = pid > 0 ? NSRunningApplication(processIdentifier: pid) : nil

        let role = stringAttribute(element, kAXRoleAttribute)
        let subrole = stringAttribute(element, kAXSubroleAttribute)
        let title = stringAttribute(element, kAXTitleAttribute)
        let description = stringAttribute(element, kAXDescriptionAttribute)
        let identifier = stringAttribute(element, "AXIdentifier")
        let help = stringAttribute(element, kAXHelpAttribute)

        var payload: [String: JSONValue] = [
            "role": .optional(role),
            "subrole": .optional(subrole),
            "title": .optional(title),
            "description": .optional(description),
            "identifier": .optional(identifier),
            "help": .optional(help)
        ]

        if let frame = frameAttributes(element) {
            payload["frame"] = .object(frame)
        }

        if config.redactTextValues {
            payload["value"] = .string("[redacted]")
            payload["selectedText"] = .string("[redacted]")
        } else {
            payload["value"] = simpleAttribute(element, kAXValueAttribute)
            payload["selectedText"] = simpleAttribute(element, kAXSelectedTextAttribute)
        }

        return AXElementSnapshot(
            pid: pid == 0 ? nil : pid,
            bundleIdentifier: application?.bundleIdentifier,
            applicationName: application?.localizedName,
            role: role,
            title: title,
            payload: payload
        )
    }

    private func frameAttributes(_ element: AXUIElement) -> [String: JSONValue]? {
        var result: [String: JSONValue] = [:]
        if let rawValue = copyAttribute(element, kAXPositionAttribute),
           CFGetTypeID(rawValue) == AXValueGetTypeID() {
            let value = rawValue as! AXValue
            var point = CGPoint.zero
            if AXValueGetValue(value, .cgPoint, &point) {
                result["x"] = .double(point.x)
                result["y"] = .double(point.y)
            }
        }
        if let rawValue = copyAttribute(element, kAXSizeAttribute),
           CFGetTypeID(rawValue) == AXValueGetTypeID() {
            let value = rawValue as! AXValue
            var size = CGSize.zero
            if AXValueGetValue(value, .cgSize, &size) {
                result["width"] = .double(size.width)
                result["height"] = .double(size.height)
            }
        }
        return result.isEmpty ? nil : result
    }

    private func simpleAttribute(_ element: AXUIElement, _ attribute: String) -> JSONValue {
        guard let value = copyAttribute(element, attribute) else {
            return .null
        }
        if let value = value as? String {
            return .string(value)
        }
        if let value = value as? NSNumber {
            if CFGetTypeID(value) == CFBooleanGetTypeID() {
                return .bool(value.boolValue)
            }
            return .double(value.doubleValue)
        }
        return .string(String(describing: value))
    }

    private func stringAttribute(_ element: AXUIElement, _ attribute: String) -> String? {
        guard let value = copyAttribute(element, attribute) else {
            return nil
        }
        if let value = value as? String {
            return value
        }
        return String(describing: value)
    }

    private func copyAttribute(_ element: AXUIElement, _ attribute: String) -> CFTypeRef? {
        var value: CFTypeRef?
        let result = AXUIElementCopyAttributeValue(element, attribute as CFString, &value)
        return result == .success ? value : nil
    }

    private func notificationName(_ notification: String) -> String {
        notification
            .replacingOccurrences(of: "AX", with: "")
            .replacingOccurrences(of: "Changed", with: "-changed")
            .replacingOccurrences(of: "Created", with: "-created")
            .split(separator: "-")
            .joined(separator: "-")
            .lowercased()
    }
}

private struct AXElementSnapshot: Sendable {
    var pid: pid_t?
    var bundleIdentifier: String?
    var applicationName: String?
    var role: String?
    var title: String?
    var payload: [String: JSONValue]
}
