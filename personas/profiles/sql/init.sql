-- DreamChamber PostgreSQL Schema
-- Anthropic-first, multi-model AI platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    
    -- Preferences (Anthropic-first)
    preferred_model VARCHAR(50) DEFAULT 'claude-sonnet-4',
    preferred_search_model VARCHAR(50) DEFAULT 'command-r-plus',
    theme VARCHAR(50) DEFAULT 'noizy-dark',
    
    -- API Keys (encrypted in app)
    anthropic_key_encrypted TEXT,
    openai_key_encrypted TEXT,
    google_key_encrypted TEXT,
    cohere_key_encrypted TEXT,
    together_key_encrypted TEXT,
    mistral_key_encrypted TEXT,
    perplexity_key_encrypted TEXT,
    
    -- Usage limits
    monthly_token_limit INTEGER DEFAULT 10000000,
    monthly_cost_limit DECIMAL(10, 2) DEFAULT 100.00,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    active_model VARCHAR(50) DEFAULT 'claude-sonnet-4',
    
    -- Metadata
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    
    -- State
    state VARCHAR(50) DEFAULT 'active' CHECK (state IN ('active', 'archived', 'deleted')),
    
    -- Comparison metadata
    is_comparison BOOLEAN DEFAULT false,
    comparison_models TEXT[], -- Array of models used in comparison
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_conversations_user_id (user_id),
    INDEX idx_conversations_state (state),
    INDEX idx_conversations_updated_at (updated_at DESC)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model VARCHAR(50),
    
    -- Token and cost tracking
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    prompt_cost DECIMAL(10, 6),
    completion_cost DECIMAL(10, 6),
    total_cost DECIMAL(10, 6),
    
    -- Performance metrics
    latency_ms INTEGER,
    
    -- Provider metadata
    provider VARCHAR(50),
    model_version VARCHAR(100),
    temperature DECIMAL(2, 1),
    max_tokens INTEGER,
    
    -- Special features (Cohere RAG)
    citations JSONB,
    search_queries JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_messages_conversation_id (conversation_id),
    INDEX idx_messages_created_at (created_at)
);

-- Model usage statistics
CREATE TABLE model_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    
    -- Usage metrics
    request_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 6) DEFAULT 0,
    average_latency_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Unique constraint
    UNIQUE(user_id, model, date),
    
    -- Indexes
    INDEX idx_model_stats_user_date (user_id, date DESC)
);

-- Sessions table (for auth)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    
    -- Session data
    ip_address INET,
    user_agent TEXT,
    
    -- Expiration
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_sessions_token_hash (token_hash),
    INDEX idx_sessions_expires_at (expires_at)
);

-- API Keys table (for user's own API key generation)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    last_four VARCHAR(4) NOT NULL,
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['chat', 'compare'],
    
    -- Usage tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    request_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Indexes
    INDEX idx_api_keys_key_hash (key_hash)
);

-- Audit log for sensitive operations
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Index for querying
    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_created_at (created_at DESC)
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW user_usage_summary AS
SELECT 
    u.id,
    u.username,
    u.preferred_model,
    COUNT(DISTINCT c.id) as total_conversations,
    COUNT(DISTINCT m.id) as total_messages,
    COALESCE(SUM(m.total_tokens), 0) as total_tokens_used,
    COALESCE(SUM(m.total_cost), 0) as total_cost_incurred,
    u.monthly_token_limit,
    u.monthly_cost_limit
FROM users u
LEFT JOIN conversations c ON u.id = c.user_id AND c.state = 'active'
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY u.id;

-- Initial admin user (password: changeme123)
INSERT INTO users (email, username, password_hash, full_name, monthly_token_limit, monthly_cost_limit)
VALUES (
    'rob@noizy.ai',
    'rob',
    '$2b$10$YourHashedPasswordHere',
    'Rob - NOIZY Empire',
    100000000, -- 100M tokens for Rob
    10000.00   -- $10k monthly limit
);
