-- NOIZYLAB Repairs Database Schema
-- Target: 12 repairs/day @ $89 = $256K+ annual

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    province TEXT DEFAULT 'ON',
    postal_code TEXT,
    preferred_contact TEXT DEFAULT 'email',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_repairs INTEGER DEFAULT 0,
    lifetime_value REAL DEFAULT 0,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_id ON customers(customer_id);

-- Repairs table
CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT UNIQUE NOT NULL,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    device_type TEXT NOT NULL,
    device_model TEXT,
    serial_number TEXT,
    issue_description TEXT NOT NULL,
    diagnosis TEXT,
    repair_notes TEXT,
    parts_used TEXT,
    status TEXT DEFAULT 'intake',
    priority TEXT DEFAULT 'normal',
    price REAL DEFAULT 89.00,
    paid INTEGER DEFAULT 0,
    payment_method TEXT,
    payment_date DATETIME,
    technician TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_repairs_ticket ON repairs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_repairs_status ON repairs(status);
CREATE INDEX IF NOT EXISTS idx_repairs_created ON repairs(created_at);
CREATE INDEX IF NOT EXISTS idx_repairs_customer ON repairs(customer_id);

-- Status history for tracking workflow
CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES repairs(ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_status_ticket ON status_history(ticket_id);

-- Daily metrics for tracking progress toward goals
CREATE TABLE IF NOT EXISTS daily_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    repairs_completed INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    avg_repair_time_hours REAL,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON daily_metrics(date);

-- Valid repair statuses
-- intake: Just received
-- diagnosed: Problem identified
-- in_progress: Being repaired
-- waiting_parts: Need parts
-- completed: Fixed, awaiting pickup
-- picked_up: Customer collected
-- cancelled: Cancelled by customer
