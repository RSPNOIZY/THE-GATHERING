# ============================================================
#  MC96 UNIVERSE — Transport & Master Hive Container
#  Platform: linux/amd64 + linux/arm64 (Apple Silicon)
#  Base: Python 3.11 slim
# ============================================================
FROM python:3.11-slim

LABEL maintainer="MC96 Universe"
LABEL description="MC96 Data Transport, Master Hive & Network Suite"
LABEL version="1.0.0"

# ── System packages ─────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    rsync \
    openssh-client \
    openssh-server \
    curl \
    wget \
    iputils-ping \
    iproute2 \
    net-tools \
    nmap \
    avahi-utils \
    dnsutils \
    jq \
    htop \
    ncdu \
    pv \
    xxhash \
    git \
    bash \
    coreutils \
    findutils \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ──────────────────────────────────────
COPY requirements.txt /opt/mc96/requirements.txt
RUN pip install --no-cache-dir -r /opt/mc96/requirements.txt

# ── SSH Server setup ─────────────────────────────────────────
RUN mkdir -p /var/run/sshd /root/.ssh \
    && chmod 700 /root/.ssh \
    && sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config \
    && sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config \
    && echo "StrictHostKeyChecking no" >> /etc/ssh/ssh_config

# ── Application code ─────────────────────────────────────────
COPY scripts/  /opt/mc96/scripts/
COPY config/   /opt/mc96/config/
COPY entrypoint.sh /opt/mc96/entrypoint.sh
RUN chmod +x /opt/mc96/entrypoint.sh \
    && chmod +x /opt/mc96/scripts/*.sh 2>/dev/null || true

# ── Env defaults ─────────────────────────────────────────────
ENV MC96_NODE_NAME="mc96-node"
ENV MC96_ROLE="worker"
ENV MC96_HIVE_HOST="mc96-controller"
ENV MC96_HIVE_PORT="8096"
ENV MC96_SSH_PORT="2222"
ENV MC96_VOLUMES_ROOT="/volumes"
ENV MC96_REGISTRY_PATH="/data/mc96_hive_registry.json"
ENV MC96_LOG_DIR="/data/logs"
ENV PYTHONUNBUFFERED=1

# ── Ports ────────────────────────────────────────────────────
# 8096  → MC96 REST API / dashboard
# 8097  → WebSocket live log stream
# 2222  → SSH relay port
# 873   → rsync daemon
EXPOSE 8096 8097 2222 873

# ── Persistent data volumes ───────────────────────────────────
VOLUME ["/volumes", "/data", "/root/.ssh"]

WORKDIR /opt/mc96

ENTRYPOINT ["/opt/mc96/entrypoint.sh"]
