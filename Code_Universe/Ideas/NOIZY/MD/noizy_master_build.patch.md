# Master Build Patch — Replace AU Net Phase with NOIZYNET

Apply this replacement to `~/noizy_master_build.sh` on the machine where the master build lives.

```bash
do_aunet_wire() {
    hr; log "8/9 — NOIZYNET DEPLOY + AU NET"; hr
    
    # Deploy daemon + CLI
    ./noizynet_deploy.sh
    
    log ""
    log "NOIZYNET LIVE: ws://10.90.90.10:9699/live"
    log "CLI: noizynet health | noizynet chain"
    log ""
    log "Manual Logic wiring (one-time):"
    log "  Micky-P AU Net Send → NOIZYNET:97100"
    log "  GOD AU Net Receive ← NOIZYNET:97100"
    log "  iPad: Logic Remote auto-connects"
}
```

## Verification

After patching:

1. `./noizy_master_build.sh all`
2. `ssh rsp@10.90.90.10 'noizynet health'`
3. Expect: `SIGNAL_CHAIN_LIVE`
