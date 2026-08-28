**Storage Tuning — Baseline & Re-Test**

**SMB/NAS Checklist**
- Exclude working volumes from Spotlight indexing.
- Enable AIO and increase `rsize/wsize` on mounts.
- Confirm NAS jumbo frames and switch port MTU.
- Verify link speed/duplex; disable mismatched flow control.

**Improved Speed Test (macOS)**
```
time dd if=/dev/zero of=/Volumes/12TB/speedtest bs=16m count=1024 oflag=direct && \
ls -lh /Volumes/12TB/speedtest && rm /Volumes/12TB/speedtest
```

**Record**
- MB/s, CPU%, I/O wait, network stats; pre/post tuning comparison.