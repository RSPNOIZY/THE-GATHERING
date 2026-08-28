# 🔧 D-Link DGS-1210-10 — Complete Setup Guide

> Jumbo Frames, Firmware Upgrade, and Optimal Configuration

---

## Quick Access

```bash
open http://10.90.90.90
```

**Default credentials:** `admin` / (blank or `admin`)

---

## 1. Enable Jumbo Frames (MTU 9216)

### Web UI Steps
1. Login to switch at `http://10.90.90.90`
2. Navigate: `System` → `Jumbo Frame`
3. Set: **Jumbo Frame Size = 9216** (max supported)
4. Apply to **all ports** connected to:
   - M2 Ultra (macOS)
   - HP-OMEN (Windows)
   - NAS / storage arrays
   - Parallels VMs (bridged NICs)
5. Save: `Save` → `Save Configuration`

### Port-Level Configuration
1. Navigate: `Port` → `Port Configuration`
2. For each port:
   - Speed: `Auto` or `1000M Full`
   - Flow Control: `Disabled` (unless NIC requires it)
   - Jumbo: `Enabled`
3. Save configuration

---

## 2. Firmware Upgrade

### Check Current Version
1. Navigate: `System` → `System Information`
2. Note current firmware version

### Download Latest Firmware
- **Primary:** https://support.dlink.com → Search "DGS-1210-10"
- **Legacy:** https://legacy.us.dlink.com
- Download `.bin` or `.ros` file

### Upgrade Process
1. Navigate: `Tools` → `Firmware Upgrade`
2. Browse to downloaded file
3. Click **Upgrade**
4. ⚠️ **DO NOT power off during upgrade** (2-5 minutes)
5. Switch reboots automatically
6. Re-verify settings and save

---

## 3. Optimal Port Assignments

| Port | Device | MTU | Notes |
|------|--------|-----|-------|
| 1 | M2 Ultra (en0) | 9000 | Primary workstation |
| 2 | HP-OMEN | 9000 | Windows workstation |
| 3 | NAS / 12TB | 9000 | Storage array |
| 4 | Parallels Host | 9000 | VM bridge |
| 5-8 | Available | 9000 | Future expansion |
| SFP1 | Uplink (optional) | 9000 | Fiber if available |
| SFP2 | Uplink (optional) | 9000 | Redundancy |

---

## 4. VLAN Configuration (Optional)

### Create VLANs for segmentation
- **VLAN 10:** Management (switch, router)
- **VLAN 20:** Workstations (Macs, PCs)
- **VLAN 30:** Storage (NAS, backups)
- **VLAN 40:** VMs (Parallels guests)

### Steps
1. Navigate: `VLAN` → `802.1Q VLAN`
2. Create VLANs with IDs and names
3. Assign ports as Tagged/Untagged
4. Save configuration

---

## 5. Spanning Tree & Link Aggregation

### Enable Spanning Tree
1. Navigate: `L2 Features` → `Spanning Tree` → `STP Global Settings`
2. Enable STP (RSTP preferred for fast convergence)
3. Save

### Link Aggregation (LACP)
1. Navigate: `L2 Features` → `Link Aggregation`
2. Create group with multiple ports
3. Enable LACP
4. Save

---

## 6. Verification Commands (macOS)

```bash
# Check MTU on Mac
networksetup -getMTU Ethernet
networksetup -getMTU 'Thunderbolt Bridge'
ifconfig en0 | grep mtu

# Test jumbo path (no fragmentation)
ping -D -s 8972 10.90.90.90

# Test to NAS
ping -D -s 8972 <NAS_IP>

# Verify link speed
networksetup -getMedia Ethernet
```

---

## 7. Troubleshooting

### Jumbo Frames Not Working
- Verify **every hop** supports MTU 9000+
- Check NIC driver settings
- Disable flow control if causing issues
- Reboot switch after changes

### Slow Throughput
- Check for duplex mismatch
- Verify no packet errors: `Port` → `Port Statistics`
- Ensure consistent MTU across path

### Firmware Upgrade Fails
- Use different browser (Chrome recommended)
- Clear browser cache
- Try direct Ethernet connection to switch
- Reset switch to factory if needed: `Tools` → `Reset`

---

## 8. Backup Configuration

```bash
# In switch UI:
# Navigate: Tools → Configuration File Backup
# Download and save .cfg file

# Recommended naming:
# DGS-1210-10_config_YYYYMMDD.cfg
```

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Switch IP | `10.90.90.90` |
| Subnet | `255.255.255.0` |
| Jumbo Frame | `9216` bytes |
| Default Login | `admin` / (blank) |
| Firmware Source | support.dlink.com |

---

**Note:** D-Link has moved the DGS-1210-10 to legacy status. Consider upgrading to a newer model (DGS-1210-10/ME or DGS-1210-10MP) for continued firmware support.
