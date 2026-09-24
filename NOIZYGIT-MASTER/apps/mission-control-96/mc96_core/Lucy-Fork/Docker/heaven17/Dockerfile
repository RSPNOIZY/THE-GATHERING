FROM python:3.14-slim

LABEL maintainer="NOIZY Empire"
LABEL description="heaven17 Voice Intelligence Server"
LABEL version="1.0.0"

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    requests \
    pyaudio \
    websockets \
    aiohttp \
    uvicorn \
    fastapi \
    python-multipart

# Copy server
COPY server.py .
COPY config.py .

# Environment defaults (override via docker-compose)
ENV PORT=17017
ENV OLLAMA_URL=http://host.docker.internal:11434
ENV DREAMCHAMBER_URL=http://dreamchamber:7777
ENV PERSONA=RSP
ENV AI_MODEL=noizy-gabriel-mind
ENV VOICE_NAME=Gabriel

EXPOSE 17017

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT}/health')"

CMD ["python", "server.py"]
