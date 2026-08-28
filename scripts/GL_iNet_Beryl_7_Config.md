# GL.iNet Beryl 7 Router Configuration Guide (noizymobile)
This document contains the exact configuration profiles, physical setup guidelines, SSIDs, security standards, and captive portal details for the OpenWrt-based **GL.iNet Beryl 7** router in your vehicle.

---

## 1. Hardware Specifications & Physical Setup
* **Power Source:** USB-C Power Delivery (PD) powered directly from the vehicle dashboard/accessory plug. The router boots automatically when the car starts.
* **CPU / Memory:** Quad-core 2.0 GHz CPU with 512 MB RAM (capable of running heavy VPN overhead).
* **WireGuard Speed:** Capable of up to 1.1 Gbps encrypted throughput.
* **WAN Ports:** 
  * Connect the iPhone 15 Pro Max directly to the USB 3.0 port on the Beryl 7 using a USB-C cable for high-speed **5G USB Tethering** backhaul.
  * Optionally, configure Multi-WAN failover to prioritize the tethered cell phone.
* **LAN Ports (Dual 2.5-GbE):**
  * **Port 1 (LAN):** Connected via a physical ethernet cable directly to Michael (MacBook Pro 2012) for ultra-fast VNC/SSH local communication.
  * **Port 2 (LAN):** Available for other wired vehicle telemetry adapters or home lab connection during testing.

---

## 2. SSID Profile #1: `noizymobile` (Private Subnet)
This is the trusted corporate environment for your core devices.

* **WLAN Name (SSID):** `noizymobile`
* **Protocol:** Wi-Fi 7 (802.11be) enabled on the 5GHz/6GHz band.
* **Security:** `WPA3-SAE`
* **Client Isolation:** **Disabled** (Off). *Crucial so that Michael, the iPad cockpit, and the iPhone can communicate locally at raw local speeds without going over the internet.*
* **Overlay Layer:** Tailscale runs directly on the endpoint devices (`Michael`, `Lucy` iPad, `iPhone`) forming a private Tailnet mesh connecting back to the M2 Ultra God Rig (`100.118.84.40`) over the 5G connection.

---

## 3. SSID Profile #2: `RSP_GUEST` (Public Guest Subnet)
This SSID is for passenger internet access. It is completely isolated from your hardware.

* **WLAN Name (SSID):** `RSP_GUEST`
* **Security:** Open (or WPA2 Personal with a simple guest password).
* **Wireless Client Isolation:** **Enabled** (On). *Ensures that passengers cannot scan your local network, ping Michael, access Lucy services, see dashboard dashcam feeds, or interact with other passengers' devices.*
* **WAN Access only:** Subnet rules dictate that clients on this network interface are routed strictly to WAN (Cellular/Internet) and have all routing to local private IP subnets blocked.
* **Tailscale/SSH/Local Storage:** Denied. Port blocks prevent clients on this network from scanning SSH/VNC ports or Tailscale listening ports on your local devices.

---

## 4. Guest Captive Portal & Auto-Timeout Setup
Using the OpenWrt-based GL.iNet admin dashboard:

1. Navigate to **Applications** -> **Captive Portal**.
2. Enable the portal on the **`RSP_GUEST`** interface.
3. Set **Session Timeout** to **30 minutes** (automatically kicks passengers off when the ride ends).
4. Customize the HTML Landing Page:
   * **Title:** `RSP Mobile Hub`
   * **Welcome Message:** `Enjoy high-speed Wi-Fi 7 while you ride.`
   * **Redirect URL:** On authentication, redirect passengers directly to your fish music streaming site:
     `https://fishmusicinc.com` (or your chosen URL).
