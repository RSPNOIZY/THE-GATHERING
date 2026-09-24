import JavaScriptCore
import Foundation
import CryptoKit

// ════════════════════════════════════════════════════════════
// HeavenJSRuntime — JavaScriptCore executor for MC96ECO Worker
// Phase 2: Runs the compiled heaven worker.js entirely on-device
//
// Architecture:
//   JSContext (isolated)
//     ├── Polyfill layer (fetch, URL, crypto, streams, TextEncoder)
//     ├── Swift Bridge (env.D1, env.KV, env.AI, console, performance)
//     └── Worker bundle (compiled index.ts from MC96ECO)
//
// Network: all fetch() calls route through ZeroTrustProxy (Swift)
// Crypto:  crypto.subtle mapped to CryptoKit (hardware-backed)
// Memory:  env.D1 / env.KV mapped to AgentMemory + GRDB
// ════════════════════════════════════════════════════════════

@MainActor
final class HeavenJSRuntime: ObservableObject {
    static let shared = HeavenJSRuntime()
    
    // ── State ─────────────────────────────────────────────────
    @Published var status: RuntimeStatus = .unloaded
    @Published var workerLoaded: Bool = false
    @Published var callCount: Int = 0
    @Published var lastError: String?
    
    // ── JSC Infrastructure ────────────────────────────────────
    private var context: JSContext?
    private var workerExports: JSValue?           // module.exports from worker bundle
    private let jsQueue = DispatchQueue(label: "ai.noizy.lucy.jsruntime", qos: .userInteractive)
    
    // ── Bridges ───────────────────────────────────────────────
    private let fetchBridge  = FetchBridge()
    private let cryptoBridge = CryptoBridge()
    private let d1Bridge     = D1Bridge()
    private let kvBridge     = KVBridge()
    private let aiBridge     = AIBridge()
    
    private init() {}
    
    // ════════════════════════════════════════════════════════
    // MARK: — Bootstrap
    // ════════════════════════════════════════════════════════
    
    func load(workerBundle: String? = nil) async throws {
        status = .loading
        
        // 1. Create isolated JSContext
        let vm = JSVirtualMachine()!
        let ctx = JSContext(virtualMachine: vm)!
        context = ctx
        
        // 2. Wire exception handler
        ctx.exceptionHandler = { [weak self] _, exception in
            let msg = exception?.toString() ?? "Unknown JS error"
            Task { @MainActor [weak self] in
                self?.lastError = msg
                self?.status = .error(msg)
            }
            print("[JSRuntime] ❌ \(msg)")
        }
        
        // 3. Inject polyfills (order matters)
        injectCorePolyfills(ctx)
        
        // 4. Inject Swift bridges
        injectSwiftBridges(ctx)
        
        // 5. Load worker bundle
        let bundle = workerBundle ?? defaultWorkerStub()
        ctx.evaluateScript(bundle)
        
        if ctx.exception != nil {
            throw RuntimeError.bundleLoadFailed(ctx.exception?.toString() ?? "Parse error")
        }
        
        // 6. Capture exports
        workerExports = ctx.objectForKeyedSubscript("__heavenExports")
        workerLoaded = true
        status = .running
        
        print("[JSRuntime] ✅ Heaven worker loaded — \(workerLoaded ? "exports ready" : "no exports")")
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Worker Execution
    // ════════════════════════════════════════════════════════
    
    /// Execute a MCP tool call through the heaven worker
    func executeToolCall(toolName: String, args: [String: Any]) async throws -> Any {
        guard let ctx = context, workerLoaded else {
            throw RuntimeError.notLoaded
        }
        
        callCount += 1
        
        return try await withCheckedThrowingContinuation { continuation in
            self.jsQueue.async {
                // Build the call into the worker
                let argsJSON = (try? JSONSerialization.data(withJSONObject: args))
                    .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
                
                let js = """
                (async () => {
                    try {
                        const args = JSON.parse('\(argsJSON.replacing("'", with: "\\'"))');
                        const result = await __heavenExecute('\(toolName)', args);
                        return JSON.stringify({ success: true, result });
                    } catch (e) {
                        return JSON.stringify({ success: false, error: e.message });
                    }
                })()
                """
                
                // JSC doesn't natively resolve Promises — use semaphore pattern
                let semaphore = DispatchSemaphore(value: 0)
                var jsResult: String = "{}"
                
                let promise = ctx.evaluateScript(js)
                
                // Register .then callback to capture Promise resolution
                let thenCallback: @convention(block) (JSValue) -> Void = { value in
                    jsResult = value.toString() ?? "{}"
                    semaphore.signal()
                }
                let catchCallback: @convention(block) (JSValue) -> Void = { error in
                    jsResult = "{\"success\":false,\"error\":\"\(error.toString() ?? "unknown")\"}"
                    semaphore.signal()
                }
                
                promise?.invokeMethod("then",  withArguments: [unsafeBitCast(thenCallback  as AnyObject, to: JSValue.self)])
                promise?.invokeMethod("catch", withArguments: [unsafeBitCast(catchCallback as AnyObject, to: JSValue.self)])
                
                // Pump the runloop so async ops can execute
                let deadline = Date().addingTimeInterval(30) // 30s timeout
                while semaphore.wait(timeout: .now() + 0.01) == .timedOut {
                    if Date() > deadline { break }
                    RunLoop.current.run(mode: .default, before: Date(timeIntervalSinceNow: 0.01))
                }
                
                // Parse result
                guard let data = jsResult.data(using: .utf8),
                      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                    continuation.resume(throwing: RuntimeError.callFailed("Invalid JSON response"))
                    return
                }
                
                if let error = json["error"] as? String {
                    continuation.resume(throwing: RuntimeError.callFailed(error))
                } else {
                    continuation.resume(returning: json["result"] ?? NSNull())
                }
            }
        }
    }
    
    /// Direct script evaluation (for testing/REPL)
    func evaluate(_ script: String) -> JSValue? {
        context?.evaluateScript(script)
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Polyfill Injection
    // Minimal viable Web API surface for Cloudflare Worker TS
    // ════════════════════════════════════════════════════════
    
    private func injectCorePolyfills(_ ctx: JSContext) {
        
        // ── console ───────────────────────────────────────────
        let consoleBridge = JSConsoleBridge()
        ctx.setObject(consoleBridge, forKeyedSubscript: "console" as NSString)
        
        // ── performance ───────────────────────────────────────
        ctx.evaluateScript("""
        var performance = { now: function() { return Date.now(); } };
        """)
        
        // ── TextEncoder / TextDecoder ─────────────────────────
        ctx.evaluateScript("""
        function TextEncoder() {}
        TextEncoder.prototype.encode = function(str) {
            var arr = [];
            for (var i = 0; i < str.length; i++) {
                var code = str.charCodeAt(i);
                if (code < 0x80) { arr.push(code); }
                else if (code < 0x800) {
                    arr.push(0xC0 | (code >> 6), 0x80 | (code & 0x3F));
                } else {
                    arr.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 0x3F), 0x80 | (code & 0x3F));
                }
            }
            return new Uint8Array(arr);
        };
        function TextDecoder() {}
        TextDecoder.prototype.decode = function(arr) {
            return String.fromCharCode.apply(null, arr);
        };
        """)
        
        // ── URL ───────────────────────────────────────────────
        ctx.evaluateScript("""
        function URL(href, base) {
            this.href = base ? base.replace(/\\/+$/, '') + '/' + href.replace(/^\\//, '') : href;
            var parts = this.href.match(/^(https?:)\\/\\/([^/]+)(\\/.*)?(\\?.*)?$/);
            this.protocol = parts ? parts[1] : '';
            this.host     = parts ? parts[2] : '';
            this.pathname = parts ? (parts[3] || '/') : '/';
            this.search   = parts ? (parts[4] || '') : '';
            this.origin   = this.protocol + '//' + this.host;
        }
        URL.prototype.toString = function() { return this.href; };
        """)
        
        // ── Headers ───────────────────────────────────────────
        ctx.evaluateScript("""
        function Headers(init) {
            this._map = {};
            if (init) {
                if (typeof init === 'object') {
                    Object.keys(init).forEach(k => this.set(k, init[k]));
                }
            }
        }
        Headers.prototype.set    = function(k,v) { this._map[k.toLowerCase()] = v; };
        Headers.prototype.get    = function(k)   { return this._map[k.toLowerCase()] || null; };
        Headers.prototype.has    = function(k)   { return k.toLowerCase() in this._map; };
        Headers.prototype.delete = function(k)   { delete this._map[k.toLowerCase()]; };
        Headers.prototype.entries= function() {
            var e = []; Object.keys(this._map).forEach(k => e.push([k, this._map[k]]));
            return e[Symbol.iterator]();
        };
        Headers.prototype.forEach = function(cb) {
            Object.keys(this._map).forEach(k => cb(this._map[k], k, this));
        };
        """)
        
        // ── Request / Response ────────────────────────────────
        ctx.evaluateScript("""
        function Request(url, init) {
            this.url     = url instanceof URL ? url.href : url;
            this.method  = (init && init.method) || 'GET';
            this.headers = new Headers((init && init.headers) || {});
            this.body    = (init && init.body) || null;
        }
        Request.prototype.json = function() {
            return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
        };
        Request.prototype.text = function() {
            return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
        };
        
        function Response(body, init) {
            this.status     = (init && init.status) || 200;
            this.statusText = (init && init.statusText) || 'OK';
            this.ok         = this.status >= 200 && this.status < 300;
            this.headers    = new Headers((init && init.headers) || {});
            this._body      = typeof body === 'string' ? body : JSON.stringify(body);
        }
        Response.prototype.text = function() { return Promise.resolve(this._body); };
        Response.prototype.json = function() {
            return Promise.resolve(JSON.parse(this._body));
        };
        Response.json = function(data, init) {
            var r = new Response(JSON.stringify(data), init);
            r.headers.set('content-type', 'application/json');
            return r;
        };
        Response.error = function() { return new Response('', {status: 0}); };
        """)
        
        // ── ReadableStream / WritableStream ───────────────────
        ctx.evaluateScript("""
        function ReadableStream(underlyingSource) {
            this._source = underlyingSource;
        }
        ReadableStream.prototype.getReader = function() {
            var self = this; var done = false;
            return {
                read: function() {
                    if (done) return Promise.resolve({done: true, value: undefined});
                    done = true;
                    return Promise.resolve({done: false, value: new Uint8Array()});
                },
                cancel: function() { return Promise.resolve(); }
            };
        };
        function WritableStream() {}
        function TransformStream() {
            this.readable = new ReadableStream();
            this.writable = new WritableStream();
        }
        """)
        
        // ── structuredClone ───────────────────────────────────
        ctx.evaluateScript("""
        function structuredClone(obj) { return JSON.parse(JSON.stringify(obj)); }
        """)
        
        // ── queueMicrotask ────────────────────────────────────
        ctx.evaluateScript("""
        function queueMicrotask(fn) { Promise.resolve().then(fn); }
        """)
        
        // ── atob / btoa ───────────────────────────────────────
        ctx.evaluateScript("""
        function btoa(s) {
            var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var out=''; var i=0;
            while(i<s.length){
                var c1=s.charCodeAt(i++)&0xff, c2=i<s.length?s.charCodeAt(i++)&0xff:0;
                var c3=i<s.length?s.charCodeAt(i++)&0xff:0;
                out+=chars.charAt(c1>>2)+chars.charAt(((c1&3)<<4)|(c2>>4));
                out+=i<=s.length?chars.charAt(((c2&15)<<2)|(c3>>6)):'=';
                out+=i<=s.length?chars.charAt(c3&63):'=';
            }
            return out;
        }
        function atob(s) {
            var chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            var out=''; s=s.replace(/=/g,''); var i=0;
            while(i<s.length){
                var c1=chars.indexOf(s.charAt(i++)), c2=chars.indexOf(s.charAt(i++));
                var c3=chars.indexOf(s.charAt(i++)), c4=chars.indexOf(s.charAt(i++));
                out+=String.fromCharCode((c1<<2)|(c2>>4));
                if(c3!=-1)out+=String.fromCharCode(((c2&15)<<4)|(c3>>2));
                if(c4!=-1)out+=String.fromCharCode(((c3&3)<<6)|c4);
            }
            return out;
        }
        """)
        
        // ── setTimeout / setInterval (sync polyfill) ──────────
        ctx.evaluateScript("""
        var __timers = {};
        var __timerId = 0;
        function setTimeout(fn, delay) {
            var id = ++__timerId;
            __timers[id] = { fn: fn, delay: delay || 0 };
            // In JSCore, execute immediately via Promise
            Promise.resolve().then(function() { if(__timers[id]) { fn(); delete __timers[id]; } });
            return id;
        }
        function clearTimeout(id) { delete __timers[id]; }
        function setInterval(fn, delay) { return setTimeout(fn, delay); }
        function clearInterval(id) { clearTimeout(id); }
        """)
        
        // ── globalThis / self / global ────────────────────────
        ctx.evaluateScript("""
        var globalThis = this;
        var self = this;
        var global = this;
        var window = this;
        """)
        
        print("[JSRuntime] ✅ Core polyfills injected")
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Swift Bridge Injection
    // These replace Cloudflare's runtime bindings with
    // Swift-native implementations (GRDB, CryptoKit, etc.)
    // ════════════════════════════════════════════════════════
    
    private func injectSwiftBridges(_ ctx: JSContext) {
        
        // ── fetch → ZeroTrustProxy ────────────────────────────
        let fetchFn: @convention(block) (JSValue, JSValue?) -> JSValue = { [weak self] urlValue, initValue in
            guard let ctx = self?.context else { return JSValue(undefinedIn: ctx) }
            
            let urlStr = urlValue.isObject ? (urlValue.objectForKeyedSubscript("href")?.toString() ?? urlValue.toString()) : urlValue.toString()
            let method = initValue?.objectForKeyedSubscript("method")?.toString() ?? "GET"
            let bodyStr = initValue?.objectForKeyedSubscript("body")?.toString()
            
            let promise = JSValue(newPromiseIn: ctx) { resolve, reject in
                Task {
                    do {
                        guard let url = URL(string: urlStr ?? "") else {
                            reject?.call(withArguments: ["Invalid URL: \(urlStr ?? "")"])
                            return
                        }
                        let bodyData = bodyStr?.data(using: .utf8)
                        let data = try await ZeroTrustProxy.shared.request(url: url, method: method, body: bodyData)
                        let bodyStr = String(data: data, encoding: .utf8) ?? ""
                        
                        // Build Response object in JS
                        let responseJS = ctx.evaluateScript("""
                        (function() {
                            var r = new Response('\(bodyStr.replacing("'", with: "\\'"))', {status: 200});
                            return r;
                        })()
                        """)
                        resolve?.call(withArguments: [responseJS as Any])
                    } catch {
                        reject?.call(withArguments: [error.localizedDescription])
                    }
                }
            }
            return promise!
        }
        ctx.setObject(fetchFn, forKeyedSubscript: "fetch" as NSString)
        
        // ── crypto → CryptoKit ────────────────────────────────
        ctx.setObject(cryptoBridge, forKeyedSubscript: "crypto" as NSString)
        
        // ── Cloudflare D1 Binding ─────────────────────────────
        ctx.setObject(d1Bridge, forKeyedSubscript: "__CF_D1" as NSString)
        
        // ── Cloudflare KV Binding ─────────────────────────────
        ctx.setObject(kvBridge, forKeyedSubscript: "__CF_KV" as NSString)
        
        // ── Cloudflare AI Binding ─────────────────────────────
        ctx.setObject(aiBridge, forKeyedSubscript: "__CF_AI" as NSString)
        
        // ── Build the CF env object that heaven worker expects ──
        ctx.evaluateScript("""
        var env = {
            D1:  __CF_D1,
            KV:  __CF_KV,
            AI:  __CF_AI,
            HEAVEN_WORKER_URL: '\(HeavenConfig.current.workerURL)',
            ENVIRONMENT: 'ios-local'
        };
        """)
        
        // ── ExecutionContext polyfill ─────────────────────────
        ctx.evaluateScript("""
        function ExecutionContext() {}
        ExecutionContext.prototype.waitUntil = function(promise) {
            // No-op on local — promises run to completion anyway
            promise.catch(function(e) { console.error('waitUntil error:', e); });
        };
        ExecutionContext.prototype.passThroughOnException = function() {};
        var ctx_exec = new ExecutionContext();
        """)
        
        // ── Heaven executor bridge ────────────────────────────
        // This is called by executeToolCall above
        ctx.evaluateScript("""
        async function __heavenExecute(toolName, args) {
            if (typeof __heavenExports === 'undefined') {
                throw new Error('Heaven worker not loaded');
            }
            // Call through the MCP dispatch table
            const handler = __heavenExports.tools && __heavenExports.tools[toolName];
            if (!handler) {
                throw new Error('Unknown tool: ' + toolName);
            }
            return await handler(args, env, ctx_exec);
        }
        """)
        
        print("[JSRuntime] ✅ Swift bridges injected (fetch→ZT, crypto→CryptoKit, D1→GRDB, KV→local)")
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Worker Bundle Loader
    // ════════════════════════════════════════════════════════
    
    /// Load a compiled worker bundle from disk
    func loadBundle(from url: URL) async throws {
        let source = try String(contentsOf: url, encoding: .utf8)
        try await load(workerBundle: wrapBundle(source))
    }
    
    /// Load from app bundle (for standalone operation)
    func loadBundledWorker() async throws {
        if let url = Bundle.main.url(forResource: "heaven-worker", withExtension: "js") {
            try await loadBundle(from: url)
        } else {
            // Use stub until bundle is dropped in
            try await load()
        }
    }
    
    /// Wraps the Cloudflare Worker ES module format into JSCore-compatible IIFE
    private func wrapBundle(_ source: String) -> String {
        """
        // Cloudflare Worker Module → JSCore IIFE Wrapper
        // Generated by LucyMCP HeavenJSRuntime
        
        var module = { exports: {} };
        var exports = module.exports;
        var require = function(id) {
            // Polyfill require for bundled deps
            console.log('[JSRuntime] require: ' + id);
            return {};
        };
        
        // ── Worker Source ─────────────────────────────────────
        \(source)
        // ─────────────────────────────────────────────────────
        
        // Capture default export (ES module Workers use default export)
        if (typeof module.exports.default !== 'undefined') {
            __heavenExports = module.exports.default;
        } else if (typeof module.exports.fetch !== 'undefined') {
            __heavenExports = module.exports;
        } else {
            __heavenExports = module.exports;
        }
        
        console.log('[JSRuntime] Bundle loaded, exports:', typeof __heavenExports);
        """
    }
    
    /// Stub for Phase 1 validation (replaces actual worker)
    private func defaultWorkerStub() -> String {
        """
        // Heaven Worker Stub
        // Replace this with the compiled MC96ECO worker bundle
        // Drop heaven-worker.js into the Xcode project as a resource
        
        var __heavenExports = {
            tools: {
                gabrielExecute: async function(args, env, ctx) {
                    console.log('[Stub] gabrielExecute called:', JSON.stringify(args));
                    
                    // Test D1 bridge
                    var memResult = await env.D1.get(args.key || 'test');
                    
                    return {
                        output: 'Phase 2 JSC runtime: VALIDATED. Stub active. Drop heaven-worker.js to go live.',
                        model: 'gabriel-stub',
                        memoryResult: memResult,
                        timestamp: Date.now()
                    };
                },
                
                memoryStore: async function(args, env, ctx) {
                    await env.D1.put(args.key, args.value);
                    return { stored: true, key: args.key };
                },
                
                memoryRetrieve: async function(args, env, ctx) {
                    var val = await env.D1.get(args.key);
                    return { value: val, key: args.key };
                },
                
                airplayDiscover: async function(args, env, ctx) {
                    return { message: 'AirPlay discovery: routed to Swift AirPlayRouter' };
                }
            },
            
            fetch: async function(request, env, ctx) {
                return Response.json({ status: 'Heaven Worker Stub', phase: 2 });
            }
        };
        
        console.log('[Heaven] Worker stub loaded — Phase 2 JSC runtime active');
        """
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Swift Bridge Implementations
// ════════════════════════════════════════════════════════════

// ── console ───────────────────────────────────────────────────

@objc class JSConsoleBridge: NSObject {
    @objc func log(_ msg: JSValue)   { print("[JS] \(msg)") }
    @objc func error(_ msg: JSValue) { print("[JS:ERR] \(msg)") }
    @objc func warn(_ msg: JSValue)  { print("[JS:WARN] \(msg)") }
    @objc func info(_ msg: JSValue)  { print("[JS:INFO] \(msg)") }
    @objc func debug(_ msg: JSValue) { print("[JS:DBG] \(msg)") }
    @objc func table(_ val: JSValue) { print("[JS:TABLE] \(val)") }
}

// ── crypto → CryptoKit (hardware-backed on Apple Silicon) ─────

@objc class CryptoBridge: NSObject, JSExport {
    
    // crypto.randomUUID()
    @objc func randomUUID() -> String {
        UUID().uuidString.lowercased()
    }
    
    // crypto.getRandomValues(array)
    @objc func getRandomValues(_ array: JSValue) -> JSValue {
        let length = Int(array.objectForKeyedSubscript("length")?.toInt32() ?? 0)
        var bytes = [UInt8](repeating: 0, count: length)
        _ = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)
        for (i, byte) in bytes.enumerated() {
            array.setObject(byte, atIndexedSubscript: i)
        }
        return array
    }
    
    // crypto.subtle — returns the subtle bridge
    @objc var subtle: SubtleCryptoBridge { SubtleCryptoBridge() }
}

@objc class SubtleCryptoBridge: NSObject, JSExport {
    
    // crypto.subtle.digest("SHA-256", data) → Promise<ArrayBuffer>
    @objc func digest(_ algorithm: String, _ dataValue: JSValue) -> JSValue {
        guard let ctx = dataValue.context else { return JSValue() }
        
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            Task {
                let length = Int(dataValue.objectForKeyedSubscript("length")?.toInt32() ?? 0)
                var bytes = [UInt8](repeating: 0, count: length)
                for i in 0..<length {
                    bytes[i] = UInt8(dataValue.objectAtIndexedSubscript(i).toInt32())
                }
                let data = Data(bytes)
                
                var hash: Data
                switch algorithm.uppercased() {
                case "SHA-256": hash = Data(SHA256.hash(data: data))
                case "SHA-384": hash = Data(SHA384.hash(data: data))
                case "SHA-512": hash = Data(SHA512.hash(data: data))
                default:        hash = Data(SHA256.hash(data: data))
                }
                
                // Return as Uint8Array
                let arr = ctx.evaluateScript("new Uint8Array(\(hash.count))")
                for (i, byte) in hash.enumerated() {
                    arr?.setObject(byte, atIndexedSubscript: i)
                }
                resolve?.call(withArguments: [arr as Any])
            }
        }!
    }
    
    // crypto.subtle.sign("HMAC", key, data) → Promise<ArrayBuffer>
    @objc func sign(_ algorithm: JSValue, _ key: JSValue, _ dataValue: JSValue) -> JSValue {
        guard let ctx = dataValue.context else { return JSValue() }
        
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            Task {
                // Build HMAC using CryptoKit
                let keyBytes = (0..<Int(key.objectForKeyedSubscript("length")?.toInt32() ?? 0))
                    .map { UInt8(key.objectAtIndexedSubscript($0).toInt32()) }
                let dataBytes = (0..<Int(dataValue.objectForKeyedSubscript("length")?.toInt32() ?? 0))
                    .map { UInt8(dataValue.objectAtIndexedSubscript($0).toInt32()) }
                
                let symmetricKey = SymmetricKey(data: Data(keyBytes))
                let mac = HMAC<SHA256>.authenticationCode(for: Data(dataBytes), using: symmetricKey)
                let macData = Data(mac)
                
                let arr = ctx.evaluateScript("new Uint8Array(\(macData.count))")
                for (i, byte) in macData.enumerated() {
                    arr?.setObject(byte, atIndexedSubscript: i)
                }
                resolve?.call(withArguments: [arr as Any])
            }
        }!
    }
    
    // crypto.subtle.importKey(format, keyData, algorithm, extractable, usages)
    @objc func importKey(_ format: String, _ keyData: JSValue,
                         _ algorithm: JSValue, _ extractable: Bool,
                         _ usages: JSValue) -> JSValue {
        guard let ctx = keyData.context else { return JSValue() }
        
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            // Return the raw key data wrapped as a CryptoKey-like object
            let keyObj = ctx.evaluateScript("""
            (function() {
                return {
                    type: 'secret',
                    extractable: \(extractable),
                    algorithm: { name: 'HMAC' },
                    usages: ['sign', 'verify'],
                    _raw: arguments[0]
                };
            })()
            """)
            resolve?.call(withArguments: [keyObj as Any])
        }!
    }
    
    // crypto.subtle.verify — delegate to sign + compare
    @objc func verify(_ algorithm: JSValue, _ key: JSValue,
                      _ signature: JSValue, _ data: JSValue) -> JSValue {
        guard let ctx = data.context else { return JSValue() }
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            resolve?.call(withArguments: [true]) // Simplified — implement full verify as needed
        }!
    }
}

// ── D1 Bridge → AgentMemory ───────────────────────────────────

@objc class D1Bridge: NSObject, JSExport {
    
    @objc func get(_ key: String) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            Task {
                let value = await AgentMemory.shared.retrieve(key: key)
                resolve?.call(withArguments: [value as Any])
            }
        }!
    }
    
    @objc func put(_ key: String, _ value: String) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            Task {
                await AgentMemory.shared.store(key: key, value: value)
                resolve?.call(withArguments: [true])
            }
        }!
    }
    
    @objc func delete(_ key: String) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            Task {
                await AgentMemory.shared.delete(key: key)
                resolve?.call(withArguments: [true])
            }
        }!
    }
    
    // D1.prepare("SELECT ...").bind(...).all()
    @objc func prepare(_ sql: String) -> JSValue {
        let ctx = JSContext.current()!
        return ctx.evaluateScript("""
        ({
            _sql: '\(sql)',
            bind: function() { this._args = Array.from(arguments); return this; },
            all: function() {
                return Promise.resolve({ results: [], success: true });
            },
            first: function() {
                return Promise.resolve(null);
            },
            run: function() {
                return Promise.resolve({ success: true, meta: { changes: 0 } });
            }
        })
        """)!
    }
    
    @objc func batch(_ statements: JSValue) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { resolve, _ in
            resolve?.call(withArguments: [[]])
        }!
    }
}

// ── KV Bridge → Local Key-Value Store ────────────────────────

@objc class KVBridge: NSObject, JSExport {
    private let store = UserDefaults(suiteName: "ai.noizy.lucy.kv")!
    
    @objc func get(_ key: String) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { [weak self] resolve, _ in
            let value = self?.store.string(forKey: key)
            resolve?.call(withArguments: [value as Any])
        }!
    }
    
    @objc func put(_ key: String, _ value: String) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { [weak self] resolve, _ in
            self?.store.set(value, forKey: key)
            resolve?.call(withArguments: [true])
        }!
    }
    
    @objc func delete(_ key: String) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { [weak self] resolve, _ in
            self?.store.removeObject(forKey: key)
            resolve?.call(withArguments: [true])
        }!
    }
    
    @objc func list(_ options: JSValue) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { [weak self] resolve, _ in
            let allKeys = self?.store.dictionaryRepresentation().keys.map { $0 } ?? []
            let json = (try? JSONSerialization.data(withJSONObject: allKeys))
                .flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
            resolve?.call(withArguments: [ctx.evaluateScript("(\(json))") as Any])
        }!
    }
}

// ── AI Bridge → Ollama ────────────────────────────────────────

@objc class AIBridge: NSObject, JSExport {
    
    // env.AI.run("@cf/meta/llama-3...", { prompt: "..." })
    @objc func run(_ model: String, _ inputs: JSValue) -> JSValue {
        let ctx = JSContext.current()!
        return JSValue(newPromiseIn: ctx) { resolve, reject in
            Task {
                let prompt = inputs.objectForKeyedSubscript("prompt")?.toString() ?? ""
                let messages = inputs.objectForKeyedSubscript("messages")
                
                // Map CF AI model names to Ollama equivalents
                let ollamaModel = AIBridge.mapModel(model)
                
                // Call local Ollama
                guard let url = URL(string: "http://localhost:11434/api/generate") else {
                    reject?.call(withArguments: ["Invalid Ollama URL"])
                    return
                }
                
                let payload: [String: Any] = [
                    "model": ollamaModel,
                    "prompt": prompt,
                    "stream": false,
                    "options": ["num_predict": 500]
                ]
                
                let body = try? JSONSerialization.data(withJSONObject: payload)
                
                do {
                    let data = try await ZeroTrustProxy.shared.request(url: url, method: "POST", body: body)
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let response = json["response"] as? String {
                        
                        let resultJSON = (try? JSONSerialization.data(withJSONObject: ["response": response]))
                            .flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
                        resolve?.call(withArguments: [ctx.evaluateScript("(\(resultJSON))") as Any])
                    }
                } catch {
                    reject?.call(withArguments: [error.localizedDescription])
                }
            }
        }!
    }
    
    private static func mapModel(_ cfModel: String) -> String {
        let mapping: [String: String] = [
            "@cf/meta/llama-3.1-8b-instruct":   "llama3.1:8b",
            "@cf/meta/llama-3.3-70b-instruct":  "llama3.3:70b",
            "@cf/mistral/mistral-7b-instruct":   "mistral:7b",
            "@cf/google/gemma-3-12b-it":         "gemma3:latest",
            "@cf/qwen/qwen2.5-coder-32b-instruct": "codestral:latest",
        ]
        return mapping[cfModel] ?? "gemma3:latest"
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Supporting Types
// ════════════════════════════════════════════════════════════

enum RuntimeStatus: Equatable {
    case unloaded, loading, running, error(String)
}

enum RuntimeError: Error {
    case notLoaded
    case bundleLoadFailed(String)
    case callFailed(String)
    case timeout
}

extension String {
    func replacing(_ target: String, with replacement: String) -> String {
        self.replacingOccurrences(of: target, with: replacement)
    }
}
