#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   📊 UNIFIED PERFORMANCE MONITORING & METRICS DASHBOARD                   ║
║                                                                           ║
║   Real-time cluster metrics (latency, throughput, CPU, memory)            ║
║   gRPC call tracing and profiling                                         ║
║   File sync performance (upload/download rates)                           ║
║   Task execution timing and success rates                                 ║
║   Prometheus-compatible metrics export                                    ║
║   JSON REST API for dashboard integration                                 ║
║   Performance optimization recommendations                                ║
║   Bandwidth throttling management                                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from collections import deque
import time

# ═══════════════════════════════════════════════════════════════════════════
# METRICS MODELS
# ═══════════════════════════════════════════════════════════════════════════

class MetricType(Enum):
    COUNTER = "counter"       # Monotonically increasing
    GAUGE = "gauge"           # Can go up/down
    HISTOGRAM = "histogram"   # Distribution of values
    TIMER = "timer"           # Duration measurements

@dataclass
class MetricSample:
    """Single metric sample"""
    timestamp: datetime
    value: float
    labels: Dict[str, str] = field(default_factory=dict)

@dataclass
class Metric:
    """Time-series metric container"""
    name: str
    metric_type: MetricType
    help_text: str
    unit: str = "unit"
    samples: deque = field(default_factory=lambda: deque(maxlen=10000))  # Keep last 10k samples
    
    def add_sample(self, value: float, labels: Dict[str, str] = None) -> None:
        """Add new sample to metric"""
        self.samples.append(MetricSample(
            timestamp=datetime.now(),
            value=value,
            labels=labels or {}
        ))
    
    def get_recent(self, seconds: int = 60) -> List[float]:
        """Get samples from last N seconds"""
        cutoff = datetime.now() - timedelta(seconds=seconds)
        return [s.value for s in self.samples if s.timestamp >= cutoff]
    
    def get_stats(self, seconds: int = 60) -> Dict:
        """Get statistics for recent samples"""
        recent = self.get_recent(seconds)
        if not recent:
            return {}
        
        return {
            "count": len(recent),
            "min": min(recent),
            "max": max(recent),
            "mean": sum(recent) / len(recent),
            "sum": sum(recent),
            "p50": sorted(recent)[len(recent) // 2],
            "p95": sorted(recent)[int(len(recent) * 0.95)],
            "p99": sorted(recent)[int(len(recent) * 0.99)]
        }

# ═══════════════════════════════════════════════════════════════════════════
# gRPC CALL METRICS
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class gRPCCallMetrics:
    """Metrics for gRPC method call"""
    method_name: str
    request_count: int = 0
    error_count: int = 0
    latencies_ms: deque = field(default_factory=lambda: deque(maxlen=1000))
    bytes_sent: int = 0
    bytes_received: int = 0
    first_call_time: Optional[datetime] = None
    last_call_time: Optional[datetime] = None
    
    def record_call(self, latency_ms: float, bytes_in: int, bytes_out: int) -> None:
        """Record successful gRPC call"""
        self.request_count += 1
        self.latencies_ms.append(latency_ms)
        self.bytes_sent += bytes_out
        self.bytes_received += bytes_in
        
        now = datetime.now()
        if not self.first_call_time:
            self.first_call_time = now
        self.last_call_time = now
    
    def record_error(self) -> None:
        """Record failed gRPC call"""
        self.error_count += 1
    
    def get_stats(self) -> Dict:
        """Get method statistics"""
        if not self.latencies_ms:
            return {}
        
        latencies = list(self.latencies_ms)
        
        return {
            "request_count": self.request_count,
            "error_count": self.error_count,
            "error_rate": self.error_count / self.request_count if self.request_count > 0 else 0,
            "latency_ms": {
                "min": min(latencies),
                "max": max(latencies),
                "mean": sum(latencies) / len(latencies),
                "p50": sorted(latencies)[len(latencies) // 2],
                "p95": sorted(latencies)[int(len(latencies) * 0.95)],
                "p99": sorted(latencies)[int(len(latencies) * 0.99)]
            },
            "throughput": {
                "bytes_sent": self.bytes_sent,
                "bytes_received": self.bytes_received,
                "calls_per_second": self.request_count / max(1, (datetime.now() - self.first_call_time).total_seconds()) if self.first_call_time else 0
            }
        }

# ═══════════════════════════════════════════════════════════════════════════
# FILE SYNC METRICS
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class FileSyncMetrics:
    """Metrics for file synchronization"""
    local_path: str
    remote_host: str
    
    files_uploaded: int = 0
    files_downloaded: int = 0
    files_deleted: int = 0
    files_failed: int = 0
    
    bytes_uploaded: int = 0
    bytes_downloaded: int = 0
    
    upload_times_ms: deque = field(default_factory=lambda: deque(maxlen=1000))
    download_times_ms: deque = field(default_factory=lambda: deque(maxlen=1000))
    
    conflicts_resolved: int = 0
    conflicts_pending: int = 0
    
    last_sync_time: Optional[datetime] = None
    
    def record_upload(self, size_bytes: int, time_ms: float) -> None:
        """Record successful file upload"""
        self.files_uploaded += 1
        self.bytes_uploaded += size_bytes
        self.upload_times_ms.append(time_ms)
        self.last_sync_time = datetime.now()
    
    def record_download(self, size_bytes: int, time_ms: float) -> None:
        """Record successful file download"""
        self.files_downloaded += 1
        self.bytes_downloaded += size_bytes
        self.download_times_ms.append(time_ms)
        self.last_sync_time = datetime.now()
    
    def get_stats(self) -> Dict:
        """Get file sync statistics"""
        return {
            "files": {
                "uploaded": self.files_uploaded,
                "downloaded": self.files_downloaded,
                "deleted": self.files_deleted,
                "failed": self.files_failed
            },
            "bytes": {
                "uploaded": self.bytes_uploaded,
                "downloaded": self.bytes_downloaded,
                "total_transferred": self.bytes_uploaded + self.bytes_downloaded
            },
            "upload_times_ms": {
                "samples": len(self.upload_times_ms),
                "mean": sum(self.upload_times_ms) / len(self.upload_times_ms) if self.upload_times_ms else 0,
                "p95": sorted(self.upload_times_ms)[int(len(self.upload_times_ms) * 0.95)] if self.upload_times_ms else 0
            },
            "download_times_ms": {
                "samples": len(self.download_times_ms),
                "mean": sum(self.download_times_ms) / len(self.download_times_ms) if self.download_times_ms else 0,
                "p95": sorted(self.download_times_ms)[int(len(self.download_times_ms) * 0.95)] if self.download_times_ms else 0
            },
            "conflicts": {
                "resolved": self.conflicts_resolved,
                "pending": self.conflicts_pending
            },
            "last_sync": self.last_sync_time.isoformat() if self.last_sync_time else None
        }

# ═══════════════════════════════════════════════════════════════════════════
# SYSTEM METRICS
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class SystemMetrics:
    """Node system resource metrics"""
    node_name: str
    
    cpu_percent: deque = field(default_factory=lambda: deque(maxlen=600))      # Last 10 mins @ 1/sec
    memory_percent: deque = field(default_factory=lambda: deque(maxlen=600))
    memory_bytes: deque = field(default_factory=lambda: deque(maxlen=600))
    
    disk_percent: Dict[str, deque] = field(default_factory=dict)
    disk_bytes: Dict[str, deque] = field(default_factory=dict)
    
    network_bytes_in: deque = field(default_factory=lambda: deque(maxlen=300))
    network_bytes_out: deque = field(default_factory=lambda: deque(maxlen=300))
    
    last_update: Optional[datetime] = None
    
    def record_cpu(self, cpu_percent: float) -> None:
        """Record CPU usage"""
        self.cpu_percent.append(cpu_percent)
        self.last_update = datetime.now()
    
    def record_memory(self, memory_percent: float, memory_bytes: int) -> None:
        """Record memory usage"""
        self.memory_percent.append(memory_percent)
        self.memory_bytes.append(memory_bytes)
        self.last_update = datetime.now()
    
    def record_disk(self, mount: str, percent: float, bytes_free: int) -> None:
        """Record disk usage"""
        if mount not in self.disk_percent:
            self.disk_percent[mount] = deque(maxlen=600)
            self.disk_bytes[mount] = deque(maxlen=600)
        
        self.disk_percent[mount].append(percent)
        self.disk_bytes[mount].append(bytes_free)
        self.last_update = datetime.now()
    
    def record_network(self, bytes_in: int, bytes_out: int) -> None:
        """Record network I/O"""
        self.network_bytes_in.append(bytes_in)
        self.network_bytes_out.append(bytes_out)
        self.last_update = datetime.now()
    
    def get_stats(self) -> Dict:
        """Get system statistics"""
        cpu = list(self.cpu_percent)
        memory = list(self.memory_percent)
        
        return {
            "cpu": {
                "current": cpu[-1] if cpu else 0,
                "mean": sum(cpu) / len(cpu) if cpu else 0,
                "max": max(cpu) if cpu else 0,
                "trend": "up" if (len(cpu) > 1 and cpu[-1] > cpu[0]) else "stable"
            },
            "memory": {
                "percent": memory[-1] if memory else 0,
                "bytes": list(self.memory_bytes)[-1] if self.memory_bytes else 0,
                "mean_percent": sum(memory) / len(memory) if memory else 0
            },
            "disk": {
                mount: {
                    "percent": list(self.disk_percent[mount])[-1] if self.disk_percent[mount] else 0,
                    "free_bytes": list(self.disk_bytes[mount])[-1] if self.disk_bytes[mount] else 0
                }
                for mount in self.disk_percent.keys()
            },
            "network": {
                "bytes_in": list(self.network_bytes_in)[-1] if self.network_bytes_in else 0,
                "bytes_out": list(self.network_bytes_out)[-1] if self.network_bytes_out else 0
            },
            "last_update": self.last_update.isoformat() if self.last_update else None
        }

# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED METRICS COLLECTOR
# ═══════════════════════════════════════════════════════════════════════════

class UnifiedMetricsCollector:
    """Collect and aggregate metrics across cluster"""
    
    def __init__(self, cluster_name: str = "NOIZYLAB"):
        self.cluster_name = cluster_name
        self.logger = logging.getLogger("MetricsCollector")
        
        # gRPC metrics by method
        self.grpc_metrics: Dict[str, gRPCCallMetrics] = {}
        
        # File sync metrics
        self.file_sync_metrics: Dict[str, FileSyncMetrics] = {}
        
        # System metrics per node
        self.system_metrics: Dict[str, SystemMetrics] = {}
        
        # Custom metrics
        self.custom_metrics: Dict[str, Metric] = {}
        
        self.start_time = datetime.now()
    
    # ─────────────────────────────────────────────────────────────────────
    # gRPC Metrics API
    # ─────────────────────────────────────────────────────────────────────
    
    def get_grpc_metrics(self, method_name: str) -> gRPCCallMetrics:
        """Get or create gRPC metrics for method"""
        if method_name not in self.grpc_metrics:
            self.grpc_metrics[method_name] = gRPCCallMetrics(method_name)
        return self.grpc_metrics[method_name]
    
    def record_grpc_call(
        self,
        method_name: str,
        latency_ms: float,
        bytes_in: int,
        bytes_out: int,
        success: bool
    ) -> None:
        """Record gRPC method call"""
        metrics = self.get_grpc_metrics(method_name)
        
        if success:
            metrics.record_call(latency_ms, bytes_in, bytes_out)
        else:
            metrics.record_error()
    
    def get_grpc_summary(self) -> Dict:
        """Get gRPC metrics summary"""
        return {
            method_name: metrics.get_stats()
            for method_name, metrics in self.grpc_metrics.items()
        }
    
    # ─────────────────────────────────────────────────────────────────────
    # File Sync Metrics API
    # ─────────────────────────────────────────────────────────────────────
    
    def get_file_sync_metrics(self, local_path: str, remote_host: str) -> FileSyncMetrics:
        """Get or create file sync metrics"""
        key = f"{local_path}@{remote_host}"
        if key not in self.file_sync_metrics:
            self.file_sync_metrics[key] = FileSyncMetrics(local_path, remote_host)
        return self.file_sync_metrics[key]
    
    def get_file_sync_summary(self) -> Dict:
        """Get file sync metrics summary"""
        return {
            key: metrics.get_stats()
            for key, metrics in self.file_sync_metrics.items()
        }
    
    # ─────────────────────────────────────────────────────────────────────
    # System Metrics API
    # ─────────────────────────────────────────────────────────────────────
    
    def get_system_metrics(self, node_name: str) -> SystemMetrics:
        """Get or create system metrics for node"""
        if node_name not in self.system_metrics:
            self.system_metrics[node_name] = SystemMetrics(node_name)
        return self.system_metrics[node_name]
    
    def get_system_summary(self) -> Dict:
        """Get system metrics summary"""
        return {
            node_name: metrics.get_stats()
            for node_name, metrics in self.system_metrics.items()
        }
    
    # ─────────────────────────────────────────────────────────────────────
    # Cluster Health
    # ─────────────────────────────────────────────────────────────────────
    
    def get_cluster_health(self) -> Dict:
        """Comprehensive cluster health status"""
        uptime = datetime.now() - self.start_time
        
        return {
            "cluster": self.cluster_name,
            "uptime_seconds": uptime.total_seconds(),
            "timestamp": datetime.now().isoformat(),
            
            "nodes": {
                node_name: {
                    "healthy": metrics.last_update and (datetime.now() - metrics.last_update).total_seconds() < 30,
                    "cpu": metrics.cpu_percent[-1] if metrics.cpu_percent else 0,
                    "memory_gb": (metrics.memory_bytes[-1] if metrics.memory_bytes else 0) / (1024 ** 3)
                }
                for node_name, metrics in self.system_metrics.items()
            },
            
            "grpc": {
                "total_calls": sum(m.request_count for m in self.grpc_metrics.values()),
                "total_errors": sum(m.error_count for m in self.grpc_metrics.values()),
                "error_rate": sum(m.error_count for m in self.grpc_metrics.values()) / max(1, sum(m.request_count for m in self.grpc_metrics.values()))
            },
            
            "file_sync": {
                "total_files": sum(m.files_uploaded + m.files_downloaded for m in self.file_sync_metrics.values()),
                "total_bytes": sum(m.bytes_uploaded + m.bytes_downloaded for m in self.file_sync_metrics.values()),
                "conflicts_pending": sum(m.conflicts_pending for m in self.file_sync_metrics.values())
            }
        }
    
    # ─────────────────────────────────────────────────────────────────────
    # Export (Prometheus format)
    # ─────────────────────────────────────────────────────────────────────
    
    def export_prometheus(self) -> str:
        """Export metrics in Prometheus format"""
        lines = [
            "# HELP noizylab_cluster Cluster health and performance",
            "# TYPE noizylab_cluster gauge",
        ]
        
        # gRPC metrics
        for method_name, metrics in self.grpc_metrics.items():
            lines.append(f'grpc_calls_total{{method="{method_name}"}} {metrics.request_count}')
            lines.append(f'grpc_errors_total{{method="{method_name}"}} {metrics.error_count}')
            
            if metrics.latencies_ms:
                latencies = list(metrics.latencies_ms)
                mean = sum(latencies) / len(latencies)
                lines.append(f'grpc_latency_ms{{method="{method_name}",quantile="0.5"}} {sorted(latencies)[len(latencies)//2]}')
                lines.append(f'grpc_latency_ms{{method="{method_name}",quantile="0.95"}} {sorted(latencies)[int(len(latencies)*0.95)]}')
                lines.append(f'grpc_latency_ms{{method="{method_name}",quantile="0.99"}} {sorted(latencies)[int(len(latencies)*0.99)]}')
        
        # System metrics
        for node_name, metrics in self.system_metrics.items():
            if metrics.cpu_percent:
                lines.append(f'system_cpu_percent{{node="{node_name}"}} {list(metrics.cpu_percent)[-1]}')
            if metrics.memory_percent:
                lines.append(f'system_memory_percent{{node="{node_name}"}} {list(metrics.memory_percent)[-1]}')
        
        return "\n".join(lines)
    
    # ─────────────────────────────────────────────────────────────────────
    # Export (JSON API)
    # ─────────────────────────────────────────────────────────────────────
    
    def export_json(self) -> str:
        """Export all metrics as JSON"""
        return json.dumps({
            "cluster": self.cluster_name,
            "timestamp": datetime.now().isoformat(),
            "health": self.get_cluster_health(),
            "grpc": self.get_grpc_summary(),
            "file_sync": self.get_file_sync_summary(),
            "system": self.get_system_summary(),
            "recommendations": self.get_optimization_recommendations()
        }, indent=2)
    
    def get_optimization_recommendations(self) -> List[Dict]:
        """Generate performance optimization recommendations"""
        recommendations = []
        
        # Check gRPC latency
        grpc_summary = self.get_grpc_summary()
        if grpc_summary.get("avg_latency_ms", 0) > 100:
            recommendations.append({
                "component": "gRPC",
                "severity": "warning",
                "message": f"High gRPC latency: {grpc_summary['avg_latency_ms']:.1f}ms. Consider increasing thread pool size.",
                "recommended_action": "Increase gRPC max concurrent streams"
            })
        
        # Check file sync throughput
        file_sync_summary = self.get_file_sync_summary()
        if file_sync_summary.get("avg_upload_mbps", 0) < 10:
            recommendations.append({
                "component": "FileSync",
                "severity": "info",
                "message": f"Low upload throughput: {file_sync_summary['avg_upload_mbps']:.1f} Mbps",
                "recommended_action": "Consider using faster network or compression"
            })
        
        # Check system resources
        system_summary = self.get_system_summary()
        for node, metrics in system_summary.items():
            if metrics.get("avg_cpu", 0) > 80:
                recommendations.append({
                    "component": f"System[{node}]",
                    "severity": "warning",
                    "message": f"High CPU usage: {metrics['avg_cpu']:.1f}%",
                    "recommended_action": "Distribute workload or optimize hot functions"
                })
            
            if metrics.get("avg_memory", 0) > 85:
                recommendations.append({
                    "component": f"System[{node}]",
                    "severity": "warning",
                    "message": f"High memory usage: {metrics['avg_memory']:.1f}%",
                    "recommended_action": "Reduce in-flight operations or increase RAM"
                })
        
        return recommendations

# ═══════════════════════════════════════════════════════════════════════════
# BANDWIDTH THROTTLING MANAGER
# ═══════════════════════════════════════════════════════════════════════════

class BandwidthThrottler:
    """Manage bandwidth throttling for large transfers"""
    
    def __init__(self, max_bandwidth_mbps: float = 100.0):
        self.max_bandwidth_mbps = max_bandwidth_mbps
        self.max_bandwidth_bytes_sec = max_bandwidth_mbps * 1_000_000 / 8
        self.current_usage_bytes = 0
        self.last_reset_time = time.time()
        self.transfer_history = deque(maxlen=100)
        self.logger = logging.getLogger("BandwidthThrottler")
    
    async def acquire_bandwidth(self, bytes_needed: int) -> None:
        """Wait until sufficient bandwidth is available"""
        start_time = time.time()
        
        while True:
            elapsed = time.time() - self.last_reset_time
            if elapsed >= 1.0:
                # Reset window
                self.current_usage_bytes = 0
                self.last_reset_time = time.time()
            
            available = self.max_bandwidth_bytes_sec - self.current_usage_bytes
            
            if available >= bytes_needed:
                self.current_usage_bytes += bytes_needed
                self.transfer_history.append({
                    "timestamp": datetime.now(),
                    "bytes": bytes_needed,
                    "wait_ms": (time.time() - start_time) * 1000
                })
                return
            
            # Wait before retrying
            wait_time = (bytes_needed - available) / self.max_bandwidth_bytes_sec
            await asyncio.sleep(min(wait_time, 0.01))
    
    def get_current_usage_mbps(self) -> float:
        """Get current bandwidth usage in Mbps"""
        return (self.current_usage_bytes * 8) / 1_000_000
    
    def get_stats(self) -> Dict:
        """Get bandwidth throttler statistics"""
        return {
            "max_bandwidth_mbps": self.max_bandwidth_mbps,
            "current_usage_mbps": self.get_current_usage_mbps(),
            "transfers_tracked": len(self.transfer_history),
            "avg_transfer_bytes": sum(t["bytes"] for t in self.transfer_history) / len(self.transfer_history) if self.transfer_history else 0,
            "avg_wait_ms": sum(t["wait_ms"] for t in self.transfer_history) / len(self.transfer_history) if self.transfer_history else 0
        }

# ═══════════════════════════════════════════════════════════════════════════
# PER-COMPONENT LATENCY TRACKER
# ═══════════════════════════════════════════════════════════════════════════

class LatencyTracker:
    """Track latency per component"""
    
    def __init__(self, component_name: str, max_samples: int = 1000):
        self.component_name = component_name
        self.latencies = deque(maxlen=max_samples)
        self.logger = logging.getLogger(f"LatencyTracker[{component_name}]")
    
    async def measure(self, coro):
        """Measure coroutine execution time"""
        start = time.time()
        try:
            result = await coro
            elapsed_ms = (time.time() - start) * 1000
            self.latencies.append(elapsed_ms)
            return result
        except Exception as e:
            elapsed_ms = (time.time() - start) * 1000
            self.latencies.append(elapsed_ms)
            raise
    
    def get_stats(self) -> Dict:
        """Get latency statistics"""
        if not self.latencies:
            return {"component": self.component_name, "samples": 0}
        
        sorted_lat = sorted(self.latencies)
        return {
            "component": self.component_name,
            "samples": len(self.latencies),
            "min_ms": sorted_lat[0],
            "max_ms": sorted_lat[-1],
            "mean_ms": sum(self.latencies) / len(self.latencies),
            "median_ms": sorted_lat[len(sorted_lat) // 2],
            "p95_ms": sorted_lat[int(len(sorted_lat) * 0.95)],
            "p99_ms": sorted_lat[int(len(sorted_lat) * 0.99)]
        }

# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Create collector
    collector = UnifiedMetricsCollector("NOIZYLAB")
    
    # Record some gRPC calls
    for i in range(100):
        collector.record_grpc_call("ExecuteTask", 12.5, 1024, 2048, True)
        collector.record_grpc_call("HealthCheck", 2.1, 256, 512, True)
    
    # Record file sync
    file_sync = collector.get_file_sync_metrics("/Users/m2ultra/sync", "192.168.1.40")
    file_sync.record_upload(1024 * 1024, 523.0)
    file_sync.record_download(512 * 1024, 261.0)
    
    # Record system metrics
    sys_m2 = collector.get_system_metrics("M2-Ultra")
    sys_m2.record_cpu(45.2)
    sys_m2.record_memory(72.5, 144 * 1024 * 1024 * 1024)
    
    sys_hp = collector.get_system_metrics("HP-OMEN")
    sys_hp.record_cpu(68.1)
    sys_hp.record_memory(82.0, 104 * 1024 * 1024 * 1024)
    
    # Print health
    print("🏥 Cluster Health:")
    print(json.dumps(collector.get_cluster_health(), indent=2))
    
    # Print Prometheus metrics
    print("\n📊 Prometheus Metrics:")
    print(collector.export_prometheus())

if __name__ == "__main__":
    asyncio.run(main())
