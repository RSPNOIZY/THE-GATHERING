#!/bin/zsh

STAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUT="$HOME/Desktop/USB_AUDIO_DIAG_$STAMP"
mkdir -p "$OUT"

echo "=== USB/AUDIO EMERGENCY RESET + SNAPSHOT ==="
echo "Saving diagnostics to: $OUT"
echo

echo "[1/7] Capturing USB tree..."
system_profiler SPUSBDataType > "$OUT/usb_tree.txt" 2>&1

echo "[2/7] Capturing audio devices..."
system_profiler SPAudioDataType > "$OUT/audio_devices.txt" 2>&1

echo "[3/7] Capturing recent USB/HID/Audio logs..."
log show --last 30m --style compact \
  --predicate 'eventMessage CONTAINS[c] "USB" OR eventMessage CONTAINS[c] "HID" OR eventMessage CONTAINS[c] "Audio" OR process == "coreaudiod" OR process == "bluetoothd"' \
  > "$OUT/recent_usb_audio_hid_logs.txt" 2>&1

echo "[4/7] Restarting CoreAudio..."
sudo killall -9 coreaudiod 2>/dev/null

sleep 3

echo "[5/7] Restarting USB daemon..."
sudo killall -9 usbd 2>/dev/null

sleep 3

echo "[6/7] Restarting HID service..."
sudo launchctl kickstart -k system/com.apple.hidd 2>/dev/null

sleep 3

echo "[7/7] Optional Bluetooth daemon refresh..."
sudo killall -9 bluetoothd 2>/dev/null

echo
echo "=== DONE ==="
echo "Diagnostics saved here:"
echo "$OUT"
echo
echo "If audio/USB is still freaking out, unplug hubs/docks and rerun:"
echo "~/usb-audio-reset.sh"
