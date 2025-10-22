-- Migration: Add MUSD denomination fields and create transactions table
-- This migration enhances the existing schema to support MUSD-based operations

-- Add transactions table for payment tracking
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  amount_musd REAL NOT NULL,
  amount_fiat REAL,
  currency TEXT,
  tx_hash TEXT,
  memo TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  confirmed_at TEXT,
  FOREIGN KEY (from_user_id) REFERENCES users(id),
  FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- Add MUSD balance tracking to users (optional - can be calculated from transactions)
ALTER TABLE users ADD COLUMN musd_balance REAL DEFAULT 0.0;

-- Add original fiat amounts to existing expense records for better tracking
-- Note: In production, you may want to handle existing data migration carefully
ALTER TABLE expenses ADD COLUMN amount_fiat REAL;
ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'USD';

-- Update expense splits to include original fiat calculations
ALTER TABLE expense_splits ADD COLUMN amount_fiat REAL;

-- Add loan status tracking improvements
ALTER TABLE loans ADD COLUMN loan_id TEXT; -- External Mezo loan ID
ALTER TABLE loans ADD COLUMN collateral_type TEXT DEFAULT 'BTC';
ALTER TABLE loans ADD COLUMN auto_borrowed INTEGER DEFAULT 0; -- Boolean flag

-- Add staking vault information
ALTER TABLE stakes ADD COLUMN vault_id TEXT; -- Mezo vault ID if deposited
ALTER TABLE stakes ADD COLUMN deposit_tx_hash TEXT;

-- Add group vault tracking for trip pooling
CREATE TABLE IF NOT EXISTS group_vaults (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER NOT NULL,
  vault_id TEXT NOT NULL,
  total_deposited REAL NOT NULL DEFAULT 0.0,
  current_value REAL NOT NULL DEFAULT 0.0,
  yield_earned REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL,
  settled_at TEXT,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

-- Add payment requests table for QR code generation tracking
CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount_fiat REAL,
  currency TEXT DEFAULT 'USD',
  expires_at TEXT NOT NULL,
  fulfilled INTEGER DEFAULT 0,
  fulfilled_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add OCR receipts table for expense image processing
CREATE TABLE IF NOT EXISTS receipt_ocr (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_id INTEGER,
  image_url TEXT,
  extracted_text TEXT,
  merchant_name TEXT,
  total_amount REAL,
  currency TEXT,
  confidence_score REAL,
  processing_status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (expense_id) REFERENCES expenses(id)
);

-- Add notification events table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'payment', 'expense', 'trip', 'loan'
  data TEXT, -- JSON data for the notification
  read INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  read_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_requests_user ON payment_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_requests_expires ON payment_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_receipt_ocr_expense ON receipt_ocr(expense_id);
CREATE INDEX IF NOT EXISTS idx_receipt_ocr_status ON receipt_ocr(processing_status);

CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans(user_id, status);
CREATE INDEX IF NOT EXISTS idx_stakes_group_active ON stakes(group_id, active);

-- Add some helpful views for common queries
CREATE VIEW IF NOT EXISTS user_balances AS
SELECT 
  u.id,
  u.name,
  u.address,
  u.musd_balance,
  COALESCE(incoming.total, 0) as total_received,
  COALESCE(outgoing.total, 0) as total_sent,
  (COALESCE(incoming.total, 0) - COALESCE(outgoing.total, 0)) as net_balance
FROM users u
LEFT JOIN (
  SELECT to_user_id, SUM(amount_musd) as total
  FROM transactions 
  WHERE status = 'confirmed'
  GROUP BY to_user_id
) incoming ON u.id = incoming.to_user_id
LEFT JOIN (
  SELECT from_user_id, SUM(amount_musd) as total
  FROM transactions 
  WHERE status = 'confirmed'
  GROUP BY from_user_id
) outgoing ON u.id = outgoing.from_user_id;

-- View for group financial summary
CREATE VIEW IF NOT EXISTS group_financials AS
SELECT 
  g.id,
  g.name,
  COUNT(gm.id) as member_count,
  COALESCE(stakes_summary.total_staked, 0) as total_staked,
  COALESCE(stakes_summary.active_stakes, 0) as active_stakes,
  COALESCE(expenses_summary.total_expenses, 0) as total_expenses,
  COALESCE(expenses_summary.expense_count, 0) as expense_count
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN (
  SELECT 
    group_id, 
    SUM(amount) as total_staked,
    COUNT(*) as active_stakes
  FROM stakes 
  WHERE active = 1
  GROUP BY group_id
) stakes_summary ON g.id = stakes_summary.group_id
LEFT JOIN (
  SELECT 
    group_id,
    SUM(amount) as total_expenses,
    COUNT(*) as expense_count
  FROM expenses
  GROUP BY group_id
) expenses_summary ON g.id = expenses_summary.group_id
GROUP BY g.id, g.name;

-- Add triggers for automatic balance updates (optional)
-- Note: In production, you might want to handle balance updates through application logic

/*
CREATE TRIGGER IF NOT EXISTS update_user_balance_on_transaction_confirm
AFTER UPDATE OF status ON transactions
WHEN NEW.status = 'confirmed' AND OLD.status != 'confirmed'
BEGIN
  UPDATE users SET musd_balance = musd_balance - NEW.amount_musd 
  WHERE id = NEW.from_user_id;
  
  UPDATE users SET musd_balance = musd_balance + NEW.amount_musd 
  WHERE id = NEW.to_user_id;
END;
*/

-- Insert default currencies configuration (optional)
-- This could be moved to application-level configuration
CREATE TABLE IF NOT EXISTS supported_currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimals INTEGER DEFAULT 2,
  active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO supported_currencies (code, name, symbol, decimals, active) VALUES
('USD', 'US Dollar', '$', 2, 1),
('INR', 'Indian Rupee', '₹', 2, 1),
('EUR', 'Euro', '€', 2, 1),
('GBP', 'British Pound', '£', 2, 1),
('CAD', 'Canadian Dollar', 'C$', 2, 1),
('JPY', 'Japanese Yen', '¥', 0, 1),
('AUD', 'Australian Dollar', 'A$', 2, 1),
('CHF', 'Swiss Franc', 'CHF', 2, 1);

-- Add expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  active INTEGER DEFAULT 1
);

INSERT OR IGNORE INTO expense_categories (name, icon, color, active) VALUES
('Food & Dining', '🍕', '#FF6B6B', 1),
('Transportation', '🚗', '#4ECDC4', 1),
('Accommodation', '🏨', '#45B7D1', 1),
('Entertainment', '🎬', '#96CEB4', 1),
('Groceries', '🛒', '#FFEAA7', 1),
('Shopping', '🛍️', '#DDA0DD', 1),
('Health & Medical', '⚕️', '#FF7675', 1),
('Utilities', '💡', '#74B9FF', 1),
('Other', '📝', '#A29BFE', 1);

-- Add admin/system configuration table
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_config (key, value, description, updated_at) VALUES
('musd_usd_rate', '1.0', 'Current MUSD to USD exchange rate', datetime('now')),
('default_loan_duration', '30', 'Default loan duration in days', datetime('now')),
('max_active_loans_per_user', '5', 'Maximum active loans per user', datetime('now')),
('min_collateral_ratio', '1.1', 'Minimum collateral ratio for loans', datetime('now')),
('default_staking_apy', '0.05', 'Default staking APY (5%)', datetime('now')),
('qr_expiry_hours', '24', 'QR code expiry time in hours', datetime('now')),
('app_version', '1.0.0', 'Current application version', datetime('now'));

-- Migration completion marker
INSERT OR IGNORE INTO app_config (key, value, description, updated_at) VALUES
('migration_001_completed', 'true', 'MUSD fields and tables migration completed', datetime('now'));