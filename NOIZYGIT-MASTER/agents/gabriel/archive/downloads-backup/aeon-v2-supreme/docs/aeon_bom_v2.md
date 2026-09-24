# ⚡ AEON PMIC v2.0 SUPREME - BILL OF MATERIALS

## 🆕 UPGRADES FROM v1.0

| Feature | v1.0 | v2.0 SUPREME |
|---------|------|--------------|
| SOC Accuracy | Voltage-based (~10%) | Fuel gauge (<1%) |
| Energy Tracking | None | Coulomb counting |
| AI Power Modes | 2 (on/off) | 5 levels + burst |
| Supercapacitor | None | 1F burst buffer |
| Persistence | None | NVS flash logging |
| Watchdog | None | 30s hardware WDT |
| OTA Updates | None | BLE OTA |
| Voice Alerts | None | BLE → GOD-KERNEL |
| Temperature | None | Compensated charging |

---

## 🎛️ MCU

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **ESP32-C3-MINI-1** | RISC-V, BLE 5.0, 4MB flash | $2.80 | Main processor |

---

## 🔋 POWER MANAGEMENT

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **BQ25570** | Ultra-low power MPPT harvester | $4.50 | Solar + piezo input |
| **MAX17048** | Fuel gauge IC | $2.50 | Accurate SOC |
| **TPS61200** | Boost converter 5V 300mA | $2.00 | USB-C output |
| **TPS22860** | Load switch 20mΩ | $0.80 | Low-loss switching |
| **LTC3108** | TEG boost (20mV startup!) | $4.00 | Thermal harvester |
| **BQ24072** | USB-C charger IC | $2.50 | Qi + USB input |

---

## 🔋 ENERGY STORAGE

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **LiPo Cell** | 2000mAh 3.7V, 50×35×8mm | $10.00 | Main battery |
| **Supercapacitor** | 1F 5.5V, 20×8mm | $3.00 | AI burst buffer |
| **Protection PCB** | 2A, OV/UV/OC/SC | $1.00 | Safety |

---

## 🌞 HARVESTERS

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **CIGS Solar Panel** | 50cm² flexible, 6V 100mA | $25.00 | Headband mount |
| **PZT-5H Discs** | 27mm piezo, 2x for shoes | $8.00 | Heel + toe each foot |
| **Schottky Rectifier** | BAT54S dual, 4x | $1.00 | Piezo rectification |
| **TEG Module** | TEC1-12706, 40×40mm | $6.00 | Body heat harvest |
| **Qi Receiver Coil** | 5W, 50mm diameter | $5.00 | Wireless charging |

---

## 📡 CONNECTIVITY

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **Ceramic Antenna** | 2.4GHz BLE, SMD | $0.50 | On-board BLE |
| **USB-C Connector** | 16-pin, SMD | $0.80 | Power out + programming |

---

## 💡 INDICATORS

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **WS2812B** | RGB LED, 5×5mm | $0.30 | Status indicator |
| **Tactile Switch** | 6×6mm, SMD | $0.10 | Wake/mode button |

---

## 🔩 PASSIVES

| Part | Qty | Price | Notes |
|------|-----|-------|-------|
| Inductors (4.7µH, 10µH, 22µH) | 5 | $1.50 | MPPT + boost |
| Capacitors (1µF-100µF ceramic) | 20 | $2.00 | Filtering |
| Capacitors (470µF electrolytic) | 2 | $0.50 | Bulk storage |
| Resistors (0402/0603 kit) | 50 | $1.00 | Dividers + sense |
| Schottky Diodes (SS14) | 5 | $0.50 | Reverse protection |
| ESD Protection (PESD5V0S2BT) | 3 | $0.50 | USB + GPIO |

---

## 🖨️ PCB

| Part | Spec | Price | Notes |
|------|------|-------|-------|
| **Custom PCB** | 4-layer, 40×25mm, ENIG | $15.00 | JLC/PCBWay 5pcs |
| **Stencil** | Steel, 0.12mm | $5.00 | Solder paste |

---

## 📋 COMPLETE BOM SUMMARY

| Category | Total |
|----------|-------|
| MCU | $2.80 |
| Power Management ICs | $16.30 |
| Energy Storage | $14.00 |
| Harvesters | $45.00 |
| Connectivity | $1.30 |
| Indicators | $0.40 |
| Passives | $6.00 |
| PCB + Stencil | $20.00 |
| **GRAND TOTAL** | **$105.80** |

---

## 🛒 SUPPLIER LINKS

| Component | Supplier | Part # |
|-----------|----------|--------|
| ESP32-C3-MINI-1 | LCSC | C2934560 |
| BQ25570 | DigiKey | 296-38870-1-ND |
| MAX17048 | DigiKey | MAX17048G+T-ND |
| TPS61200 | DigiKey | 296-22825-1-ND |
| LTC3108 | DigiKey | LTC3108EMS#PBF-ND |
| Solar Panel | AliExpress | Flexible CIGS 6V |
| PZT Piezo | AliExpress | 27mm disc |
| TEG Module | AliExpress | TEC1-12706 |
| LiPo 2000mAh | AliExpress | 503759 |
| Supercap 1F | DigiKey | 478-8440-1-ND |

---

## 🔧 ASSEMBLY NOTES

1. **Solder paste stencil** recommended for PMIC ICs (QFN packages)
2. **Hot air reflow** at 260°C peak
3. **Program ESP32** before final assembly (USB-C)
4. **Calibrate fuel gauge** with known battery
5. **Test MPPT** with variable light source
6. **Verify supercap** charge/discharge cycle

---

## 📐 MECHANICAL

| Dimension | Value |
|-----------|-------|
| PCB Size | 40 × 25 × 1.6 mm |
| Total Height | ~12mm (with battery) |
| Weight | ~45g (with battery) |
| Enclosure | 3D printed TPU (flexible) |

---

## ⚡ POWER BUDGET

| Mode | Current | Runtime (2000mAh) |
|------|---------|-------------------|
| Deep Sleep | 5µA | 45 years |
| BLE Beacon | 100µA | 833 days |
| Idle + BLE | 2mA | 41 days |
| Active (audio) | 50mA | 40 hours |
| AI Burst | 150mA | 13 hours |
| Max Load | 300mA | 6.6 hours |

---

**TOTAL PROJECT COST: ~$106**
**ASSEMBLY TIME: 2-3 hours**
**DIFFICULTY: Intermediate (SMD soldering)**
