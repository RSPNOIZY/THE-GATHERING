/**
 * HeavenClient — Bridge between DreamChamber and the HEAVEN Consent Kernel
 * Reports AI usage back to the consent kernel for audit trail and cost tracking.
 */

const fetch = require("node-fetch");

class HeavenClient {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl ||
      process.env.HEAVEN_URL ||
      "https://heaven.rsp-5f3.workers.dev";
    this.apiKey = options.apiKey || process.env.NOIZY_API_KEY || "";
    this.enabled = !!this.apiKey;
  }

  get headers() {
    return {
      "Content-Type": "application/json",
      "X-NOIZY-Key": this.apiKey,
    };
  }

  async request(path, method = "GET", body = null) {
    if (!this.enabled) return null;
    try {
      const opts = { method, headers: this.headers };
      if (body) opts.body = JSON.stringify(body);
      const res = await fetch(`${this.baseUrl}${path}`, opts);
      return await res.json();
    } catch (err) {
      console.error(`[HeavenClient] ${method} ${path} failed:`, err.message);
      return null;
    }
  }

  // Health check — verify kernel is reachable
  async health() {
    return this.request("/health");
  }

  // Get system stats
  async stats() {
    return this.request("/api/v1/stats");
  }

  // Get all actors
  async getActors() {
    return this.request("/api/v1/actors");
  }

  // Get actor details
  async getActor(actorId) {
    return this.request(`/api/v1/actors/${actorId}`);
  }

  // Get actor's never clauses
  async getNeverClauses(actorId) {
    return this.request(`/api/v1/actors/${actorId}/never-clauses`);
  }

  // Get actor's consent tokens
  async getConsentTokens(actorId) {
    return this.request(`/api/v1/actors/${actorId}/consent-tokens`);
  }

  // Create a consent token
  async createConsentToken(tokenData) {
    return this.request("/api/v1/consent-tokens", "POST", tokenData);
  }

  // Revoke a consent token (kill switch)
  async revokeToken(tokenId, reason) {
    return this.request(`/api/v1/consent-tokens/${tokenId}/revoke`, "POST", {
      reason,
    });
  }

  // Submit a synth request (checks never clauses + consent)
  async synthRequest(requestData) {
    return this.request("/api/v1/synth-requests", "POST", requestData);
  }

  // Get rate table
  async getRateTable() {
    return this.request("/api/v1/rate-table");
  }

  // Get union tiers
  async getUnionTiers() {
    return this.request("/api/v1/union-tiers");
  }

  // Get estates
  async getEstates() {
    return this.request("/api/v1/estates");
  }

  // Get actor estate
  async getActorEstate(actorId) {
    return this.request(`/api/v1/actors/${actorId}/estate`);
  }

  // Get PREMIS events
  async getPremisEvents(actorId) {
    const params = actorId ? `?actor_id=${actorId}` : "";
    return this.request(`/api/v1/premis${params}`);
  }

  // Get ledger events
  async getLedger(actorId, limit = 50) {
    const params = actorId
      ? `?actor_id=${actorId}&limit=${limit}`
      : `?limit=${limit}`;
    return this.request(`/api/v1/ledger${params}`);
  }

  // Get voice DNA for actor
  async getVoiceDNA(actorId) {
    return this.request(`/api/v1/actors/${actorId}/voice-dna`);
  }

  // Register voice DNA
  async registerVoiceDNA(actorId, dnaData) {
    return this.request(`/api/v1/actors/${actorId}/voice-dna`, "POST", dnaData);
  }

  // Log AI usage to the kernel as a ledger event
  async reportUsage({ model, provider, tokens, cost, conversationId }) {
    if (!this.enabled) return null;
    return this.request("/api/v1/ledger/append", "POST", {
      event_type: "ai.usage",
      payload: { model, provider, tokens, conversationId },
      amount_cad: 0,
      actor_share_cad: 0,
      noizy_share_cad: 0,
      union_share_cad: 0,
    });
  }
}

module.exports = HeavenClient;
