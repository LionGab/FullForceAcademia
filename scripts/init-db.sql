-- Full Force Academia Database Initialization Script
-- This script creates the initial database schema and inserts basic data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create basic roles and permissions
DO $$
BEGIN
    -- Create application role if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'academia_app') THEN
        CREATE ROLE academia_app;
    END IF;

    -- Grant necessary permissions
    GRANT CONNECT ON DATABASE n8n TO academia_app;
    GRANT USAGE ON SCHEMA public TO academia_app;
    GRANT CREATE ON SCHEMA public TO academia_app;
END
$$;

-- Create academy configuration table for multi-academy support
CREATE TABLE IF NOT EXISTS academy_config (
    id SERIAL PRIMARY KEY,
    academy_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    business_hours JSONB DEFAULT '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "08:00", "close": "18:00"}, "sunday": {"open": "08:00", "close": "14:00"}}',
    welcome_message TEXT DEFAULT '🔥 Olá! Sou o assistente virtual da Academia Full Force! Como posso ajudá-lo hoje?',
    out_of_hours_message TEXT DEFAULT '⏰ No momento estamos fechados. Deixe sua mensagem que retornaremos em breve!',
    settings JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default academy configuration
INSERT INTO academy_config (academy_name, phone, address) VALUES
('Academia Full Force', '+5511999999999', 'Rua das Academias, 123 - São Paulo, SP')
ON CONFLICT (phone) DO NOTHING;

-- Insert initial performance baseline
INSERT INTO performance_metrics (metric_type, metric_value, metric_unit, metric_metadata) VALUES
('database_initialized', 1, 'boolean', '{"version": "3.0.0", "timestamp": "' || CURRENT_TIMESTAMP || '"}');