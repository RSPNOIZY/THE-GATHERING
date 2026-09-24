/**
 * GABRIEL SYSTEM OMEGA - API Bridge
 * Zero Latency Communication Layer
 * ================================
 */

const API_BRIDGE = {
     // Configuration
     config: {
          baseUrl: 'http://localhost:5174',
          timeout: 5000,
          retryAttempts: 3,
          retryDelay: 1000
     },

     // Connection state
     state: {
          connected: false,
          lastPing: null,
          latency: 0
     },

     /**
      * Initialize the API Bridge
      */
     async init() {
          console.log('[API_BRIDGE] Initializing connection to MC96 Server...');
          await this.checkConnection();
          return this.state.connected;
     },

     /**
      * Generic fetch wrapper with error handling
      */
     async request(endpoint, options = {}) {
          const url = `${this.config.baseUrl}${endpoint}`;
          const startTime = performance.now();

          try {
               const response = await fetch(url, {
                    ...options,
                    headers: {
                         'Content-Type': 'application/json',
                         ...options.headers
                    }
               });

               this.state.latency = Math.round(performance.now() - startTime);
               this.state.connected = true;
               this.state.lastPing = Date.now();

               if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
               }

               return await response.json();
          } catch (error) {
               console.warn(`[API_BRIDGE] Request failed: ${endpoint}`, error.message);
               this.state.connected = false;
               return this.getMockData(endpoint);
          }
     },

     /**
      * Check server connection
      */
     async checkConnection() {
          try {
               const data = await this.request('/api/status');
               this.state.connected = data?.status === 'ONLINE';
               return this.state.connected;
          } catch {
               this.state.connected = false;
               return false;
          }
     },

     /**
      * Get system status
      */
     async getStatus() {
          return await this.request('/api/status');
     },

     /**
      * Get active agents
      */
     async getAgents() {
          return await this.request('/api/agents');
     },

     /**
      * Get MemCell graph data
      */
     async getMemCellGraph() {
          return await this.request('/api/memcell/graph');
     },

     /**
      * Get live feed events
      */
     async getFeed() {
          return await this.request('/api/feed');
     },

     /**
      * Execute a command
      */
     async executeCommand(command, params = {}) {
          return await this.request('/api/command', {
               method: 'POST',
               body: JSON.stringify({ command, params })
          });
     },

     /**
      * Mock data fallback for offline mode
      */
     getMockData(endpoint) {
          const mockResponses = {
               '/api/status': {
                    status: 'ONLINE',
                    latency: '<7ms',
                    uptime: '99.9%',
                    memcell_nodes: '∞',
                    agents_active: 3,
                    mode: 'OFFLINE_MOCK'
               },
               '/api/agents': {
                    agents: [
                         { name: 'GABRIEL', role: 'Primary AI Core', status: 'online' },
                         { name: 'SHIRL', role: 'Voice Interface', status: 'online' },
                         { name: 'ENGR_KEITH', role: 'System Engineer', status: 'online' }
                    ]
               },
               '/api/memcell/graph': {
                    nodes: [
                         { id: 'gabriel', label: 'GABRIEL', type: 'core', x: 400, y: 200 },
                         { id: 'mc96', label: 'MC96', type: 'system', x: 300, y: 300 },
                         { id: 'omega', label: 'OMEGA', type: 'protocol', x: 500, y: 300 },
                         { id: 'voice', label: 'VOICE', type: 'module', x: 200, y: 250 },
                         { id: 'vision', label: 'VISION', type: 'module', x: 600, y: 250 },
                         { id: 'memory', label: 'MEMORY', type: 'module', x: 400, y: 400 }
                    ],
                    edges: [
                         { from: 'gabriel', to: 'mc96' },
                         { from: 'gabriel', to: 'omega' },
                         { from: 'gabriel', to: 'voice' },
                         { from: 'gabriel', to: 'vision' },
                         { from: 'mc96', to: 'memory' },
                         { from: 'omega', to: 'memory' }
                    ]
               },
               '/api/feed': {
                    events: [
                         { time: new Date().toISOString(), message: '[INIT] Gabriel Enablement Portal activated...' },
                         { time: new Date().toISOString(), message: '[SYS] Running in offline mode' },
                         { time: new Date().toISOString(), message: '[API] Mock data enabled' }
                    ]
               }
          };

          return mockResponses[endpoint] || { error: 'Unknown endpoint', mock: true };
     },

     /**
      * Get connection metrics
      */
     getMetrics() {
          return {
               connected: this.state.connected,
               latency: this.state.latency,
               lastPing: this.state.lastPing,
               baseUrl: this.config.baseUrl
          };
     }
};

// Export for use in other modules
window.API_BRIDGE = API_BRIDGE;
