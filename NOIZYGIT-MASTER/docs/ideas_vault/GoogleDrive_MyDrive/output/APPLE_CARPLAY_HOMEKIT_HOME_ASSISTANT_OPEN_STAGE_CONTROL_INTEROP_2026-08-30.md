# Apple CarPlay + HomeKit + Home Assistant + Open Stage Control

**Research date:** 2026-08-30  
**Scope:** Official documentation and verified integration surfaces

## Executive conclusion

The strongest supported architecture is:

```text
Open Stage Control
        │ OSC / MIDI / local HTTP bridge
        ▼
Home Assistant
        │ HomeKit Bridge + WebSocket/REST API
        ├── Apple Home / Siri
        └── Home Assistant iOS app / CarPlay
```

There is no documented native Open Stage Control-to-CarPlay or
Open Stage Control-to-HomeKit integration. Home Assistant should be the
automation and state hub; Open Stage Control should be the custom visual
control surface.

## Capability matrix

| System | Native role | Confirmed interface | Best use |
|---|---|---|---|
| Apple CarPlay | In-car interface | Approved CarPlay app categories; Home Assistant iOS app | Safe driving controls and actions |
| Apple HomeKit | Apple home protocol/UI | HomeKit framework; Home app; Siri | Apple-native home control |
| Home Assistant | Automation/state hub | HomeKit Bridge, HomeKit Device, REST, WebSocket | Normalize devices and automations |
| Open Stage Control | Custom OSC/MIDI surface | OSC, MIDI, browser client, headless server | Studio, cockpit, and custom dashboards |
## Home Assistant APIs

Home Assistant exposes two useful local control interfaces for a custom bridge:

### WebSocket API

Endpoint:

```text
ws://HOME_ASSISTANT_HOST:8123/api/websocket
```

The documented sequence is:

1. Connect.
2. Receive `auth_required`.
3. Send `{ "type": "auth", "access_token": "..." }`.
4. Receive `auth_ok`.
5. Subscribe to `state_changed` events or call services.

Useful commands include:

- `get_states`
- `get_services`
- `subscribe_events`
- `call_service`
- `get_config`
- `get_panels`
- `ping`

The WebSocket API is the preferred path for keeping Open Stage Control widgets
synchronized with live Home Assistant state.

### REST API

Home Assistant also provides REST endpoints over HTTP. A long-lived access token
is sent as a Bearer token. REST is useful for simple button presses, status
queries, and one-way bridge actions; WebSocket is better for continuous state
updates.
## Apple CarPlay

Home Assistant's official iOS Companion app supports CarPlay from iOS 16+.
It automatically discovers the Home Assistant servers configured in the app.
The documented CarPlay surface includes:

- Actions that trigger Home Assistant automations or scripts.
- Controls for buttons, covers, input booleans, input buttons, lights, locks,
  scenes, scripts, and switches.
- Area-based browsing of devices and entities.
- Switching between multiple configured Home Assistant servers.

This makes CarPlay suitable for compact, low-distraction actions such as:
open/close a garage or gate, activate a scene, toggle lights, or run an arrival
automation. It is not a general-purpose dashboard for arbitrary web pages.

Apple's CarPlay framework is category- and entitlement-controlled. Apple lists
supported app categories such as audio, communication, navigation, parking, EV
charging, and food ordering. A custom app must use the approved CarPlay APIs and
obtain the appropriate entitlement; a web control panel cannot simply be
embedded as an unrestricted CarPlay app.
## Apple HomeKit

Home Assistant provides two different paths:

### HomeKit Bridge: Home Assistant → Apple Home

Home Assistant entities can be exposed to Apple's Home app and Siri, including
devices that do not natively support HomeKit. The bridge supports common domains
such as lights, switches, covers, locks, scenes, scripts, climate, cameras,
media players, fans, sensors, humidifiers, and water heaters.

Important constraints:

- A HomeKit bridge has a documented maximum of 150 unique accessories.
- Use filters and multiple bridges for larger installations.
- Pair the generated bridge in Apple's Home app using its QR code or PIN.
- Discovery and pairing depend on local networking and mDNS.
- HomeKit Secure Video is not supported by the Home Assistant bridge.
- Keep Home Assistant and Apple devices on the same LAN, or provide a working
  mDNS reflector when VLANs or containers separate them.

### HomeKit Device: Apple Home → Home Assistant

Home Assistant can also pair compatible HomeKit accessories directly. A HomeKit
accessory can only be paired to one controller at a time, so an accessory may
need to be removed from Apple's Home app before pairing it to Home Assistant.
Thread accessories require an appropriate Thread border-router arrangement.
## Open Stage Control

Open Stage Control consists of a server, launcher, and browser client. The
server sends and receives OSC/MIDI messages and serves the client interface.
It can run with a visible window or headlessly. Compatible browsers can join
its client interface, including iOS devices meeting the documented browser and
OS requirements.

Confirmed native capabilities include:

- OSC message send/receive for widgets.
- Built-in MIDI support in official macOS, Windows, and Linux packages.
- Virtual MIDI devices and OSC-to-MIDI translation.
- Headless/server operation for a remote control surface.
- Browser clients on the local network.

Open Stage Control is therefore a strong front end for a bridge, but it does
not itself provide Apple's HomeKit pairing, Home app accessories, Siri intents,
or CarPlay entitlements.

## Recommended bridge design

```text
OSC widget press
   → local Node.js/Python bridge
   → Home Assistant WebSocket call_service
   → state_changed event
   → bridge translates state back to OSC
   → Open Stage Control widget update
```

Use stable Home Assistant entity IDs and explicit mappings. For example:

```text
/gathering/lights/studio/toggle
  → light.turn_on / light.turn_off
  → light.studio state
  → /gathering/lights/studio/state
```
## Security and network design

- Keep Home Assistant and Open Stage Control on a trusted LAN or Tailscale
  network; do not expose the Home Assistant WebSocket port directly to the
  public internet.
- Store the Home Assistant long-lived access token outside the Open Stage
  Control session file and outside source control.
- Use a least-privilege bridge account where practical.
- Restrict the bridge to an allowlist of entity IDs and service actions.
- Add debounce and idempotency for physical controls so repeated OSC messages
  do not trigger repeated actions.
- Subscribe to state events rather than polling where possible.
- Protect dangerous actions such as locks, gates, alarms, and garage doors with
  explicit confirmation or presence conditions.
- Use TLS at the remote boundary; local WebSocket traffic should still be
  isolated from untrusted networks.

## What is directly supported

| Path | Status | Notes |
|---|---|---|
| Home Assistant → Apple Home | Supported | HomeKit Bridge integration |
| Apple HomeKit device → Home Assistant | Supported | HomeKit Device integration |
| Home Assistant → CarPlay | Supported | Home Assistant iOS Companion app |
| Open Stage Control → Home Assistant | Custom bridge | OSC/MIDI to HA REST/WebSocket |
| Home Assistant → Open Stage Control | Custom bridge | HA events to OSC/MIDI |
| Open Stage Control → Apple Home directly | Not documented | Use Home Assistant as bridge |
| Open Stage Control as native CarPlay app | Not documented | Requires an Apple app and entitlement |
| Arbitrary Open Stage Control web UI in CarPlay | Not supported | CarPlay is not a general web browser |
## Suggested implementation phases

1. Configure Home Assistant entities, areas, scenes, scripts, and automations.
2. Add HomeKit Bridge with a narrow allowlist of safe entities.
3. Enable the Home Assistant iOS Companion app and verify CarPlay actions.
4. Run Open Stage Control on the studio/router host and test a read-only client.
5. Build a small local bridge using the Home Assistant WebSocket API.
6. Add OSC widget commands for low-risk actions first: lights, scenes, and
   transport controls.
7. Add state subscriptions and feedback indicators.
8. Add guarded controls for locks, gates, alarms, and garage doors.
9. Test LAN, Tailscale, reconnect, duplicate messages, and Home Assistant
   restart behavior.

## Official sources consulted

- [Apple HomeKit documentation](https://developer.apple.com/documentation/homekit)
- [Apple CarPlay documentation](https://developer.apple.com/documentation/carplay)
- [Home Assistant HomeKit Bridge](https://www.home-assistant.io/integrations/homekit/)
- [Home Assistant HomeKit Device](https://www.home-assistant.io/integrations/homekit_controller/)
- [Home Assistant CarPlay announcement](https://www.home-assistant.io/blog/2024/01/29/companion-app-for-ios-20241-carplay/)
- [Home Assistant WebSocket API](https://developers.home-assistant.io/docs/api/websocket/)
- [Home Assistant HTTP integration and APIs](https://www.home-assistant.io/integrations/http/)
- [Open Stage Control introduction](https://openstagecontrol.ammd.net/docs/getting-started/introduction/)
- [Open Stage Control MIDI configuration](https://openstagecontrol.ammd.net/docs/midi/midi-configuration/)

**Research boundary:** “All” here means the official integration surfaces and
primary documentation needed to assess interoperability. It does not claim an
exhaustive scrape of every community add-on, forum post, or third-party bridge.
