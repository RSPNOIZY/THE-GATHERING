#!/usr/bin/env bash
set -euo pipefail

log() { printf "[switch] %s\n" "$*"; }

remove_alias() {
  local iface=${1:-en0}
  local alias_ip=${2:-10.90.90.71}
  log "Removing alias $alias_ip from $iface (sudo required)"
  if sudo ifconfig "$iface" -alias "$alias_ip"; then
    log "Alias removed from $iface"
  else
    log "No alias present on $iface or removal failed"
  fi
}

check_switch() {
  local ip="$1"
  log "Pinging $ip"
  ping -c 3 "$ip" || true
  log "Opening web UI for $ip"
  if command -v open >/dev/null 2>&1; then
    open "http://$ip" || true
  else
    log "Open not available; visit http://$ip in your browser"
  fi
}

throughput_test() {
  local vol_path=${1:-/Volumes/12TB}
  local test_file="$vol_path/speedtest"
  log "Write test to $test_file (2 GB)"
  time dd if=/dev/zero of="$test_file" bs=1m count=2000
  ls -lh "$test_file"
  log "Read test from $test_file"
  time dd if="$test_file" of=/dev/null bs=4m
  log "Cleaning up"
  rm -f "$test_file"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [args]

Commands:
  alias-remove [iface en0] [ip 10.90.90.71]  Remove temporary IP alias
  check        <ip>                            Ping and open web UI for IP
  throughput   [volume_path /Volumes/12TB]     Run write/read throughput test

Examples:
  $(basename "$0") alias-remove
  $(basename "$0") check 10.0.0.90
  $(basename "$0") throughput /Volumes/12TB
EOF
}

cmd=${1:-}
case "$cmd" in
  alias-remove)
    shift || true
    remove_alias "${1:-en0}" "${2:-10.90.90.71}"
    ;;
  check)
    shift || true
    if [[ $# -lt 1 ]]; then usage; exit 1; fi
    check_switch "$1"
    ;;
  throughput)
    shift || true
    throughput_test "${1:-/Volumes/12TB}"
    ;;
  -h|--help|help|"")
    usage
    ;;
  *)
    log "Unknown command: $cmd";
    usage; exit 1
    ;;
esac
