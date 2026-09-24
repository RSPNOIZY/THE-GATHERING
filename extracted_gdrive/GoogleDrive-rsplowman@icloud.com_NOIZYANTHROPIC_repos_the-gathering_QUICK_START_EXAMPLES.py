#!/usr/bin/env python3
"""
🚀 QUICK START: Unified NOIZYLAB Integration Bridge

Usage examples for all integrated systems
"""

import asyncio
from unified_integration_bridge import UnifiedIntegrationBridge, DisplayCodec
from unified_remote_display import UnifiedRemoteDisplay
from unified_performance_metrics import UnifiedMetricsCollector, BandwidthThrottler

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 1: Initialize All Systems
# ═════════════════════════════════════════════════════════════════════════════

async def example_full_integration():
    """Initialize entire unified system"""
    bridge = UnifiedIntegrationBridge(projects_path="./PROJECTS")
    
    # Initialize all subsystems in parallel
    results = await bridge.initialize_all()
    
    # Check initialization status
    for system, success in results.items():
        status = "✅" if success else "❌"
        print(f"{status} {system}")

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 2: Execute Multi-System Workflow
# ═════════════════════════════════════════════════════════════════════════════

async def example_workflow():
    """Execute workflow spanning multiple systems"""
    bridge = UnifiedIntegrationBridge()
    await bridge.initialize_all()
    
    # Define workflow
    workflow = {
        "name": "Damage Analysis Pipeline",
        "steps": [
            {
                "name": "Analyze Damage",
                "component": "repairrob",
                "operation": "analyze_damage",
                "image_path": "/path/to/robot_image.jpg"
            },
            {
                "name": "Extract Audio",
                "component": "audio",
                "operation": "process_audio",
                "audio_data": b"...audio_bytes...",
                "algorithm": "room_simulation"
            },
            {
                "name": "Store Results",
                "component": "ingestion",
                "operation": "ingest_data",
                "data_source": "analysis_results",
                "format": "json"
            }
        ]
    }
    
    # Execute
    result = await bridge.execute_workflow(workflow)
    print(f"✅ Workflow completed in {result['duration_sec']:.2f}s")
    print(bridge.get_health_report())

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 3: Remote Display Streaming
# ═════════════════════════════════════════════════════════════════════════════

async def example_remote_display():
    """Stream screen from M2 to HP-OMEN"""
    display = UnifiedRemoteDisplay("M2-Ultra", codec=DisplayCodec.H265)
    
    # Enumerate displays
    displays = await display.enumerate_displays()
    print(f"Found {len(displays)} displays")
    
    # Start streaming H.265 at 30 FPS
    await display.start_streaming(display_id=0, frame_rate=30, bitrate_kbps=5000)
    
    # Stream for 30 seconds
    for i in range(30):
        await asyncio.sleep(1)
        stats = display.get_stream_stats()
        print(f"[{i:2d}s] {stats['fps']:.1f} FPS, {stats['mbps']:.2f} Mbps")
    
    # Stop streaming
    await display.stop_streaming()

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 4: Window-Specific Sharing
# ═════════════════════════════════════════════════════════════════════════════

async def example_window_sharing():
    """Share specific application window"""
    display = UnifiedRemoteDisplay("M2-Ultra", codec=DisplayCodec.H265)
    
    # List available windows
    windows = await display.enumerate_windows()
    print(f"Available windows: {list(windows.keys())}")
    
    # Share only Chrome window
    await display.start_window_sharing("chrome")
    await display.start_streaming(display_id=0, frame_rate=30, bitrate_kbps=2500)
    
    # Add annotations for collaborative markup
    await display.add_annotation(
        shape="arrow",
        x=500, y=300,
        color="#FF0000",
        duration_sec=5
    )
    
    await asyncio.sleep(10)
    await display.stop_streaming()

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 5: Performance Monitoring
# ═════════════════════════════════════════════════════════════════════════════

async def example_performance_monitoring():
    """Monitor system performance"""
    collector = UnifiedMetricsCollector("NOIZYLAB")
    
    # Record gRPC calls
    for i in range(100):
        collector.record_grpc_call("ExecuteTask", latency_ms=12.5, success=True)
    
    # Monitor bandwidth
    throttler = BandwidthThrottler(max_bandwidth_mbps=100.0)
    
    # Simulate transfer
    transfer_size = 10 * 1024 * 1024  # 10 MB
    await throttler.acquire_bandwidth(transfer_size)
    print(f"Transfer complete, current usage: {throttler.get_current_usage_mbps():.2f} Mbps")
    
    # Get optimization recommendations
    health = collector.get_cluster_health()
    recommendations = collector.get_optimization_recommendations()
    
    print(f"Cluster health: {health['overall_health']:.1f}%")
    for rec in recommendations:
        print(f"  • [{rec['severity']}] {rec['message']}")

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 6: Bandwidth Control
# ═════════════════════════════════════════════════════════════════════════════

async def example_bandwidth_throttling():
    """Control bandwidth usage"""
    # Allow max 50 Mbps
    throttler = BandwidthThrottler(max_bandwidth_mbps=50.0)
    
    # Transfer 100 MB in chunks
    chunk_size = 1 * 1024 * 1024  # 1 MB chunks
    total = 100 * 1024 * 1024  # 100 MB
    chunks = total // chunk_size
    
    print(f"Transferring {total / 1024 / 1024:.0f} MB at max {throttler.max_bandwidth_mbps} Mbps")
    
    for i in range(chunks):
        await throttler.acquire_bandwidth(chunk_size)
        stats = throttler.get_stats()
        print(f"[{i+1:3d}/{chunks}] {stats['current_usage_mbps']:.2f} Mbps")

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 7: File Sync with Conflict Resolution
# ═════════════════════════════════════════════════════════════════════════════

async def example_file_sync():
    """Synchronize files between systems"""
    from unified_file_sync import UnifiedFileSync, ConflictStrategy
    
    file_sync = UnifiedFileSync(
        local_path="/Users/m2ultra/projects",
        remote_host="192.168.1.40",
        remote_path="/home/user/projects",
        conflict_strategy=ConflictStrategy.AI_MERGE
    )
    
    # Start watching and syncing
    await file_sync.start_watching()
    
    # Sync for 60 seconds
    await asyncio.sleep(60)
    
    # Get statistics
    stats = file_sync.get_sync_stats()
    print(f"Synced: {stats['files_synced']} files")
    print(f"Conflicts resolved: {stats['conflicts_resolved']}")
    print(f"Total transferred: {stats['total_bytes_transferred'] / 1024 / 1024:.2f} MB")
    
    await file_sync.stop_watching()

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 8: Secure Transport with Fallback
# ═════════════════════════════════════════════════════════════════════════════

async def example_secure_transport():
    """Establish secure connection with auto-failover"""
    from secure_transport_layer import NetworkResilienceLayer
    
    resilience = NetworkResilienceLayer(
        primary_host="192.168.1.40",
        primary_port=22,
        fallback_hosts=["192.168.1.41", "192.168.1.42"],
        vpn_config="/path/to/wireguard.conf"
    )
    
    # Establish connection (tries SSH, then fallback hosts, then VPN)
    success = await resilience.establish_connection()
    
    if success:
        status = resilience.get_connection_status()
        print(f"✅ Connected via {status['current_strategy']}")
        print(f"   Latency: {status['latency_ms']:.1f}ms")
        print(f"   Packet loss: {status['packet_loss']:.2f}%")
    else:
        print("❌ All connection strategies failed")

# ═════════════════════════════════════════════════════════════════════════════
# EXAMPLE 9: Authentication & Credentials
# ═════════════════════════════════════════════════════════════════════════════

async def example_authentication():
    """Manage credentials and authentication"""
    from unified_auth_system import UnifiedAuthManager
    
    auth = UnifiedAuthManager()
    
    # Generate API key
    api_key = auth.generate_api_key(
        service_name="repairrob-api",
        permissions=["read", "write"]
    )
    print(f"Generated API key: {api_key.key_id}")
    
    # Validate key
    is_valid = auth.validate_key(api_key.key_id, api_key.secret)
    print(f"Key valid: {is_valid}")
    
    # Create session token
    token = auth.create_session_token(user_id="m2-ultra")
    print(f"Session token: {token[:20]}...")
    
    # Get credential store (encrypted)
    store = auth.get_credential_store()
    await store.store_credential("github", "token", "ghp_xxxx")
    cred = await store.get_credential("github", "token")
    print("✅ Stored and retrieved credential")

# ═════════════════════════════════════════════════════════════════════════════
# MAIN: Run Examples
# ═════════════════════════════════════════════════════════════════════════════

async def main():
    """Run all examples"""
    print("=" * 80)
    print("🚀 NOIZYLAB UNIFIED INTEGRATION BRIDGE - QUICK START EXAMPLES")
    print("=" * 80)
    print()
    
    examples = [
        ("Initialize All Systems", example_full_integration),
        ("Execute Multi-System Workflow", example_workflow),
        ("Remote Display Streaming", example_remote_display),
        ("Window-Specific Sharing", example_window_sharing),
        ("Performance Monitoring", example_performance_monitoring),
        ("Bandwidth Control", example_bandwidth_throttling),
        ("File Synchronization", example_file_sync),
        ("Secure Transport", example_secure_transport),
        ("Authentication", example_authentication)
    ]
    
    print("Available examples:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"  {i}. {name}")
    print()
    print("Run individual examples by calling their async functions:")
    print("  await example_full_integration()")
    print("  await example_workflow()")
    print("  await example_remote_display()")
    print()

if __name__ == "__main__":
    asyncio.run(main())
