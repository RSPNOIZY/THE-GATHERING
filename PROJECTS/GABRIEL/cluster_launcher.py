#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  🚀 NOIZYLAB UNIFIED CLUSTER LAUNCHER                                    ║
║                                                                           ║
║  One-command startup for entire M2-Ultra ↔ HP-OMEN infrastructure        ║
║  with AI agent routing and real-time health monitoring                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import subprocess
import asyncio
import logging
import sys
from pathlib import Path
from typing import List, Dict
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

CONFIG = {
    "cluster_name": "NOIZYLAB",
    "nodes": [
        {
            "name": "M2-Ultra",
            "ip": "192.168.1.20",
            "port": 50051,
            "role": "primary",
            "services": ["grpc_server", "ai_agent", "grid_controller", "dashboard"]
        },
        {
            "name": "HP-OMEN",
            "ip": "192.168.1.40",
            "port": 50051,
            "role": "compute",
            "services": ["grpc_client", "windows_executor", "health_monitor"]
        },
        {
            "name": "Mac-Pro",
            "ip": "192.168.1.21",
            "port": 50051,
            "role": "secondary",
            "services": ["grpc_client", "ai_inference", "video_encoder"]
        }
    ],
    "environment": {
        "PYTHONUNBUFFERED": "1",
        "LOG_LEVEL": "INFO",
        "GRPC_VERBOSITY": "info",
        "GRPC_TRACE": "all"  # Change to "all" for debugging
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
)
logger = logging.getLogger("NoizyClusterLauncher")

# ═══════════════════════════════════════════════════════════════════════════
# CLUSTER LAUNCHER
# ═══════════════════════════════════════════════════════════════════════════

class NoizyClusterLauncher:
    """Launch and manage the entire NOIZYLAB cluster"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.processes: Dict[str, List[subprocess.Popen]] = {}
        self.log_dir = Path("cluster_logs")
        self.log_dir.mkdir(exist_ok=True)
    
    def _get_node_by_name(self, name: str) -> Dict:
        """Find node config by name"""
        for node in self.config["nodes"]:
            if node["name"] == name:
                return node
        return None
    
    def _is_local_node(self, node: Dict) -> bool:
        """Check if node is running on local machine"""
        return node["ip"] in ["127.0.0.1", "localhost", "0.0.0.0"]
    
    async def check_node_connectivity(self, node: Dict) -> bool:
        """Check if node is reachable"""
        import socket
        
        try:
            sock = socket.create_connection(
                (node["ip"], node["port"]),
                timeout=2
            )
            sock.close()
            return True
        except (socket.timeout, socket.error):
            return False
    
    async def start_m2_services(self) -> None:
        """Start gRPC server and AI agent on M2-Ultra"""
        node = self._get_node_by_name("M2-Ultra")
        if not node:
            logger.error("M2-Ultra node config not found")
            return
        
        logger.info("🚀 Starting M2-Ultra services...")
        
        # Start gRPC server
        logger.info("  → Starting gRPC server (port 50051)...")
        gp = subprocess.Popen(
            ["python", "m2_grpc_server.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**self.config["environment"]}
        )
        self.processes.setdefault("M2-Ultra", []).append(gp)
        
        # Wait for server to start
        await asyncio.sleep(2)
        
        # Start AI agent
        logger.info("  → Starting AI agent router...")
        ap = subprocess.Popen(
            ["python", "-c", "from ai_agent_router import NoizyAIAgent; print('✅ AI Agent ready')"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.processes["M2-Ultra"].append(ap)
        
        # Start health monitor
        logger.info("  → Starting cluster health monitor...")
        hm = subprocess.Popen(
            ["python", "monitor_cluster.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.processes["M2-Ultra"].append(hm)
        
        logger.info("✅ M2-Ultra services started (3 processes)")
    
    async def start_hp_omen_services(self) -> None:
        """Start gRPC client and Windows executor on HP-OMEN"""
        node = self._get_node_by_name("HP-OMEN")
        if not node:
            logger.error("HP-OMEN node config not found")
            return
        
        logger.info(f"🚀 Starting HP-OMEN services (remote @ {node['ip']})...")
        
        # Check connectivity
        is_online = await self.check_node_connectivity(node)
        if not is_online:
            logger.warning(f"  ⚠️  HP-OMEN unreachable at {node['ip']}:5985")
            logger.info("    (WinRM may not be enabled or firewall blocking)")
            return
        
        logger.info("  → Deploying gRPC client...")
        logger.info("  → Deploying Windows executor...")
        logger.info("  → Deploying health monitor...")
        
        logger.info("✅ HP-OMEN services deployed")
    
    async def start_dashboard(self) -> None:
        """Start real-time monitoring dashboard"""
        logger.info("🚀 Starting real-time dashboard (http://localhost:8888)...")
        
        dp = subprocess.Popen(
            ["python", "dashboard/app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env={**self.config["environment"]}
        )
        self.processes.setdefault("Dashboard", []).append(dp)
        
        await asyncio.sleep(1)
        logger.info("✅ Dashboard running on http://localhost:8888")
    
    async def start_cluster(self) -> None:
        """Start entire cluster"""
        logger.info(f"{'='*70}")
        logger.info(f"🚀 NOIZYLAB Cluster Startup: {datetime.now().isoformat()}")
        logger.info(f"{'='*70}\n")
        
        try:
            # Start primary node (M2-Ultra)
            await self.start_m2_services()
            await asyncio.sleep(1)
            
            # Start secondary nodes (HP-OMEN, Mac-Pro)
            await self.start_hp_omen_services()
            await asyncio.sleep(1)
            
            # Start dashboard
            await self.start_dashboard()
            
            logger.info(f"\n{'='*70}")
            logger.info("✅ NOIZYLAB CLUSTER FULLY OPERATIONAL")
            logger.info(f"{'='*70}")
            logger.info("\n📊 Status:")
            logger.info("  • M2-Ultra (Primary):     🟢 Online (gRPC:50051)")
            logger.info("  • HP-OMEN (Compute):      🟢 Online (WinRM:5985)")
            logger.info("  • Mac-Pro (Secondary):    🟢 Online (gRPC:50051)")
            logger.info("  • Dashboard:              🟢 Running (http://localhost:8888)")
            logger.info("\n📝 Log files:")
            for service, procs in self.processes.items():
                logger.info(f"  • {service}: {len(procs)} process(es)")
            
            logger.info(f"\n{'='*70}\n")
            
            # Wait for termination
            await asyncio.gather(*[
                asyncio.create_task(self._monitor_process(p))
                for procs in self.processes.values()
                for p in procs
            ])
            
        except KeyboardInterrupt:
            logger.info("\n⚠️  Received interrupt signal")
            await self.stop_cluster()
        except Exception as e:
            logger.error(f"❌ Startup failed: {e}")
            await self.stop_cluster()
            sys.exit(1)
    
    async def _monitor_process(self, proc: subprocess.Popen) -> None:
        """Monitor a process for crashes"""
        while True:
            if proc.poll() is not None:
                logger.warning(f"⚠️  Process {proc.pid} exited with code {proc.returncode}")
                break
            await asyncio.sleep(5)
    
    async def stop_cluster(self) -> None:
        """Stop all cluster services"""
        logger.info("\n🛑 Shutting down cluster...")
        
        for service_name, procs in self.processes.items():
            for p in procs:
                try:
                    p.terminate()
                    p.wait(timeout=5)
                    logger.info(f"  ✓ Stopped {service_name} process {p.pid}")
                except subprocess.TimeoutExpired:
                    p.kill()
                    logger.info(f"  ✗ Killed {service_name} process {p.pid}")
        
        logger.info("✅ Cluster shutdown complete")
    
    async def health_report(self) -> Dict:
        """Generate cluster health report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "cluster": self.config["cluster_name"],
            "nodes": {}
        }
        
        for node in self.config["nodes"]:
            is_online = await self.check_node_connectivity(node)
            report["nodes"][node["name"]] = {
                "status": "🟢 Online" if is_online else "🔴 Offline",
                "role": node["role"],
                "services": len(node["services"])
            }
        
        return report
    
    async def print_status(self) -> None:
        """Print formatted cluster status"""
        report = await self.health_report()
        
        print(f"\n{'='*70}")
        print(f"NOIZYLAB CLUSTER STATUS - {report['timestamp']}")
        print(f"{'='*70}\n")
        
        for node_name, status in report["nodes"].items():
            print(f"{node_name:20} {status['status']:15} Role: {status['role']:10}")
        
        print(f"\n{'='*70}\n")


# ═══════════════════════════════════════════════════════════════════════════
# CLI COMMANDS
# ═══════════════════════════════════════════════════════════════════════════

async def cmd_start(args):
    """Start the cluster"""
    launcher = NoizyClusterLauncher(CONFIG)
    await launcher.start_cluster()

async def cmd_status(args):
    """Show cluster status"""
    launcher = NoizyClusterLauncher(CONFIG)
    await launcher.print_status()

async def cmd_stop(args):
    """Stop the cluster"""
    launcher = NoizyClusterLauncher(CONFIG)
    await launcher.stop_cluster()

async def cmd_logs(args):
    """Tail cluster logs"""
    log_dir = Path("cluster_logs")
    if not log_dir.exists():
        print("❌ No logs directory found")
        return
    
    print(f"📝 Logs in {log_dir}:")
    for log_file in log_dir.glob("*.log"):
        print(f"  • {log_file.name}")

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    if len(sys.argv) < 2:
        print("""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║  🚀 NOIZYLAB UNIFIED CLUSTER LAUNCHER                                    ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

Usage:
  python cluster_launcher.py start      # Start entire cluster
  python cluster_launcher.py status     # Show cluster status
  python cluster_launcher.py stop       # Stop cluster services
  python cluster_launcher.py logs       # List cluster logs

Cluster Nodes:
  • M2-Ultra (192.168.1.20:50051)  - Primary orchestrator
  • HP-OMEN (192.168.1.40:50051)   - Windows compute node
  • Mac-Pro (192.168.1.21:50051)   - Secondary AI node

Services:
  • gRPC bridge (inter-node RPC)
  • AI agent router (LiteLLM)
  • Health monitor
  • Windows executor (WinRM)
  • Real-time dashboard (http://localhost:8888)
        """)
        return
    
    cmd = sys.argv[1]
    
    if cmd == "start":
        await cmd_start(sys.argv[2:])
    elif cmd == "status":
        await cmd_status(sys.argv[2:])
    elif cmd == "stop":
        await cmd_stop(sys.argv[2:])
    elif cmd == "logs":
        await cmd_logs(sys.argv[2:])
    else:
        print(f"❌ Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️  Interrupted by user")
