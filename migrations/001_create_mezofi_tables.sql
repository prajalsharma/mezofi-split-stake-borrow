-- migrations/001_create_mezofi_tables.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  phone TEXT,
  email TEXT,
  wallet_address TEXT,
  collateral_btc_address TEXT,
  fiat_currency TEXT DEFAULT 'INR',
  kyc_status TEXT DEFAULT 'NOT_SUBMITTED',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS txs (
  id SERIAL PRIMARY KEY,
  from_user TEXT REFERENCES users(id),
  to_user TEXT REFERENCES users(id),
  amount_fiat NUMERIC NOT NULL,
  amount_musd NUMERIC,
  tx_hash TEXT,
  borrow_used BOOLEAN DEFAULT false,
  borrow_amount_musd NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  creator TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  currency TEXT DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT now(),
  vault_deposited BOOLEAN DEFAULT false,
  vault_receipt_token TEXT,
  vault_deposit_tx TEXT,
  vault_withdraw_tx TEXT
);

CREATE TABLE IF NOT EXISTS trip_members (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  user_id TEXT REFERENCES users(id),
  stake_amount_musd NUMERIC DEFAULT 0,
  stake_btc_addr TEXT,
  share_percent NUMERIC DEFAULT 0,
  joined_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  trip_id INTEGER REFERENCES trips(id) DEFAULT NULL,
  merchant TEXT,
  amount_fiat NUMERIC,
  amount_musd NUMERIC,
  category TEXT,
  date DATE DEFAULT NULL,
  ocr_raw JSONB,
  onchain_tx TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  amount_musd NUMERIC,
  borrow_tx TEXT,
  closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  apr NUMERIC
);

-- Optional notifications table can be added as needed
