# ⚡ AEON BLE PROTOCOL SPECIFICATION v2.0

## 📡 SERVICE DEFINITION

**Service UUID:** `AE0N0001-0000-0000-0000-000000000001`

### Characteristics

| Name | UUID | Properties | Description |
|------|------|------------|-------------|
| Power State | `AE0N0001-0001-...` | Read, Notify | Real-time power data |
| Command | `AE0N0001-0002-...` | Write | Control commands |
| Config | `AE0N0001-0003-...` | Read, Write | Configuration |
| OTA Control | `AE0N0001-0004-...` | Write | Firmware update |
| OTA Data | `AE0N0001-0005-...` | Write | Firmware chunks |
| Voice Alert | `AE0N0001-0006-...` | Notify | TTS messages |

---

## 📊 POWER STATE PACKET (Notify, 20 bytes)

```
Byte 0:     Mode (HARVEST=0, BUFFER=1, BOOST=2, BURST=3, CRITICAL=4, SLEEP=5, OTA=6)
Byte 1-2:   SOC (uint16, 0.01% resolution) → divide by 100 for %
Byte 3-4:   Battery voltage (uint16, mV)
Byte 5-6:   Supercap voltage (uint16, mV)
Byte 7-8:   Harvest power (uint16, mW)
Byte 9-10:  Load power (uint16, mW)
Byte 11-12: Net power (int16, mW, signed)
Byte 13-14: Runtime remaining (uint16, minutes)
Byte 15:    Alert flags (bitmask)
Byte 16:    AI level (0-4)
Byte 17:    Temperature (int8, °C, signed)
Byte 18-19: Reserved
```

### Alert Flags (Byte 15)

| Bit | Flag |
|-----|------|
| 0 | Low battery |
| 1 | Critical battery |
| 2 | Over temperature |
| 3 | Charging |
| 4 | Full |
| 5 | Burst ready |
| 6 | OTA available |
| 7 | Error |

---

## 🎮 COMMAND PACKET (Write, variable length)

| Command | Code | Payload | Description |
|---------|------|---------|-------------|
| BURST_ON | 0x01 | None | Enable burst mode |
| BURST_OFF | 0x02 | None | Disable burst mode |
| SLEEP | 0x03 | None | Force sleep |
| WAKE | 0x04 | None | Wake up |
| SET_MODE | 0x05 | 1 byte mode | Force mode |
| GET_STATS | 0x06 | None | Request detailed stats |
| RESET_STATS | 0x07 | None | Clear counters |
| OTA_START | 0x10 | 4 byte size | Begin OTA |
| OTA_ABORT | 0x11 | None | Cancel OTA |
| REBOOT | 0xFF | None | Reboot device |

---

## ⚙️ CONFIG PACKET (Read/Write, 32 bytes)

```
Byte 0-3:   Battery critical threshold (float, V)
Byte 4-7:   Battery low threshold (float, V)
Byte 8-11:  Battery OK threshold (float, V)
Byte 12-15: Battery high threshold (float, V)
Byte 16:    Features enabled (bitmask)
Byte 17:    BLE TX interval (seconds)
Byte 18:    Log interval (minutes)
Byte 19:    Sleep timeout (minutes)
Byte 20-23: Reserved
Byte 24-27: Reserved
Byte 28-31: Config CRC32
```

### Features Bitmask (Byte 16)

| Bit | Feature |
|-----|---------|
| 0 | Supercap enabled |
| 1 | Piezo enabled |
| 2 | Thermal enabled |
| 3 | BLE enabled |
| 4 | Voice alerts |
| 5 | Predictive mode |
| 6 | Auto-sleep |
| 7 | Reserved |

---

## 📢 VOICE ALERT PACKET (Notify, variable length)

```
Byte 0:     Alert type
Byte 1:     Priority (0-3)
Byte 2:     Length of message
Byte 3-N:   UTF-8 message string
```

### Alert Types

| Code | Type | Example Message |
|------|------|-----------------|
| 0x01 | Mode change | "Switching to power saver" |
| 0x02 | Low battery | "Battery at 20 percent" |
| 0x03 | Critical | "Critical battery. Shutting down." |
| 0x04 | Charging | "Charging started" |
| 0x05 | Full | "Battery full" |
| 0x06 | Burst ready | "Burst mode available" |
| 0x07 | Prediction | "Low battery expected in 2 hours" |

---

## 🔄 OTA PROTOCOL

### Sequence

1. **Phone → PMIC:** `OTA_START` with firmware size
2. **PMIC → Phone:** ACK or NAK
3. **Phone → PMIC:** Firmware chunks (512 bytes each) via OTA Data
4. **PMIC:** Writes to flash partition
5. **Phone → PMIC:** Final chunk with CRC
6. **PMIC:** Verify CRC, swap partitions, reboot

### OTA Data Packet

```
Byte 0-1:   Chunk index (uint16)
Byte 2-3:   Chunk size (uint16)
Byte 4-N:   Data (up to 512 bytes)
```

---

## 📱 PHONE APP RESPONSIBILITIES

1. **Connect** to AEON-PMIC device
2. **Subscribe** to Power State notifications
3. **Forward** power data to GOD-KERNEL via HTTPS/WebSocket
4. **Relay** burst commands from GOD-KERNEL to PMIC
5. **Display** local power dashboard
6. **Handle** voice alerts (text-to-speech)
7. **Manage** OTA firmware updates
8. **Cache** data when offline

---

## 🔐 SECURITY

- **Pairing:** LE Secure Connections (LESC)
- **Bonding:** Required after first connection
- **Encryption:** AES-128-CCM
- **Authentication:** Numeric comparison or passkey
- **MITM Protection:** Yes

---

## 📊 TYPICAL MESSAGE FLOW

```
┌────────┐         ┌────────────┐         ┌─────────────┐
│  PMIC  │         │   Phone    │         │ GOD-KERNEL  │
└───┬────┘         └─────┬──────┘         └──────┬──────┘
    │                    │                       │
    │ Power State (1/s)  │                       │
    │ ─────────────────► │                       │
    │                    │ HTTPS POST power      │
    │                    │ ─────────────────────►│
    │                    │                       │
    │                    │     AI throttle level │
    │                    │ ◄─────────────────────│
    │                    │                       │
    │                    │ (if burst needed)     │
    │                    │ ◄─────────────────────│
    │   BURST_ON         │                       │
    │ ◄───────────────── │                       │
    │                    │                       │
    │ Voice Alert        │                       │
    │ ─────────────────► │                       │
    │                    │ (TTS playback)        │
    │                    │                       │
```
