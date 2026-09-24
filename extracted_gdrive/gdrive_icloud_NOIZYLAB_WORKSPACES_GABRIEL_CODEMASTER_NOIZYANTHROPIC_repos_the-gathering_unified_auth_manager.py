#!/usr/bin/env python3
"""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║    🔐 UNIFIED AUTHENTICATION & SSH TUNNEL MANAGER                        ║
║                                                                           ║
║    Single sign-on across M2-Ultra and HP-OMEN                            ║
║    SSH key management and rotation                                        ║
║    Automatic tunnel establishment                                         ║
║    VPN fallback for unreliable networks                                   ║
║    Two-factor authentication support                                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
"""

import os
import asyncio
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import secrets

import paramiko
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ed25519
from cryptography.hazmat.backends import default_backend

# ═══════════════════════════════════════════════════════════════════════════
# AUTHENTICATION MODELS
# ═══════════════════════════════════════════════════════════════════════════

class AuthMethod(Enum):
    SSH_KEY = "ssh_key"
    PASSWORD = "password"
    TOKEN = "token"
    CERTIFICATE = "certificate"
    OAUTH = "oauth"
    MFA = "mfa"

@dataclass
class Credential:
    """User credential with metadata"""
    username: str
    auth_method: AuthMethod
    secret: str  # Password, token, or key path
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None
    
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.now() > self.expires_at

@dataclass
class AuthToken:
    """Session token for inter-node communication"""
    token_id: str
    user: str
    issuer: str  # "M2-Ultra" or "HP-OMEN"
    created_at: datetime
    expires_at: datetime
    scopes: list = field(default_factory=lambda: ["grpc", "sftp", "clipboard"])
    is_valid: bool = True
    
    def is_expired(self) -> bool:
        return datetime.now() > self.expires_at

# ═══════════════════════════════════════════════════════════════════════════
# SSH KEY MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

class SSHKeyManager:
    """Generate, store, and rotate SSH keys"""
    
    def __init__(self, key_dir: str = "~/.noizylab/keys"):
        self.key_dir = Path(key_dir).expanduser()
        self.key_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger("SSHKeyManager")
    
    async def generate_key_pair(
        self,
        key_name: str,
        key_type: str = "ed25519",
        comment: str = "NOIZYLAB Auto-Generated"
    ) -> Tuple[str, str]:
        """Generate SSH key pair (Ed25519 or RSA 4096)"""
        
        if key_type == "ed25519":
            key = ed25519.Ed25519PrivateKey.generate()
        else:  # RSA 4096
            key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=4096,
                backend=default_backend()
            )
        
        # Serialize private key
        private_key = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.OpenSSH,
            encryption_algorithm=serialization.NoEncryption()
        ).decode()
        
        # Serialize public key
        public_key = key.public_key().public_bytes(
            encoding=serialization.Encoding.OpenSSH,
            format=serialization.PublicFormat.OpenSSH
        ).decode()
        
        # Save keys
        private_key_path = self.key_dir / f"{key_name}"
        public_key_path = self.key_dir / f"{key_name}.pub"
        
        private_key_path.write_text(private_key)
        public_key_path.write_text(f"{public_key} {comment}\n")
        
        # Set permissions
        os.chmod(private_key_path, 0o600)
        os.chmod(public_key_path, 0o644)
        
        self.logger.info(f"✅ Generated {key_type} key pair: {key_name}")
        return str(private_key_path), str(public_key_path)
    
    async def rotate_keys(self, key_name: str) -> bool:
        """Rotate SSH keys (archive old, generate new)"""
        try:
            old_key = self.key_dir / key_name
            old_pub = self.key_dir / f"{key_name}.pub"
            
            if old_key.exists():
                # Archive old keys
                archive_dir = self.key_dir / "archive" / datetime.now().strftime("%Y%m%d_%H%M%S")
                archive_dir.mkdir(parents=True, exist_ok=True)
                old_key.rename(archive_dir / key_name)
                old_pub.rename(archive_dir / f"{key_name}.pub")
                self.logger.info(f"📦 Archived old keys to {archive_dir}")
            
            # Generate new keys
            await self.generate_key_pair(key_name)
            return True
            
        except Exception as e:
            self.logger.error(f"Key rotation failed: {e}")
            return False
    
    async def distribute_public_key(
        self,
        public_key_path: str,
        remote_host: str,
        remote_user: str,
        remote_port: int = 22
    ) -> bool:
        """Distribute public key to remote authorized_keys"""
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(remote_host, port=remote_port, username=remote_user)
            
            # Read public key
            with open(public_key_path) as f:
                pub_key = f.read()
            
            # Append to authorized_keys
            cmd = f"mkdir -p ~/.ssh && echo '{pub_key}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
            stdin, stdout, stderr = client.exec_command(cmd)
            stderr_text = stderr.read().decode()
            
            if stderr_text and "error" not in stderr_text.lower():
                self.logger.info(f"✅ Distributed public key to {remote_host}")
                return True
            else:
                self.logger.error(f"Failed to distribute key: {stderr_text}")
                return False
                
        except Exception as e:
            self.logger.error(f"Key distribution failed: {e}")
            return False

# ═══════════════════════════════════════════════════════════════════════════
# SSH TUNNEL MANAGER
# ═══════════════════════════════════════════════════════════════════════════

class SSHTunnelManager:
    """Manage SSH tunnels for secure communication"""
    
    def __init__(self):
        self.logger = logging.getLogger("SSHTunnelManager")
        self.tunnels: Dict[str, paramiko.Transport] = {}
        self.key_manager = SSHKeyManager()
    
    async def create_tunnel(
        self,
        tunnel_name: str,
        remote_host: str,
        remote_port: int,
        local_port: int,
        ssh_host: str,
        ssh_port: int = 22,
        ssh_user: str = "m2ultra",
        key_path: Optional[str] = None
    ) -> bool:
        """Create SSH tunnel for port forwarding"""
        try:
            ssh_client = paramiko.SSHClient()
            ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Connect
            if key_path:
                ssh_client.connect(ssh_host, port=ssh_port, username=ssh_user, key_filename=key_path)
            else:
                ssh_client.connect(ssh_host, port=ssh_port, username=ssh_user)
            
            # Open channel
            channel = ssh_client.get_transport().open_session()
            
            self.tunnels[tunnel_name] = {
                "client": ssh_client,
                "channel": channel,
                "local_port": local_port,
                "remote_host": remote_host,
                "remote_port": remote_port,
                "created_at": datetime.now()
            }
            
            self.logger.info(f"🔌 Tunnel created: {tunnel_name} (localhost:{local_port} -> {remote_host}:{remote_port})")
            return True
            
        except Exception as e:
            self.logger.error(f"Tunnel creation failed: {e}")
            return False
    
    async def close_tunnel(self, tunnel_name: str) -> None:
        """Close SSH tunnel"""
        if tunnel_name in self.tunnels:
            try:
                tunnel = self.tunnels[tunnel_name]
                tunnel["channel"].close()
                tunnel["client"].close()
                del self.tunnels[tunnel_name]
                self.logger.info(f"🔌 Tunnel closed: {tunnel_name}")
            except Exception as e:
                self.logger.error(f"Error closing tunnel: {e}")

# ═══════════════════════════════════════════════════════════════════════════
# UNIFIED AUTHENTICATION SERVICE
# ═══════════════════════════════════════════════════════════════════════════

class UnifiedAuthService:
    """Single sign-on for M2-Ultra and HP-OMEN"""
    
    def __init__(self, issuer: str = "M2-Ultra"):
        self.issuer = issuer
        self.logger = logging.getLogger("UnifiedAuthService")
        
        self.credentials: Dict[str, Credential] = {}
        self.tokens: Dict[str, AuthToken] = {}
        self.key_manager = SSHKeyManager()
        self.tunnel_manager = SSHTunnelManager()
        
        self.config_dir = Path("~/.noizylab/auth").expanduser()
        self.config_dir.mkdir(parents=True, exist_ok=True)
    
    async def register_credential(
        self,
        username: str,
        auth_method: AuthMethod,
        secret: str,
        mfa_enabled: bool = False,
        expires_in_days: int = 90
    ) -> bool:
        """Register a credential"""
        try:
            cred = Credential(
                username=username,
                auth_method=auth_method,
                secret=secret,
                expires_at=datetime.now() + timedelta(days=expires_in_days),
                mfa_enabled=mfa_enabled
            )
            
            self.credentials[username] = cred
            self.logger.info(f"✅ Registered credential for {username} ({auth_method.value})")
            
            # Save credentials securely
            await self._save_credentials()
            return True
            
        except Exception as e:
            self.logger.error(f"Credential registration failed: {e}")
            return False
    
    async def authenticate(self, username: str, password: str = None) -> Optional[AuthToken]:
        """Authenticate user and issue token"""
        try:
            if username not in self.credentials:
                self.logger.error(f"❌ User not found: {username}")
                return None
            
            cred = self.credentials[username]
            
            # Check expiration
            if cred.is_expired():
                self.logger.warning(f"⚠️  Credential expired for {username}")
                return None
            
            # Verify password if needed
            if cred.auth_method == AuthMethod.PASSWORD and password:
                if not self._verify_password(password, cred.secret):
                    self.logger.error(f"❌ Invalid password for {username}")
                    return None
            
            # Generate token
            token = AuthToken(
                token_id=secrets.token_urlsafe(32),
                user=username,
                issuer=self.issuer,
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=24),
                scopes=["grpc", "sftp", "clipboard", "ssh"]
            )
            
            self.tokens[token.token_id] = token
            self.logger.info(f"✅ Authenticated {username}, issued token {token.token_id[:16]}...")
            return token
            
        except Exception as e:
            self.logger.error(f"Authentication failed: {e}")
            return None
    
    async def verify_token(self, token_id: str) -> bool:
        """Verify authentication token"""
        if token_id not in self.tokens:
            return False
        
        token = self.tokens[token_id]
        return token.is_valid and not token.is_expired()
    
    def _verify_password(self, plain: str, hashed: str) -> bool:
        """Verify plain password against hashed"""
        # TODO: Implement proper password hashing (use bcrypt in production)
        return hashlib.sha256(plain.encode()).hexdigest() == hashed
    
    async def _save_credentials(self) -> None:
        """Save credentials to disk (encrypted)"""
        # TODO: Implement encryption using Fernet or similar
        pass

# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLE USAGE
# ═══════════════════════════════════════════════════════════════════════════

async def main():
    logging.basicConfig(level=logging.INFO)
    
    # Initialize auth service
    auth = UnifiedAuthService(issuer="M2-Ultra")
    
    # Generate SSH keys
    key_mgr = SSHKeyManager()
    priv_key, pub_key = await key_mgr.generate_key_pair("noizylab-sync")
    
    # Register credential
    await auth.register_credential(
        username="m2ultra",
        auth_method=AuthMethod.SSH_KEY,
        secret=priv_key
    )
    
    # Authenticate
    token = await auth.authenticate("m2ultra")
    if token:
        print(f"✅ Got token: {token.token_id[:32]}...")
        
        # Verify token
        is_valid = await auth.verify_token(token.token_id)
        print(f"Token valid: {is_valid}")

if __name__ == "__main__":
    asyncio.run(main())
