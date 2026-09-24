// @vox MCP tools — Voice engine operations

/** Check voice bridge status */
export async function voiceBridgeStatus(): Promise<unknown> {
  try {
    const res = await fetch('http://localhost:8080/health', {
      signal: AbortSignal.timeout(5000),
    });
    return { status: res.ok ? 'LIVE' : `DOWN (${res.status})` };
  } catch {
    return { status: 'UNREACHABLE' };
  }
}

/** Check GABRIEL voice pipeline (Daniel voice) */
export async function gabrielVoiceStatus(): Promise<unknown> {
  try {
    const res = await fetch('http://localhost:7777/health', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return {
      status: res.ok ? 'LIVE' : 'DOWN',
      voice: 'Daniel',
      model: 'Opus 4.6',
      ...data,
    };
  } catch {
    return { status: 'UNREACHABLE' };
  }
}

/** Check STT (faster-whisper) availability */
export async function sttStatus(): Promise<unknown> {
  try {
    const res = await fetch('http://localhost:8000/health', {
      signal: AbortSignal.timeout(5000),
    });
    return {
      status: res.ok ? 'LIVE' : `DOWN (${res.status})`,
      note: 'STT requires speech_to_text consent scope',
    };
  } catch {
    return {
      status: 'NOT RUNNING',
      note: 'Start via: docker compose -f ops/docker-compose.noizy.yml up stt',
    };
  }
}

/** Verify consent scope for voice operations */
export async function verifyVoiceConsent(creatorId: string): Promise<unknown> {
  return {
    scope: 'speech_to_text',
    creatorId,
    note: 'Consent verification requires consent-gateway Worker (not yet deployed to prod)',
    contract: 'contracts/consent/scopes.stt.json',
  };
}
