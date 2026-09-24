# ⚡ AEON PMIC - BILL OF MATERIALS

## 🎛️ MCU Options

| Part | Features | Sleep | Price | Notes |
|------|----------|-------|-------|-------|
| **ATtiny85** | 8-bit, 8KB flash | 0.1µA | $1.50 | Minimal, proven |
| **ESP32-C3** | RISC-V, BLE, WiFi | 5µA | $2.50 | BLE status! |
| **RP2040** | Dual-core, USB | 0.18mA | $1.00 | Overkill but cheap |

**Recommended: ESP32-C3** - BLE for GOD-KERNEL status updates

---

## ⚡ Power Management ICs

| Part | Function | Vin | Efficiency | Price |
|------|----------|-----|------------|-------|
| **BQ25570** | Solar MPPT harvester | 0.1-5.1V | 90% | $4.50 |
| **LTC3105** | MPPT boost charger | 0.25-5V | 92% | $6.00 |
| **SPV1040** | MPPT boost converter | 0.3-5.5V | 95% | $3.50 |
| **ADP5091** | Multi-source harvester | 0.38-3.3V | 90% | $5.00 |

**Recommended: BQ25570** - Best for multi-source + ultra-low quiescent

---

## 🔋 Battery

| Spec | Value |
|------|-------|
| Chemistry | LiPo / Li-ion |
| Capacity | 2000mAh |
| Voltage | 3.7V nominal (4.2V max) |
| Protection | Built-in PCB (OV/UV/OC/SC) |
| Form factor | Pouch cell, ~50x35x8mm |
| **Price** | $8-15 |

---

## 🌞 Solar Panel

| Spec | Value |
|------|-------|
| Type | Flexible CIGS or OPV |
| Area | 50cm² (3cm × 25cm headband) |
| Voc | 6V |
| Isc | ~100mA |
| Efficiency | 15% |
| **Price** | $15-30 |

---

## 👟 Piezo Harvester

| Part | Type | Output | Price |
|------|------|--------|-------|
| PZT-5H disc | Ceramic | 3-6V, 5mW/step | $5 |
| PVDF film | Polymer | 2-4V, 3mW/step | $10 |
| Custom insole | Stacked array | 3-8V, 10mW/step | $30 |

**Need:** Rectifier + storage cap per foot

---

## 🌡️ Thermoelectric Generator

| Part | ΔT | Output | Price |
|------|-----|--------|-------|
| TEG1-127 | 10°C | 0.5V, 10mW | $8 |
| Marlow TG12-2.5 | 5°C | 0.3V, 5mW | $15 |

**Need:** LTC3108/3109 for low-voltage boost

---

## 📋 Complete BOM

| Qty | Part | Description | Unit $ | Total $ |
|-----|------|-------------|--------|---------|
| 1 | ESP32-C3-MINI | MCU with BLE | $2.50 | $2.50 |
| 1 | BQ25570 | MPPT harvester IC | $4.50 | $4.50 |
| 1 | TPS61200 | Boost converter 5V | $2.00 | $2.00 |
| 1 | TPS22860 | Load switch | $0.80 | $0.80 |
| 1 | LiPo 2000mAh | Battery cell | $10.00 | $10.00 |
| 1 | Solar panel 50cm² | Flexible CIGS | $20.00 | $20.00 |
| 2 | PZT-5H piezo | Shoe harvesters | $5.00 | $10.00 |
| 1 | TEG module | Thermal harvester | $8.00 | $8.00 |
| 1 | LTC3108 | TEG boost | $3.50 | $3.50 |
| 1 | Qi receiver coil | Wireless charging | $5.00 | $5.00 |
| - | Passives | Caps, resistors, etc | $5.00 | $5.00 |
| 1 | PCB | Custom 4-layer | $10.00 | $10.00 |
| | | | **TOTAL** | **$81.30** |

---

## 🔧 Tools Needed

- Soldering iron (fine tip)
- Hot air rework station (for BGA/QFN)
- Multimeter
- USB logic analyzer (optional)
- LiPo charger for testing

---

## 📐 PCB Considerations

- **Size target:** 30mm × 20mm
- **Layers:** 4 (power planes for noise)
- **Key traces:**
  - Solar input: thick, short
  - Battery: thick, kelvin sense
  - High-freq switching: shielded
- **Connectors:**
  - JST-PH for battery
  - JST-SH for piezo/thermal inputs
  - USB-C for output/programming

---

## 🏆 Build Priority

1. **Phase 1:** ESP32 + BQ25570 + Battery + Solar (core system)
2. **Phase 2:** Add piezo input + rectifier
3. **Phase 3:** Add thermal + LTC3108
4. **Phase 4:** Add Qi receiver
5. **Phase 5:** Custom PCB consolidation

---

**GORUNFREE = BUILD IT INCREMENTALLY!** ⚡
