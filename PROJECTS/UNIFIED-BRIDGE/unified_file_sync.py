#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   🔄 UNIFIED FILE SYNC & CLIPBOARD BRIDGE (M2-ULTRA ↔ HP-OMEN)           ║
║                                                                           ║
║   Real-time bidirectional file synchronization                            ║
║   Shared clipboard (cross-platform)                                       ║
║   Secure SFTP tunneling over SSH                                          ║
║   Smart change detection (inotify/FSEvents)                               ║
║   Conflict resolution with AI decision-making                             ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import os
import asyncio
import hashlib
import logging
from pathlib import Path
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

# File sync libraries
import paramiko
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import pyperclip

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class SyncConfig:
    """File sync configuration"""
    # M2-Ultra
    m2_host: str = "192.168.1.20"
    m2_user: str = "m2ultra"
    m2_ssh_port: int = 22
    m2_sync_root: str = "/Users/m2ultra/NOIZYLAB"
    
    # HP-OMEN (Windows)
    hp_host: str = "192.168.1.40"
    hp_user: str = "admin"
    hp_sftp_port: int = 22  # Via SSH tunneling
    hp_sync_root: str = "C:\\NOIZYLAB"
    
    # Sync settings
    polling_interval: float = 2.0  # seconds
    max_file_size_mb: int = 1000
    exclude_patterns: List[str] = None
    include_patterns: List[str] = None
    conflict_resolver: str = "ai"  # "ai", "newer", "larger", "ask"
    
    def __post_init__(self):
        if self.exclude_patterns is None:
            self.exclude_patterns = [".git", "__pycache__", ".DS_Store", "*.pyc"]
        if self.include_patterns is None:
            self.include_patterns = ["*.py", "*.md", "*.txt", "*.json", "*.proto"]

# ═══════════════════════════════════════════════════════════════════════════
# FILE CHANGE DETECTION
# ═══════════════════════════════════════════════════════════════════════════

class FileChangeType(Enum):
    CREATED = "created"
    MODIFIED = "modified"
    DELETED = "deleted"
    MOVED = "moved"

@dataclass
class FileChange:
    """Represents a file change"""
    change_type: FileChangeType
    local_path: str
    remote_path: str
    timestamp: datetime
    size: int = 0
    checksum: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "change_type": self.change_type.value,
            "local_path": self.local_path,
            "remote_path": self.remote_path,
            "timestamp": self.timestamp.isoformat(),
            "size": self.size,
            "checksum": self.checksum
        }

class LocalFileWatcher(FileSystemEventHandler):
    """Watch for local file changes using FSEvents (macOS) or inotify (Linux/Windows)"""
    
    def __init__(self, sync_root: str, config: SyncConfig):
        self.sync_root = Path(sync_root)
        self.config = config
        self.changes: asyncio.Queue = asyncio.Queue()
        self.logger = logging.getLogger("FileWatcher")
    
    def should_sync(self, path: str) -> bool:
        """Check if file should be synced based on include/exclude patterns"""
        rel_path = Path(path).relative_to(self.sync_root)
        
        # Check exclude patterns
        for pattern in self.config.exclude_patterns:
            if pattern in str(rel_path):
                return False
        
        # Check include patterns if specified
        if self.config.include_patterns:
            for pattern in self.config.include_patterns:
                if pattern.endswith("*") or any(pattern in str(rel_path) for p in [pattern]):
                    return True
            return False
        
        return True
    
    def _get_file_checksum(self, path: str) -> str:
        """Calculate MD5 checksum of file"""
        try:
            hash_md5 = hashlib.md5()
            with open(path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            self.logger.error(f"Error calculating checksum for {path}: {e}")
            return ""
    
    def on_created(self, event):
        if event.is_directory:
            return
        if not self.should_sync(event.src_path):
            return
        
        change = FileChange(
            change_type=FileChangeType.CREATED,
            local_path=event.src_path,
            remote_path=str(Path(event.src_path).relative_to(self.sync_root)),
            timestamp=datetime.now(),
            size=os.path.getsize(event.src_path),
            checksum=self._get_file_checksum(event.src_path)
        )
        self.logger.info(f"📝 File created: {event.src_path}")
        asyncio.run(self.changes.put(change))
    
    def on_modified(self, event):
        if event.is_directory:
            return
        if not self.should_sync(event.src_path):
            return
        
        change = FileChange(
            change_type=FileChangeType.MODIFIED,
            local_path=event.src_path,
            remote_path=str(Path(event.src_path).relative_to(self.sync_root)),
            timestamp=datetime.now(),
            size=os.path.getsize(event.src_path),
            checksum=self._get_file_checksum(event.src_path)
        )
        self.logger.info(f"✏️  File modified: {event.src_path}")
        asyncio.run(self.changes.put(change))
    
    def on_deleted(self, event):
        if not self.should_sync(event.src_path):
            return
        
        change = FileChange(
            change_type=FileChangeType.DELETED,
            local_path=event.src_path,
            remote_path=str(Path(event.src_path).relative_to(self.sync_root)),
            timestamp=datetime.now()
        )
        self.logger.info(f"🗑️  File deleted: {event.src_path}")
        asyncio.run(self.changes.put(change))

# ═══════════════════════════════════════════════════════════════════════════
# SFTP SYNC ENGINE
# ═══════════════════════════════════════════════════════════════════════════

class SFTPSyncEngine:
    """Bidirectional SFTP sync with SSH tunneling"""
    
    def __init__(self, config: SyncConfig):
        self.config = config
        self.logger = logging.getLogger("SFTPSyncEngine")
        self.ssh_client = None
        self.sftp_client = None
        self.sync_log: List[FileChange] = []
        self.conflict_log: List[Dict] = []
    
    async def connect(self) -> bool:
        """Establish SSH connection to HP-OMEN"""
        try:
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            self.logger.info(f"🔌 Connecting to {self.config.hp_host}:{self.config.hp_sftp_port}...")
            self.ssh_client.connect(
                hostname=self.config.hp_host,
                port=self.config.hp_sftp_port,
                username=self.config.hp_user,
                auth_tries=3,
                timeout=10
            )
            
            self.sftp_client = self.ssh_client.open_sftp()
            self.logger.info("✅ SSH connection established, SFTP ready")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ SSH connection failed: {e}")
            return False
    
    async def disconnect(self) -> None:
        """Close SSH and SFTP connections"""
        try:
            if self.sftp_client:
                self.sftp_client.close()
            if self.ssh_client:
                self.ssh_client.close()
            self.logger.info("✅ Disconnected from remote")
        except Exception as e:
            self.logger.error(f"Error during disconnect: {e}")
    
    async def sync_file_to_remote(self, change: FileChange) -> bool:
        """Upload file to HP-OMEN via SFTP"""
        try:
            local_path = change.local_path
            remote_path = f"{self.config.hp_sync_root}/{change.remote_path}"
            
            # Create remote directory if needed
            remote_dir = os.path.dirname(remote_path)
            self._mkdir_remote(remote_dir)
            
            if change.change_type == FileChangeType.DELETED:
                self.sftp_client.remove(remote_path)
                self.logger.info(f"🗑️  Deleted remote: {remote_path}")
            else:
                self.sftp_client.put(local_path, remote_path)
                self.logger.info(f"⬆️  Synced to remote: {remote_path} ({change.size} bytes)")
            
            self.sync_log.append(change)
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to sync {change.local_path}: {e}")
            return False
    
    async def sync_file_from_remote(self, remote_path: str, local_path: str) -> bool:
        """Download file from HP-OMEN via SFTP"""
        try:
            # Create local directory if needed
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            self.sftp_client.get(remote_path, local_path)
            self.logger.info(f"⬇️  Downloaded from remote: {remote_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to download {remote_path}: {e}")
            return False
    
    def _mkdir_remote(self, path: str) -> None:
        """Create directory on remote if it doesn't exist"""
        try:
            self.sftp_client.stat(path)
        except IOError:
            # Directory doesn't exist, create it
            if path != "/":
                self._mkdir_remote(os.path.dirname(path))
                self.sftp_client.mkdir(path)
    
    async def resolve_conflict(self, local_change: FileChange, remote_change: FileChange) -> FileChange:
        """Resolve sync conflicts using configured strategy"""
        self.logger.warning(f"⚠️  Conflict detected: {local_change.local_path}")
        
        strategy = self.config.conflict_resolver
        
        if strategy == "newer":
            winner = local_change if local_change.timestamp > remote_change.timestamp else remote_change
        elif strategy == "larger":
            winner = local_change if local_change.size > remote_change.size else remote_change
        elif strategy == "ai":
            winner = await self._ai_decide_conflict(local_change, remote_change)
        else:  # "ask"
            print(f"\n⚠️  Conflict: {local_change.local_path}")
            print(f"   Local:  {local_change.timestamp} ({local_change.size} bytes)")
            print(f"   Remote: {remote_change.timestamp} ({remote_change.size} bytes)")
            choice = input("Keep (l)ocal or (r)emote? ").lower()
            winner = local_change if choice == "l" else remote_change
        
        self.conflict_log.append({
            "file": local_change.local_path,
            "local_timestamp": local_change.timestamp.isoformat(),
            "remote_timestamp": remote_change.timestamp.isoformat(),
            "winner": winner.change_type.value,
            "resolved_at": datetime.now().isoformat()
        })
        
        return winner
    
    async def _ai_decide_conflict(self, local: FileChange, remote: FileChange) -> FileChange:
        """Use AI to intelligently resolve conflict"""
        # TODO: Integrate with LiteLLM to ask Claude/GPT-4 which version to keep
        # For now, use newer file heuristic
        return local if local.timestamp > remote.timestamp else remote

# ═══════════════════════════════════════════════════════════════════════════
# CLIPBOARD SYNC
# ═══════════════════════════════════════════════════════════════════════════

class ClipboardBridge:
    """Synchronize clipboard content between M2 and HP-OMEN"""
    
    def __init__(self, grpc_bridge):
        self.grpc_bridge = grpc_bridge  # Reference to gRPC bridge for messaging
        self.logger = logging.getLogger("ClipboardBridge")
        self.last_clipboard_content: str = ""
        self.last_clipboard_timestamp: datetime = datetime.now()
        self.sync_enabled: bool = True
    
    async def monitor_clipboard(self) -> None:
        """Monitor local clipboard and sync changes to remote"""
        while self.sync_enabled:
            try:
                current_content = pyperclip.paste()
                
                if current_content != self.last_clipboard_content:
                    self.logger.info(f"📋 Clipboard changed ({len(current_content)} bytes)")
                    self.last_clipboard_content = current_content
                    self.last_clipboard_timestamp = datetime.now()
                    
                    # Send to remote node via gRPC
                    await self._send_clipboard_to_remote(current_content)
                
                await asyncio.sleep(1)  # Poll every 1 second
                
            except Exception as e:
                self.logger.error(f"Clipboard monitoring error: {e}")
                await asyncio.sleep(5)
    
    async def _send_clipboard_to_remote(self, content: str) -> None:
        """Send clipboard content to remote via gRPC"""
        try:
            # TODO: Send via gRPC bridge to HP-OMEN
            message = {
                "type": "clipboard_sync",
                "content": content,
                "timestamp": datetime.now().isoformat(),
                "source": "M2-Ultra"
            }
            self.logger.info(f"Sending clipboard to remote: {len(content)} bytes")
            # await self.grpc_bridge.send_message("clipboard", message)
        except Exception as e:
            self.logger.error(f"Failed to sync clipboard: {e}")
    
    async def receive_clipboard_from_remote(self, content: str) -> None:
        """Receive clipboard content from remote and update local"""
        try:
            pyperclip.copy(content)
            self.last_clipboard_content = content
            self.logger.info(f"📋 Clipboard updated from remote ({len(content)} bytes)")
        except Exception as e:
            self.logger.error(f"Failed to update local clipboard: {e}")

# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED SYNC ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════════

class UnifiedSyncOrchestrator:
    """Coordinates file sync, clipboard sync, and conflict resolution"""
    
    def __init__(self, config: SyncConfig, grpc_bridge=None):
        self.config = config
        self.grpc_bridge = grpc_bridge
        self.logger = logging.getLogger("UnifiedSyncOrchestrator")
        
        self.sftp_engine = SFTPSyncEngine(config)
        self.clipboard_bridge = ClipboardBridge(grpc_bridge)
        self.file_watcher = None
        self.observer = None
        
        # Sync state
        self.syncing: bool = False
        self.sync_queue: asyncio.Queue = asyncio.Queue()
        self.active_syncs: Dict[str, asyncio.Task] = {}
    
    async def start(self) -> None:
        """Start all sync services"""
        self.logger.info("🚀 Starting Unified Sync Orchestrator...")
        
        # Connect to remote
        if not await self.sftp_engine.connect():
            self.logger.error("❌ Cannot start sync without remote connection")
            return
        
        self.syncing = True
        
        # Start file watcher
        self.file_watcher = LocalFileWatcher(self.config.m2_sync_root, self.config)
        self.observer = Observer()
        self.observer.schedule(self.file_watcher, self.config.m2_sync_root, recursive=True)
        self.observer.start()
        self.logger.info(f"👁️  File watcher started ({self.config.m2_sync_root})")
        
        # Start clipboard sync
        clipboard_task = asyncio.create_task(self.clipboard_bridge.monitor_clipboard())
        self.active_syncs["clipboard"] = clipboard_task
        
        # Start sync processor
        processor_task = asyncio.create_task(self._process_sync_queue())
        self.active_syncs["processor"] = processor_task
        
        self.logger.info("✅ Unified Sync Orchestrator running")
    
    async def stop(self) -> None:
        """Stop all sync services"""
        self.logger.info("🛑 Stopping Unified Sync Orchestrator...")
        
        self.syncing = False
        self.clipboard_bridge.sync_enabled = False
        
        if self.observer:
            self.observer.stop()
            self.observer.join()
        
        await self.sftp_engine.disconnect()
        
        # Cancel all tasks
        for task in self.active_syncs.values():
            task.cancel()
        
        self.logger.info("✅ Sync Orchestrator stopped")
    
    async def _process_sync_queue(self) -> None:
        """Process file changes from the queue"""
        while self.syncing:
            try:
                # Get changes from file watcher
                if not self.file_watcher.changes.empty():
                    change = await self.file_watcher.changes.get()
                    await self.sftp_engine.sync_file_to_remote(change)
                
                await asyncio.sleep(self.config.polling_interval)
                
            except Exception as e:
                self.logger.error(f"Error processing sync queue: {e}")
    
    def get_sync_status(self) -> Dict:
        """Get current sync status"""
        return {
            "syncing": self.syncing,
            "files_synced": len(self.sftp_engine.sync_log),
            "conflicts_resolved": len(self.sftp_engine.conflict_log),
            "active_tasks": len(self.active_syncs),
            "sync_log": [c.to_dict() for c in self.sftp_engine.sync_log[-10:]],  # Last 10
            "conflict_log": self.sftp_engine.conflict_log[-5:]  # Last 5
        }

# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    """Example usage"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
    )
    
    # Create sync config
    config = SyncConfig(
        m2_sync_root="/Users/m2ultra/NOIZYLAB",
        hp_sync_root="C:\\NOIZYLAB"
    )
    
    # Start orchestrator
    orchestrator = UnifiedSyncOrchestrator(config)
    
    try:
        await orchestrator.start()
        
        # Keep running
        while True:
            status = orchestrator.get_sync_status()
            print(f"✅ Sync Status: {status['files_synced']} files, {status['conflicts_resolved']} conflicts")
            await asyncio.sleep(30)
        
    except KeyboardInterrupt:
        await orchestrator.stop()

if __name__ == "__main__":
    asyncio.run(main())
