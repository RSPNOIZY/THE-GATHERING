#!/bin/bash

echo "⚡ Optimizing Apple Silicon Unified Memory Allocation for MLX..."

# Override the default system-wide VRAM allocation limit per process
# Configures the breakpoint cap to allow massive allocations (up to ~160GB+)
sudo sysctl iogpu.wired_mem_breakpoint_cap=171798691840

echo "✅ Memory override applied successfully."
echo "Note: To make this persistent across reboots, add 'iogpu.wired_mem_breakpoint_cap=171798691840' to /etc/sysctl.conf"
