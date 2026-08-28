# Frontend-Backend Integration Guide

## 🔗 **Integration Overview**

UnfoldAI uses a **RESTful API-based integration** between the VS Code extension frontend and Node.js backend, with WebSocket support for real-time features. This document details the communication patterns, data flow, and integration points.

## 📡 **Communication Protocols**

### **1. HTTP REST API**

#### **Base Configuration**
```typescript
// Frontend: apiKeyManager.ts
const API_BASE_URL = 'http://localhost:3002';
const DEFAULT_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
};
```

#### **Request/Response Pattern**
```typescript
// Standard request structure
interface ApiRequest {
    prompt?: string;
    messages?: Array<{role: string, content: string}>;
    codeSnippet?: string;
    useTemplate?: boolean;
    model?: string;
    apiKey?: string;
    userId?: number;
    isPremium?: boolean;
    isCodebaseAnalysis?: boolean;
    chatState?: ChatState;
}

// Standard response structure
interface ApiResponse {
    data: string;
    tokensUsed: number;
    chatHistory: Array<{role: string, content: string}>;
    chatState: ChatState;
    error?: string;
}
```

### **2. WebSocket Communication**

#### **Real-time Features**
```typescript
// Frontend: monitorTerminalsService.ts
class TerminalMonitorService {
    private ws: WebSocket;
    
    connect() {
        this.ws = new WebSocket('ws://localhost:3002/terminal-monitor');
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleTerminalUpdate(data);
        };
    }
    
    private handleTerminalUpdate(data: TerminalUpdate) {
        // Handle real-time terminal updates
        if (data.type === 'error') {
            this.triggerAutoSolve(data);
        }
    }
}
```

## 🔄 **Data Flow Patterns**

### **1. Chat Message Flow**

#### **Frontend → Backend**
```typescript
// Sidebar.svelte
async function sendMessage(message: string) {
    // 1. Prepare request data
    const requestBody = {
        prompt: message,
        messages: filterMessagesForAPI(chatTabs[activeChat].messages),
        codeSnippet: currentCodeSnippet || '',
        useTemplate: false,
        model: 'gpt-4o-mini',
        apiKey: userStore.apiKey,
        userId: userStore.id,
        isPremium: userStore.isPremium,
        isCodebaseAnalysis: isCodebaseAnalysisRequest,
        chatState: chatTabs[activeChat].state
    };
    
    // 2. Send request
    const response = await fetch(`${API_BASE_URL}/Unfold/New/solution`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify(requestBody)
    });
    
    // 3. Handle response
    const result = await response.json();
    handleApiResponse(result, chatTabs[activeChat].messages, message);
}
```

#### **Backend → Frontend**
```typescript
// index.ts
app.post('/Unfold/New/solution', async (req: Request, res: Response) => {
    try {
        // 1. Process request
        const { prompt, messages, codeSnippet, chatState } = req.body;
        
        // 2. Manage tokens
        await manageTokenCount(messages, chatState, maxTokensAllowed);
        
        // 3. Send to OpenAI
        const openaiResponse = await sendOpenAIRequest(model, messages, apiKey, isPremium, chatState);
        
        // 4. Return structured response
        res.json({
            data: openaiResponse.data.choices[0].message.content,
            tokensUsed: totalTokensUsed,
            chatHistory: messages, // Full conversation context
            chatState: updatedChatState
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### **2. Codebase Analysis Flow**

#### **File Selection → Filtering → Analysis**
```typescript
// Frontend: Sidebar.svelte
async function handleCodebaseAnalysis() {
    // 1. Collect selected files
    const filePaths = collectSelectedFiles(treeNodes);
    
    // 2. Request file filtering
    const filterResponse = await fetch(`${API_BASE_URL}/Unfold/new/codebase-filter`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
            codebase: filePaths,
            model: 'gpt-4o-mini',
            filterType: 'regularFilter',
            filterMaxTokensCount: 20000
        })
    });
    
    // 3. Get filtered file paths
    const { data: filteredPaths } = await filterResponse.json();
    
    // 4. Extract file content
    const fileContents = await extractFileContents(filteredPaths);
    
    // 5. Send for analysis
    const analysisResponse = await fetch(`${API_BASE_URL}/Unfold/New/solution`, {
        method: 'POST',
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
            prompt: "Please analyze this codebase and prepare to answer questions about it.",
            codeSnippet: formatCodebaseContent(fileContents),
            isCodebaseAnalysis: true,
            chatState: { hasCodebaseAnalysisInstructionsBeenGiven: false }
        })
    });
}
```

## 🎯 **Integration Points**

### **1. Authentication Integration**

#### **JWT Token Management**
```typescript
// Frontend: AuthManager.ts
class AuthManager {
    private token: string | null = null;
    
    async authenticate(email: string, password: string) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const { token, user } = await response.json();
        this.token = token;
        this.user = user;
        
        // Store in VS Code extension storage
        vscode.workspace.getConfiguration('unfoldai').update('authToken', token);
    }
    
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}
```

#### **Backend Authentication Middleware**
```typescript
// Backend: auth.ts
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        
        req.user = decoded;
        next();
    });
}
```

### **2. State Synchronization**

#### **Chat State Management**
```typescript
// Frontend: Sidebar.svelte
function handleApiResponse(response: ApiResponse, currentMessages: Message[]) {
    // Update chat state from backend
    if (response.chatState) {
        chatTabs[activeChat].state = response.chatState;
    }
    
    // Update messages with full context from backend
    if (response.chatHistory && response.chatHistory.length > 0) {
        const updatedMessages = response.chatHistory.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            fullContent: msg.content
        }));
        chatTabs[activeChat].messages = [...updatedMessages];
    }
    
    // Add new response
    chatTabs[activeChat].messages.push({
        role: 'assistant',
        content: response.data,
        fullContent: response.data
    });
}
```

#### **Backend State Tracking**
```typescript
// Backend: index.ts
function updateChatState(chatState: ChatState, requestType: string): ChatState {
    const updatedState = { ...chatState };
    
    switch (requestType) {
        case 'codebase-analysis':
            updatedState.hasCodebaseAnalysisInstructionsBeenGiven = true;
            break;
        case 'terminal-error':
            updatedState.hasTerminalErrorInstructionsBeenGiven = true;
            break;
        case 'regular-chat':
            updatedState.hasRegularChatInteractionInstructionsBeenGives = true;
            break;
    }
    
    return updatedState;
}
```

### **3. Error Handling Integration**

#### **Frontend Error Handling**
```typescript
// Frontend: Sidebar.svelte
async function sendMessage(message: string) {
    try {
        const response = await fetch(`${API_BASE_URL}/Unfold/New/solution`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP ${response.status}`);
        }
        
        const result = await response.json();
        handleApiResponse(result, chatTabs[activeChat].messages, message);
        
    } catch (error) {
        // Handle different error types
        if (error.message.includes('Failed to fetch')) {
            showError('Network error. Please check your connection.');
        } else if (error.message.includes('401')) {
            showError('Authentication failed. Please log in again.');
        } else if (error.message.includes('413')) {
            showError('Request too large. Please reduce the content size.');
        } else {
            showError(`Error: ${error.message}`);
        }
        
        // Log error for debugging
        console.error('API Error:', error);
    }
}
```

#### **Backend Error Handling**
```typescript
// Backend: index.ts
app.post('/Unfold/New/solution', async (req: Request, res: Response) => {
    try {
        // Request processing...
    } catch (error) {
        logger.error(`[NewSolution] Error processing request`, {
            userId: req.user?.id,
            error: error.message,
            stack: error.stack
        });
        
        // Return appropriate error response
        if (error.message.includes('context_length_exceeded')) {
            res.status(413).json({ 
                error: 'Request too large even after optimization. Please try with a shorter message or smaller codebase.' 
            });
        } else if (error.message.includes('authentication')) {
            res.status(401).json({ error: 'Authentication failed' });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});
```

## 🔧 **Configuration Management**

### **1. Environment Configuration**
```typescript
// Backend: constants.ts
export const CONFIG = {
    PORT: process.env.PORT || 3002,
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    LOGFLARE_TOKEN: process.env.LOGFLARE_TOKEN,
    LOGFLARE_SOURCE: process.env.LOGFLARE_SOURCE
};
```

### **2. Frontend Configuration**
```typescript
// Frontend: constants.ts
export const CONFIG = {
    API_BASE_URL: 'http://localhost:3002',
    MAX_TOKENS: 80000,
    MAX_CODEBASE_TOKENS: 20000,
    REQUEST_TIMEOUT: 30000,
    DEBUG_MODE: false
};
```

## 📊 **Performance Optimization**

### **1. Request Batching**
```typescript
// Frontend: batch multiple operations
async function batchCodebaseOperations(operations: CodebaseOperation[]) {
    const batchRequest = {
        operations: operations,
        userId: userStore.id,
        isPremium: userStore.isPremium
    };
    
    const response = await fetch(`${API_BASE_URL}/batch/codebase`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(batchRequest)
    });
    
    return await response.json();
}
```

### **2. Caching Strategy**
```typescript
// Frontend: cache API responses
class ApiCache {
    private cache = new Map<string, { data: any, timestamp: number }>();
    private TTL = 5 * 60 * 1000; // 5 minutes
    
    async get(key: string, fetcher: () => Promise<any>) {
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < this.TTL) {
            return cached.data;
        }
        
        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }
}
```

### **3. Connection Pooling**
```typescript
// Backend: database connection pooling
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

export async function query(text: string, params: any[]) {
    const client = await pool.connect();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}
```

## 🔍 **Debugging & Monitoring**

### **1. Request/Response Logging**
```typescript
// Frontend: debug logging
if (CONFIG.DEBUG_MODE) {
    console.log('API Request:', {
        url: `${API_BASE_URL}/Unfold/New/solution`,
        method: 'POST',
        body: requestBody,
        headers: getAuthHeaders()
    });
    
    console.log('API Response:', {
        status: response.status,
        data: result,
        timing: Date.now() - startTime
    });
}
```

### **2. Backend Monitoring**
```typescript
// Backend: request monitoring
app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info(`[Request] ${req.method} ${req.path}`, {
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id,
            userAgent: req.get('User-Agent')
        });
    });
    
    next();
});
```

### **3. Error Tracking**
```typescript
// Frontend: error reporting
function reportError(error: Error, context: string) {
    console.error(`[${context}] Error:`, error);
    
    // Send to error tracking service
    fetch(`${API_BASE_URL}/errors`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
            error: error.message,
            stack: error.stack,
            context,
            userId: userStore.id,
            timestamp: new Date().toISOString()
        })
    }).catch(console.error);
}
```

## 🚀 **Future Enhancements**

### **1. GraphQL Integration**
```typescript
// Future: GraphQL for more efficient data fetching
const GET_CHAT_HISTORY = `
  query GetChatHistory($chatId: ID!) {
    chat(id: $chatId) {
      messages {
        id
        role
        content
        timestamp
      }
      state {
        hasCodebaseAnalysis
        hasTerminalError
        hasRegularChat
      }
    }
  }
`;
```

### **2. WebSocket Real-time Updates**
```typescript
// Future: Real-time chat updates
class RealTimeChatService {
    private ws: WebSocket;
    
    connect(chatId: string) {
        this.ws = new WebSocket(`ws://localhost:3002/chat/${chatId}`);
        this.ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.handleChatUpdate(update);
        };
    }
    
    private handleChatUpdate(update: ChatUpdate) {
        // Update UI in real-time
        chatTabs[activeChat].messages.push(update.message);
        updateChatDisplay();
    }
}
```

### **3. Service Worker for Offline Support**
```typescript
// Future: Offline capability
class OfflineManager {
    private queue: ApiRequest[] = [];
    
    async queueRequest(request: ApiRequest) {
        this.queue.push(request);
        await this.saveQueue();
    }
    
    async syncWhenOnline() {
        if (navigator.onLine) {
            for (const request of this.queue) {
                await this.sendRequest(request);
            }
            this.queue = [];
            await this.saveQueue();
        }
    }
}
```

This integration architecture provides a robust, scalable, and maintainable foundation for the UnfoldAI application, with clear separation of concerns and comprehensive error handling. 